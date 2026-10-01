import { spawn } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CIDR_COVER_EXAMPLES } from '../packages/contracts/src/index';
import { waitForDeployment } from './deployment-readiness';

const origin = 'https://service.example';
const commit = '0123456789abcdef0123456789abcdef01234567';
const previousCommit = '89abcdef0123456789abcdef0123456789abcdef';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function clock() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
}

function html(script = '/assets/main.js') {
  return new Response(`<script type="module" src="${script}"></script>`, {
    headers: { 'content-type': 'text/html' },
  });
}

function javascript(value = commit) {
  return new Response(`const sourceCommit = "${value}";`, {
    headers: { 'content-type': 'application/javascript' },
  });
}

describe('deployment version wait', () => {
  it('waits through 45 seconds of old assets, then accepts the expected version', async () => {
    clock();
    const start = performance.now();
    const fetch = vi.fn(async (input: Parameters<typeof globalThis.fetch>[0]) => {
      if (new URL(String(input)).pathname === '/') return html();
      return javascript(performance.now() - start < 45_000 ? previousCommit : commit);
    });
    vi.stubGlobal('fetch', fetch);
    let ready = false;
    const pending = waitForDeployment(origin, commit).then(() => { ready = true; });
    await vi.advanceTimersByTimeAsync(44_999);
    expect(ready).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(ready).toBe(true);
    expect(fetch.mock.calls.every(([input]) => [origin + '/', origin + '/assets/main.js'].includes(String(input)))).toBe(true);
    expect(fetch).toHaveBeenCalledWith(new URL(origin), expect.objectContaining({
      cache: 'no-store', credentials: 'omit', redirect: 'error', signal: expect.any(AbortSignal),
    }));
  });

  it('fails at the total 90-second deadline when the expected version never appears', async () => {
    clock();
    const fetch = vi.fn(async (input: Parameters<typeof globalThis.fetch>[0]) =>
      new URL(String(input)).pathname === '/' ? html() : javascript(previousCommit));
    vi.stubGlobal('fetch', fetch);
    const failure = expect(waitForDeployment(origin, commit)).rejects.toThrow('not ready within 90 seconds');
    await vi.advanceTimersByTimeAsync(90_000);
    await failure;
    expect(fetch).toHaveBeenCalledTimes(36);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['headers', 'body'])('bounds stalled %s by the same total deadline', async stage => {
    clock();
    const signals: AbortSignal[] = [];
    vi.stubGlobal('fetch', async (_input: Parameters<typeof globalThis.fetch>[0], options: RequestInit) => {
      const signal = options.signal!;
      signals.push(signal);
      if (stage === 'headers') return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
      return new Response(new ReadableStream({
        start(controller) {
          signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
        },
      }), { headers: { 'content-type': 'text/html' } });
    });
    const failure = expect(waitForDeployment(origin, commit)).rejects.toThrow('not ready within 90 seconds');
    await vi.advanceTimersByTimeAsync(90_000);
    await failure;
    expect(signals).toHaveLength(5);
    expect(signals.every(signal => signal.aborted)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['request', 'body', 'missing asset'])('retries a temporary %s failure without exposing it', async stage => {
    clock();
    const fetch = vi.fn();
    if (stage === 'request') fetch.mockRejectedValueOnce(new Error('private transfer detail'));
    else if (stage === 'body') fetch.mockResolvedValueOnce(new Response(new ReadableStream({
      start(controller) { controller.error(new Error('private transfer detail')); },
    }), { headers: { 'content-type': 'text/html' } }));
    else fetch.mockResolvedValueOnce(new Response('Unavailable', { status: 404 }));
    fetch.mockImplementation(async (input: Parameters<typeof globalThis.fetch>[0]) =>
      new URL(String(input)).pathname === '/' ? html() : javascript());
    vi.stubGlobal('fetch', fetch);
    const pending = waitForDeployment(origin, commit);
    await vi.advanceTimersByTimeAsync(5_000);
    await pending;
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('checks only a same-origin bundled script, even when HTML also references other URLs', async () => {
    const fetch = vi.fn(async (input: Parameters<typeof globalThis.fetch>[0]) =>
      new URL(String(input)).pathname === '/' ? new Response(
        '<script src="https://other.example/main.js"></script><script src="/api/main.js"></script>'
        + '<script src="/assets/../api/main.js"></script><script src="/assets/main.js"></script>',
        { headers: { 'content-type': 'text/html' } },
      ) : javascript());
    vi.stubGlobal('fetch', fetch);
    await waitForDeployment(origin, commit);
    expect(fetch.mock.calls.map(([input]) => String(input))).toEqual([origin + '/', origin + '/assets/main.js']);
  });

  it.each([
    { target: 'relative', expected: commit },
    { target: 'https://service.example/api', expected: commit },
    { target: 'https://user@service.example', expected: commit },
    { target: origin, expected: '' },
    { target: origin, expected: 'invalid' },
  ])('rejects an invalid origin or missing build commit before any request: $target/$expected', async ({ target, expected }) => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(waitForDeployment(target, expected)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});

async function listen(server: Server): Promise<string> {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing local server address');
  return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

async function smoke(target: string) {
  const script = fileURLToPath(new URL('../apps/worker/scripts/smoke.ts', import.meta.url));
  return new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', script, target], {
      env: { ...process.env, VITE_GIT_COMMIT: commit }, timeout: 15_000,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', status => resolve({ status, stdout, stderr }));
  });
}

describe('readiness followed by the existing production smoke check', () => {
  it.each(['API', 'MCP'])('still fails for a functional %s error after the version is ready', async failed => {
    const requested: string[] = [];
    const server = createServer((request, response) => {
      const path = request.url!;
      requested.push(path);
      const send = (type: string, body: string, status = 200) => {
        response.writeHead(status, { 'content-type': type });
        response.end(body);
      };
      const mainHtml = '<title>Smallest Covering CIDR — Packetrove</title>'
        + '<script src="/assets/main.js"></script><link href="/assets/main.css">';
      if (path === '/') return send('text/html', mainHtml);
      if (path === '/assets/main.js') return send('application/javascript', `const sourceCommit = "${commit}";`);
      if (path === '/assets/main.css') return send('text/css', 'body { margin: 0; }');
      if (path === '/ip' || path === '/ip/') return send('text/html', '<title>My Public IP — Packetrove</title>');
      if (path === '/missing-page') return send('text/html', '<h1>Page not found</h1><a href="/">Return to home</a>', 404);
      if (path === '/assets/missing.js') return send('text/html', '', 404);
      if (path === '/api/unknown') return send('application/json', JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } }), 404);
      if (path === '/health') return send('application/json', JSON.stringify({ status: failed === 'API' ? 'broken' : 'ok' }));
      if (path === '/api/openapi.json') return send('application/json', JSON.stringify({
        openapi: '3.1.0', paths: { '/api/v1/cidr/cover': {}, '/api/v1/ip': {} },
      }));
      if (path === '/api/v1/ip') {
        response.setHeader('cache-control', 'no-store');
        return send('application/json', JSON.stringify({ ip: '203.0.113.1', family: 'ipv4' }));
      }
      if (path === '/api/v1/cidr/cover') {
        let body = '';
        request.on('data', chunk => { body += chunk; });
        request.on('end', () => {
          const value = JSON.parse(body) as { inputs: string[] };
          const example = CIDR_COVER_EXAMPLES.find(example => JSON.stringify(example.request) === JSON.stringify(value));
          if (example) send('application/json', JSON.stringify(example.result));
          else send('application/json', JSON.stringify({ error: { code: 'MIXED_ADDRESS_FAMILIES' } }), 400);
        });
        return;
      }
      if (path === '/mcp') {
        response.setHeader('cache-control', 'no-store');
        return send('application/json', JSON.stringify({ error: 'Unavailable' }), 500);
      }
      send('text/plain', '', 404);
    });
    const target = await listen(server);
    try {
      await waitForDeployment(target, commit);
      expect(requested).toEqual(['/', '/assets/main.js']);
      const execution = await smoke(target);
      expect(execution.status).toBe(1);
      expect(execution.stdout).toContain('PASS website build commit matches the deployment');
      expect(execution.stderr).toContain(failed === 'API' ? 'broken' : '500');
      expect(requested).toContain(failed === 'API' ? '/health' : '/mcp');
      expect(execution.stdout).not.toContain('Verified ');
    } finally {
      await close(server);
    }
  });
});
