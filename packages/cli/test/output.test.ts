import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CidrCoverResultSchema, ErrorResponseSchema } from '@packetrove/contracts';
import { smallestCoveringCidr } from '@packetrove/core';

const bundle = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const outputError = {
  code: 'INTERNAL_ERROR',
  message: 'Unable to write command output. The output destination may have closed.',
};

async function closeOutput(args: string[], closeError = false) {
  const child = spawn(process.execPath, [bundle, ...args], {
    stdio: ['ignore', 'pipe', 'pipe'], timeout: 10_000,
  });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { stderr += chunk; });
  const completion = new Promise<{ status: number | null; signal: string | null; stderr: string }>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (status, signal) => resolve({ status, signal, stderr }));
  });
  // Close the real pipe before the new process loads and attempts its first write.
  child.stdout.destroy();
  if (closeError) child.stderr.destroy();
  return completion;
}

describe('bundled CLI output streams', () => {
  it.each([
    { name: 'CIDR JSON', args: ['cidr', 'cover', '203.0.113.1', '--json'], json: true },
    { name: 'CIDR readable result', args: ['cidr', 'cover', '203.0.113.1'], json: false },
    { name: 'help', args: ['--help'], json: false },
    { name: 'help with JSON errors', args: ['--help', '--json'], json: true },
  ])('reports a closed stdout destination for $name without a native stack', async ({ args, json }) => {
    const execution = await closeOutput(args);
    expect(execution.status).toBe(1);
    expect(execution.signal).toBeNull();
    if (json) expect(ErrorResponseSchema.parse(JSON.parse(execution.stderr)).error).toEqual(outputError);
    else expect(execution.stderr).toBe(`${outputError.code}: ${outputError.message}\n`);
    expect(execution.stderr).not.toMatch(/EPIPE|Unhandled|node:events/);
  });

  it('keeps validation errors when stdout closes before any output is attempted', async () => {
    const execution = await closeOutput(['cidr', 'cover', 'invalid', '--json']);
    expect(execution.status).toBe(1);
    expect(execution.signal).toBeNull();
    expect(ErrorResponseSchema.parse(JSON.parse(execution.stderr)).error.code).toBe('INVALID_INPUT');
  });

  it.each([
    { name: 'output failure', args: ['cidr', 'cover', '203.0.113.1', '--json'] },
    { name: 'validation failure', args: ['cidr', 'cover', 'invalid', '--json'] },
  ])('exits with the failure status when stderr is also unavailable for $name', async ({ args }) => {
    const execution = await closeOutput(args, true);
    expect(execution.status).toBe(1);
    expect(execution.signal).toBeNull();
    expect(execution.stderr).toBe('');
  });

  it('handles a closed stdout after a real local IP response', async () => {
    let requestedPath = '';
    const server = createServer((request, response) => {
      requestedPath = request.url ?? '';
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ ip: '198.51.100.2', family: 'ipv4' }));
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing local test server address');
    try {
      const execution = await closeOutput(['public-ip', '--api-origin', `http://127.0.0.1:${address.port}`, '--json']);
      expect(execution.status).toBe(1);
      expect(execution.signal).toBeNull();
      expect(ErrorResponseSchema.parse(JSON.parse(execution.stderr)).error).toEqual(outputError);
      expect(requestedPath).toBe('/v1/public-ip');
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });

  it('still succeeds when a pipe consumer reads the complete JSON line and exits', async () => {
    const receiver = spawn(process.execPath, ['-e', `
      let line = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk => {
        line += chunk;
        const end = line.indexOf('\\n');
        if (end >= 0) process.stdout.write(line.slice(0, end + 1), () => process.exit(0));
      });
    `], { stdio: ['pipe', 'pipe', 'pipe'], timeout: 10_000 });
    const inputs = ['::/0'];
    const sender = spawn(process.execPath, [bundle, 'cidr', 'cover', ...inputs, '--json'], {
      stdio: ['ignore', receiver.stdin, 'pipe'], timeout: 10_000,
    });
    let stdout = '';
    let stderr = '';
    receiver.stdout.setEncoding('utf8');
    receiver.stdout.on('data', chunk => { stdout += chunk; });
    for (const stream of [receiver.stderr, sender.stderr]) {
      stream.setEncoding('utf8'); stream.on('data', chunk => { stderr += chunk; });
    }
    const completions = [sender, receiver].map(child => new Promise<number | null>((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (status, signal) => signal ? reject(new Error(`Unexpected test process signal: ${signal}`)) : resolve(status));
    }));
    // Release only this parent's duplicate descriptor, without shutting down the sender's socket.
    receiver.stdin.destroy();
    try {
      expect(await Promise.all(completions)).toEqual([0, 0]);
      expect(stderr).toBe('');
      expect(CidrCoverResultSchema.parse(JSON.parse(stdout))).toEqual(smallestCoveringCidr({ inputs }));
      expect(JSON.parse(stdout).coveredAddressCount).toBe('340282366920938463463374607431768211456');
    } finally {
      sender.kill(); receiver.kill();
    }
  });
});
