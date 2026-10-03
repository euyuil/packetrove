import { createServer } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTOMATION_RUN_ID_HEADER, AUTOMATION_TOKEN_HEADER } from '../apps/worker/src/automation-headers';
import { createMcpSmokeFetch, readSmokeAutomation } from './mcp-smoke-transport';

const token = 'a'.repeat(64);
const runId = '1234567890';
const endpoint = new URL('https://api.example/mcp');

afterEach(() => { vi.restoreAllMocks(); });

describe('automated smoke configuration', () => {
  it('keeps manual smoke checks credential-free', () => {
    expect(readSmokeAutomation({})).toBeUndefined();
    expect(readSmokeAutomation({ GITHUB_RUN_ID: runId })).toBeUndefined();
  });

  it('requires the dedicated secret in GitHub Actions', () => {
    expect(() => readSmokeAutomation({ GITHUB_ACTIONS: 'true', GITHUB_RUN_ID: runId }))
      .toThrow('Configure PACKETROVE_AUTOMATION_TOKEN');
    expect(readSmokeAutomation({ GITHUB_ACTIONS: 'true', PACKETROVE_AUTOMATION_TOKEN: token, GITHUB_RUN_ID: runId }))
      .toEqual({ token, runId });
  });

  it.each(['short', 'g'.repeat(64), 'A'.repeat(64), token + '\n'])('rejects malformed tokens without exposing them', value => {
    try {
      readSmokeAutomation({ PACKETROVE_AUTOMATION_TOKEN: value, GITHUB_RUN_ID: runId });
      expect.fail('Malformed token was accepted.');
    } catch (error) {
      expect(String(error)).toContain('64-character lowercase hexadecimal');
      expect(String(error)).not.toContain(value);
    }
  });

  it.each([undefined, '', '0', '01', '123,456', '1'.repeat(21), runId + '\n'])(
    'rejects missing or malformed automation run identifiers', value => {
      expect(() => readSmokeAutomation({ PACKETROVE_AUTOMATION_TOKEN: token, GITHUB_RUN_ID: value }))
        .toThrow('valid GITHUB_RUN_ID');
    },
  );
});

describe('MCP smoke request boundaries', () => {
  it('marks every request while preserving protocol, Origin, body, and signal', async () => {
    const requests: Request[] = [];
    const fetcher: typeof fetch = async (input, init) => {
      requests.push(new Request(input, init));
      return new Response('{}');
    };
    const mcpFetch = createMcpSmokeFetch(endpoint, { token, runId }, fetcher);
    for (const method of ['initialize', 'notifications/initialized', 'tools/list', 'tools/call']) {
      const controller = new AbortController();
      const body = JSON.stringify({ jsonrpc: '2.0', method });
      await mcpFetch(endpoint, {
        method: 'POST', headers: { origin: 'https://website.example', 'content-type': 'application/json',
          'mcp-protocol-version': '2025-11-25' }, body, signal: controller.signal,
      });
      const request = requests.at(-1)!;
      expect(request.headers.get(AUTOMATION_TOKEN_HEADER)).toBe(token);
      expect(request.headers.get(AUTOMATION_RUN_ID_HEADER)).toBe(runId);
      expect(request.headers.get('origin')).toBe('https://website.example');
      expect(request.headers.get('mcp-protocol-version')).toBe('2025-11-25');
      expect(await request.text()).toBe(body);
      expect(request.redirect).toBe('error');
      controller.abort();
      expect(request.signal.aborted).toBe(true);
    }
  });

  it('does not send automation headers when manual checks are unmarked', async () => {
    const fetcher = vi.fn(async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      const request = new Request(input, init);
      expect(request.headers.has(AUTOMATION_TOKEN_HEADER)).toBe(false);
      expect(request.headers.has(AUTOMATION_RUN_ID_HEADER)).toBe(false);
      return new Response('{}');
    });
    await createMcpSmokeFetch(endpoint, undefined, fetcher)(endpoint, {
      headers: { [AUTOMATION_TOKEN_HEADER]: token, [AUTOMATION_RUN_ID_HEADER]: runId },
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it.each(['https://website.example/mcp', 'https://api.example/health', 'https://api.example/mcp?other=1'])(
    'rejects requests outside the exact MCP endpoint before sending credentials', async url => {
      const fetcher = vi.fn<typeof fetch>();
      await expect(createMcpSmokeFetch(endpoint, { token, runId }, fetcher)(url)).rejects
        .toThrow('configured MCP endpoint');
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it('does not follow redirects with the automation credential', async () => {
    let receivedRedirect = false;
    const server = createServer((request, response) => {
      if (request.url === '/mcp') response.writeHead(307, { location: '/redirected' }).end();
      else { receivedRedirect = true; response.end('{}'); }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Expected a TCP listener.');
      const localEndpoint = new URL(`http://127.0.0.1:${address.port}/mcp`);
      await expect(createMcpSmokeFetch(localEndpoint, { token, runId })(localEndpoint)).rejects.toThrow();
      expect(receivedRedirect).toBe(false);
    } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  });
});
