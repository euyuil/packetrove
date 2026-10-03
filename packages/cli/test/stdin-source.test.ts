import { spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CidrCoverResultSchema, ErrorResponseSchema } from '@packetrove/contracts';
import { smallestCoveringCidr } from '@packetrove/core';
import { appendStandardInput } from '../src/stdin';

const bundle = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const address = '203.0.113.1';
const directoryMessage = 'Standard input is a directory. Redirect a text file or pipe address lines instead.';

function fromSource(path: string, args: string[]) {
  const fd = openSync(path, 'r');
  try {
    const execution = spawnSync(process.execPath, [bundle, 'cidr-cover', address, ...args], {
      stdio: [fd, 'pipe', 'pipe'], encoding: 'utf8', timeout: 10_000,
    });
    if (execution.error) throw execution.error;
    expect(execution.signal).toBeNull();
    return execution;
  } finally {
    closeSync(fd);
  }
}

function withDirectory(test: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), 'packetrove-stdin-source-'));
  try { test(directory); } finally { rmSync(directory, { recursive: true, force: true }); }
}

describe('bundled CLI standard-input sources', () => {
  // Directory-descriptor redirection is exercised on POSIX hosts.
  it.skipIf(process.platform === 'win32')('rejects a directory even when positional inputs could produce a successful JSON result', () => {
    withDirectory(directory => {
      const execution = fromSource(directory, ['--stdin', '--json']);
      expect(execution.status).toBe(1);
      expect(execution.stdout).toBe('');
      expect(ErrorResponseSchema.parse(JSON.parse(execution.stderr))).toEqual({
        error: { code: 'INVALID_INPUT', message: directoryMessage },
      });
    });
  });

  it.skipIf(process.platform === 'win32')('reports the directory failure in readable stderr without a native stack or path', () => {
    withDirectory(directory => {
      const execution = fromSource(directory, ['--stdin']);
      expect(execution.status).toBe(1);
      expect(execution.stdout).toBe('');
      expect(execution.stderr).toBe('INVALID_INPUT: ' + directoryMessage + '\n');
    });
  });

  it.skipIf(process.platform === 'win32')('does not inspect redirected input unless --stdin is selected', () => {
    withDirectory(directory => {
      const execution = fromSource(directory, ['--json']);
      expect(execution.status).toBe(0);
      expect(execution.stderr).toBe('');
      expect(CidrCoverResultSchema.parse(JSON.parse(execution.stdout))).toEqual(smallestCoveringCidr({ inputs: [address] }));
    });
  });

  it.each([
    { name: 'an empty file', content: '', inputs: [address] },
    { name: 'a regular file', content: '\r\n 203.0.113.2 \r\n\r\n203.0.113.6\n', inputs: [address, '203.0.113.2', '203.0.113.6'] },
  ])('continues combining positional inputs with $name', ({ content, inputs }) => {
    withDirectory(directory => {
      const path = join(directory, 'addresses.txt');
      writeFileSync(path, content);
      const execution = fromSource(path, ['--stdin', '--json']);
      expect(execution.status).toBe(0);
      expect(execution.stderr).toBe('');
      expect(CidrCoverResultSchema.parse(JSON.parse(execution.stdout))).toEqual(smallestCoveringCidr({ inputs }));
    });
  });

  it('continues reading regular files and returns every invalid entry after positional inputs', () => {
    withDirectory(directory => {
      const path = join(directory, 'invalid-addresses.txt');
      writeFileSync(path, 'bad\n203.0.113.2\n::/129\n');
      const execution = fromSource(path, ['--stdin', '--json']);
      expect(execution.status).toBe(1);
      expect(execution.stdout).toBe('');
      const error = ErrorResponseSchema.parse(JSON.parse(execution.stderr)).error;
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.issues?.map(issue => issue.index)).toEqual([1, 3]);
    });
  });

  it('propagates source inspection failures and destroys the source instead of treating them as EOF', async () => {
    const source = Object.assign(Readable.from([address]), { fd: 0x7fffffff });
    const inputs = [address];
    await expect(appendStandardInput(inputs, source)).rejects.toMatchObject({ code: 'EBADF' });
    expect(source.destroyed).toBe(true);
    expect(inputs).toEqual([address]);
  });
});
