import { spawn } from 'node:child_process';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ErrorResponseSchema, PublicIpResultSchema } from '@packetrove/contracts';

const bundle = fileURLToPath(new URL('../dist/cli.js', import.meta.url));

async function run(args: string[]) {
  return new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [bundle, ...args], { timeout: 15_000 });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', status => resolve({ status, stdout, stderr }));
  });
}

async function withApi(handler: (request: IncomingMessage, response: ServerResponse) => void,
  check: (origin: string) => Promise<void>) {
  const server = createServer(handler);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test server address');
  try { await check(`http://127.0.0.1:${address.port}`); } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

describe('bundled public IP CLI', () => {
  it.each([
    { ip: '203.0.113.1', family: 'ipv4' },
    { ip: '2001:db8::7', family: 'ipv6' },
  ])('queries the API and prints shared JSON: $ip', async result => {
    let requestedPath = '';
    let accept = '';
    await withApi((request, response) => {
      requestedPath = request.url ?? '';
      accept = request.headers.accept ?? '';
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(result));
    }, async origin => {
      const execution = await run(['ip', '--api-origin', origin, '--json']);
      expect(execution.status).toBe(0);
      expect(execution.stderr).toBe('');
      expect(PublicIpResultSchema.parse(JSON.parse(execution.stdout))).toEqual(result);
    });
    expect(requestedPath).toBe('/v1/ip');
    expect(accept).toBe('application/json');
  });

  it('prints just the IP without --json for shell use', async () => {
    await withApi((_request, response) => {
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ ip: '203.0.113.1', family: 'ipv4' }));
    }, async origin => {
      const execution = await run(['ip', '--api-origin', origin]);
      expect(execution.status).toBe(0);
      expect(execution.stdout).toBe('203.0.113.1\n');
      expect(execution.stderr).toBe('');
    });
  });

  it.each([
    [503, { error: { code: 'CLIENT_IP_UNAVAILABLE', message: 'Connection metadata is unavailable.' } }, 'CLIENT_IP_UNAVAILABLE'],
    [200, { ip: '2001:db8::7', family: 'ipv4' }, 'INVALID_RESPONSE'],
  ])('prints structured errors only to stderr for HTTP %s', async (status, body, code) => {
    await withApi((_request, response) => {
      response.writeHead(status as number, { 'content-type': 'application/json' });
      response.end(JSON.stringify(body));
    }, async origin => {
      const execution = await run(['ip', '--api-origin', origin, '--json']);
      expect(execution.status).toBe(1);
      expect(execution.stdout).toBe('');
      expect(ErrorResponseSchema.parse(JSON.parse(execution.stderr)).error.code).toBe(code);
    });
  });

  it('reports header and body timeouts as network errors with empty stdout', async () => {
    await Promise.all(['headers', 'body'].map(stage => withApi((_request, response) => {
      if (stage === 'body') {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.write('{');
      }
    }, async origin => {
      const execution = await run(['ip', '--api-origin', origin, '--json']);
      expect(execution.status).toBe(1);
      expect(execution.stdout).toBe('');
      expect(ErrorResponseSchema.parse(JSON.parse(execution.stderr)).error).toEqual({
        code: 'NETWORK_ERROR', message: 'Unable to reach the IP lookup service. Check your connection and try again.',
      });
    })));
  }, 20_000);

  it.each([
    { complete: false, code: 'NETWORK_ERROR' },
    { complete: true, code: 'INVALID_RESPONSE' },
  ])('distinguishes an interrupted body from complete malformed JSON: $code', async ({ complete, code }) => {
    await withApi((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.write('{');
      if (complete) response.end();
      else setTimeout(() => response.destroy(), 50);
    }, async origin => {
      const execution = await run(['ip', '--api-origin', origin, '--json']);
      expect(execution.status).toBe(1);
      expect(execution.stdout).toBe('');
      expect(ErrorResponseSchema.parse(JSON.parse(execution.stderr)).error.code).toBe(code);
    });
  });

  it.each([
    ['ip', '--stdin'], ['ip', '203.0.113.1'],
    ['ip', '--api-origin', 'not-a-url'], ['ip', '--api-origin', 'file:///tmp/ip'],
    ['ip', '--api-origin', 'https://example.com/api'],
    ['ip', '--api-origin', ['https://', 'test', ':', 'test', '@example.com'].join('')],
    ['ip', '--api-origin', 'https://example.com?ip=203.0.113.1'],
    ['cidr', 'cover', '203.0.113.1', '--api-origin', 'https://example.com'],
  ].map(args => ({ args })))('rejects invalid lookup arguments without contacting a service: $args', async ({ args }) => {
    const execution = await run([...args, '--json']);
    expect(execution.status).toBe(1);
    expect(execution.stdout).toBe('');
    expect(JSON.parse(execution.stderr).error.code).toBe('INVALID_INPUT');
  });
});
