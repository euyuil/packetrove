import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CidrCoverResultSchema, ErrorResponseSchema } from '@packetrove/contracts';
import { smallestCoveringCidr, ToolError } from '@packetrove/core';
import { appendStandardInput } from '../src/stdin';

const bundle = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const address = '203.0.113.1';

function splitInput(chunks: Array<string | Buffer>): Readable {
  return Readable.from((async function* () {
    for (const chunk of chunks) {
      yield typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      await new Promise<void>(resolve => setImmediate(resolve));
    }
  })(), { objectMode: false });
}

function calculationError(inputs: string[]) {
  try {
    smallestCoveringCidr({ inputs });
    throw new Error('Expected a calculation error');
  } catch (error) {
    expect(error).toBeInstanceOf(ToolError);
    return (error as ToolError).toResponse();
  }
}

describe('bounded standard-input lines', () => {
  it.each([
    { name: 'LF and an unterminated last line', chunks: [' \n', ` ${address} \n`, '\t203.0.113.2\t'] },
    { name: 'CRLF split across chunks and bare CR', chunks: ['\r', '\n', address, '\r', '\n\r', '203.0.113.2\r'] },
  ])('preserves ordering, trim, and blank lines with $name', async ({ chunks }) => {
    const inputs = ['203.0.113.6'];
    await appendStandardInput(inputs, splitInput(chunks));
    expect(inputs).toEqual(['203.0.113.6', address, '203.0.113.2']);
  });

  it('decodes multibyte Unicode trim whitespace split between bytes', async () => {
    const whitespace = '\t\v\f \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';
    const bytes = Buffer.from(`${whitespace}${address}${whitespace}\r\n${whitespace}`);
    const inputs: string[] = [];
    await appendStandardInput(inputs, splitInput(Array.from(bytes, byte => Buffer.from([byte]))));
    expect(inputs).toEqual([address]);
  });

  it.each([
    { name: '64 ASCII characters', entry: 'x'.repeat(64) },
    { name: '65 ASCII characters', entry: 'x'.repeat(65) },
    { name: '64 UTF-16 units in astral characters', entry: '😀'.repeat(32) },
    { name: '65 UTF-16 units in astral characters', entry: '😀'.repeat(32) + 'x' },
    { name: 'an address followed by long internal whitespace', entry: address + ' '.repeat(128) + 'x' },
  ])('keeps the shared validation response for $name', async ({ entry }) => {
    const bytes = Buffer.from(` \t${entry}\u00a0`);
    const inputs: string[] = [];
    await appendStandardInput(inputs, splitInput(Array.from(bytes, byte => Buffer.from([byte]))));
    expect(calculationError(inputs)).toEqual(calculationError([entry]));
  });

  it('preserves every length issue and the existing schema-before-parsing order', async () => {
    const entries = ['bad', 'x'.repeat(65), address, address + ' '.repeat(100) + 'x'];
    const positional = ['bad-positional', 'y'.repeat(65)];
    const inputs = [...positional];
    await appendStandardInput(inputs, splitInput(['\n', ...entries.map(entry => `\t${entry}\r\n`)]));
    const error = calculationError(inputs);
    expect(error).toEqual(calculationError([...positional, ...entries]));
    expect(error.error.issues?.map(issue => issue.index)).toEqual([1, 3, 5]);
    expect(error.error.issues?.every(issue => Object.keys(issue).sort().join(',') === 'index,message')).toBe(true);
  });

  it('accepts the combined 1,000-entry limit and rejects the next nonblank entry', async () => {
    const inputs = [address];
    await appendStandardInput(inputs, splitInput(['\n', `${address}\n`.repeat(999), '\t\r\n']));
    expect(smallestCoveringCidr({ inputs }).normalizedInputs).toHaveLength(1_000);
    const excess = [address];
    await expect(appendStandardInput(excess, splitInput([`${address}\n`.repeat(1_000)])))
      .rejects.toMatchObject({ code: 'INVALID_INPUT', message: 'Use at most 1000 inputs per calculation.' });
  });

  it('propagates a stream read failure and closes the source', async () => {
    const source = new Readable({ read() { this.destroy(new Error('Test input read failed')); } });
    await expect(appendStandardInput([], source)).rejects.toThrow('Test input read failed');
    expect(source.destroyed).toBe(true);
  });
});

async function runWithLimitedHeap(chunks: Iterable<string | Buffer>) {
  const child = spawn(process.execPath, ['--max-old-space-size=32', bundle, 'cidr', 'cover', '--stdin', '--json'], {
    stdio: ['pipe', 'pipe', 'pipe'], timeout: 15_000,
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const completion = new Promise<{ status: number | null; signal: string | null }>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (status, signal) => resolve({ status, signal }));
  });
  const source = Readable.from(chunks, { objectMode: false });
  try {
    const [written, closed] = await Promise.allSettled([pipeline(source, child.stdin), completion]);
    if (closed.status === 'rejected') throw closed.reason;
    expect(written.status).toBe('fulfilled');
    return { ...closed.value, stdout, stderr };
  } finally {
    source.destroy();
    child.kill();
  }
}

function* repeatChunk(chunk: Buffer) {
  // Reuse 32 KiB buffers and real pipe backpressure instead of allocating a huge line.
  for (let count = 0; count < 768; count++) yield chunk;
}

describe('bundled CLI with a 32 MiB heap', () => {
  it('reports an unterminated 24 MiB entry as structured INVALID_INPUT', async () => {
    const execution = await runWithLimitedHeap(repeatChunk(Buffer.alloc(32 * 1_024, 'x')));
    expect(execution.status).toBe(1);
    expect(execution.signal).toBeNull();
    expect(execution.stdout).toBe('');
    expect(ErrorResponseSchema.parse(JSON.parse(execution.stderr)))
      .toEqual(calculationError(['x'.repeat(65)]));
  }, 20_000);

  it('ignores 24 MiB of leading, trailing, and blank-line whitespace', async () => {
    const space = Buffer.alloc(32 * 1_024, ' ');
    const execution = await runWithLimitedHeap((function* () {
      yield* repeatChunk(space);
      yield address;
      yield* repeatChunk(space);
      yield '\r\n';
      yield* repeatChunk(space);
    })());
    expect(execution.status).toBe(0);
    expect(execution.signal).toBeNull();
    expect(execution.stderr).toBe('');
    expect(CidrCoverResultSchema.parse(JSON.parse(execution.stdout)))
      .toEqual(smallestCoveringCidr({ inputs: [address] }));
  }, 20_000);

  it('rejects an address with 24 MiB of internal whitespace before a final character', async () => {
    const execution = await runWithLimitedHeap((function* () {
      yield address;
      yield* repeatChunk(Buffer.alloc(32 * 1_024, ' '));
      yield 'x';
    })());
    expect(execution.status).toBe(1);
    expect(execution.signal).toBeNull();
    expect(execution.stdout).toBe('');
    expect(ErrorResponseSchema.parse(JSON.parse(execution.stderr)))
      .toEqual(calculationError([address + ' '.repeat(100) + 'x']));
  }, 20_000);
});
