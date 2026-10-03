import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { afterEach, expect, it, vi } from 'vitest';
import { toolCatalog, type PublicIpResult } from '@packetrove/contracts';
import { ToolError } from '@packetrove/core';
import { createApp } from '../src/app';
import { createMcpServer } from '../src/mcp';
import { createToolExecutor, toolHandlers } from '../src/tools';
import { getPublicIp } from '../src/ip';
import type { ToolExecutionContext } from '../src/tool-context';

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>(complete => { resolve = complete; });
  return { promise, resolve };
}

afterEach(() => { vi.restoreAllMocks(); });

async function connectedClient(app: ReturnType<typeof createApp>, address = '203.0.113.1') {
  const client = new Client({ name: 'async-boundary-tests', version: '0.1.0' }, { versionNegotiation: { mode: 'auto' } });
  await client.connect(new StreamableHTTPClientTransport(new URL('http://localhost/mcp'), {
    requestInit: { headers: { 'cf-connecting-ip': address } },
    fetch: async (input, init) => {
      const request = new Request(input, init);
      request.headers.set('host', 'localhost');
      return app.fetch(request);
    },
  }));
  return client;
}

it('waits for asynchronous API results before formatting JSON or text and keeps contexts separate', async () => {
  const first = deferred<void>();
  const second = deferred<void>();
  const contexts: ToolExecutionContext[] = [];
  const app = createApp(createToolExecutor({ ...toolHandlers, ip: async (_input, context) => {
    contexts.push(context);
    await (context.connection.address === '203.0.113.1' ? first.promise : second.promise);
    return getPublicIp(context.connection);
  } }));
  const completed = vi.fn();
  const plain = Promise.resolve(app.request('http://localhost/v1/public-ip', {
    headers: { 'cf-connecting-ip': '203.0.113.1', accept: 'text/plain' },
  })).then(response => { completed('plain'); return response; });
  const json = Promise.resolve(app.request('http://localhost/v1/public-ip', {
    headers: { 'cf-connecting-ip': '2001:db8::2' },
  })).then(response => { completed('json'); return response; });
  await vi.waitFor(() => expect(contexts).toHaveLength(2));
  expect(completed).not.toHaveBeenCalled();
  second.resolve();
  const jsonResponse = await json;
  expect(jsonResponse.headers.get('cache-control')).toBe('no-store');
  expect(await jsonResponse.json()).toEqual({ family: 'ipv6', ip: '2001:db8::2' });
  expect(completed).toHaveBeenCalledExactlyOnceWith('json');
  first.resolve();
  const plainResponse = await plain;
  expect(plainResponse.headers.get('cache-control')).toBe('no-store');
  expect(await plainResponse.text()).toBe('203.0.113.1\n');
  expect(contexts[0]).not.toBe(contexts[1]);
});

it('awaits deferred MCP HTTP calls and keeps each client connection isolated', async () => {
  const first = deferred<void>();
  const second = deferred<void>();
  const contexts: ToolExecutionContext[] = [];
  const app = createApp(createToolExecutor({ ...toolHandlers, ip: async (_input, context) => {
    contexts.push(context);
    await (context.connection.address === '203.0.113.1' ? first.promise : second.promise);
    return getPublicIp(context.connection);
  } }));
  const one = await connectedClient(app);
  const two = await connectedClient(app, '2001:db8::2');
  try {
    const completed = vi.fn();
    const firstCall = one.callTool({ name: toolCatalog.ip.mcp.name, arguments: {} }).then(value => { completed('first'); return value; });
    const secondCall = two.callTool({ name: toolCatalog.ip.mcp.name, arguments: {} }).then(value => { completed('second'); return value; });
    await vi.waitFor(() => expect(contexts).toHaveLength(2));
    expect(completed).not.toHaveBeenCalled();
    second.resolve();
    const secondResult = await secondCall;
    expect(secondResult.structuredContent).toEqual({ family: 'ipv6', ip: '2001:db8::2' });
    expect(secondResult.content).toEqual([
      { type: 'text', text: JSON.stringify(secondResult.structuredContent) }, toolCatalog.ip.mcp.resultLink,
    ]);
    expect(completed).toHaveBeenCalledExactlyOnceWith('second');
    first.resolve();
    expect((await firstCall).structuredContent).toEqual({ family: 'ipv4', ip: '203.0.113.1' });
    expect(contexts[0]).not.toBe(contexts[1]);
    expect(contexts[0]!.signal).not.toBe(contexts[1]!.signal);
  } finally {
    first.resolve(); second.resolve();
    await one.close(); await two.close();
  }
});

it('preserves located structured errors from rejected asynchronous handlers in API and MCP', async () => {
  const error = new ToolError('INVALID_INPUT', 'Controlled invalid input.', [{ field: 'end', message: 'Invalid endpoint.' }]);
  const app = createApp(createToolExecutor({ ...toolHandlers, range: async () => {
    await Promise.resolve();
    throw error;
  } }));
  const response = await app.request('http://localhost/v1/range-to-cidrs', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(toolCatalog.range.example.request),
  });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual(error.toResponse());
  const client = await connectedClient(app);
  try {
    const result = await client.callTool({ name: toolCatalog.range.mcp.name, arguments: toolCatalog.range.example.request });
    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: 'text', text: JSON.stringify(error.toResponse()) }]);
  } finally { await client.close(); }
});

it('sanitizes unexpected asynchronous failures and preserves no-store error responses', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const app = createApp(createToolExecutor({ ...toolHandlers, ip: async () => {
    await Promise.resolve();
    throw new Error('Private upstream failure');
  } }));
  const response = await app.request('http://localhost/v1/public-ip', { headers: { accept: 'text/plain' } });
  const failure = { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } };
  expect(response.status).toBe(500);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('content-type')).toContain('application/json');
  expect(await response.json()).toEqual(failure);
  const client = await connectedClient(app);
  try {
    const result = await client.callTool({ name: toolCatalog.ip.mcp.name, arguments: {} });
    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: 'text', text: JSON.stringify(failure) }]);
  } finally { await client.close(); }
});

it('propagates HTTP request cancellation to API work and waits for handler cleanup without logging its reason', async () => {
  const started = deferred<ToolExecutionContext>();
  const finished = vi.fn();
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const app = createApp(createToolExecutor({ ...toolHandlers, ip: async (_input, context) => {
    started.resolve(context);
    try {
      return await new Promise<PublicIpResult>((_resolve, reject) => {
        context.signal.addEventListener('abort', () => reject(new Error('Private cancellation reason')), { once: true });
      });
    } finally { finished(); }
  } }));
  const controller = new AbortController();
  const response = Promise.resolve(app.request(new Request('http://localhost/v1/public-ip', { signal: controller.signal })));
  const context = await started.promise;
  controller.abort('Private caller abort reason');
  const failure = await response;
  expect(context.signal.aborted).toBe(true);
  expect(finished).toHaveBeenCalledOnce();
  expect(failure.status).toBe(500);
  expect(failure.headers.get('cache-control')).toBe('no-store');
  expect(await failure.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
  expect(log).not.toHaveBeenCalled();
});

it('propagates modern MCP HTTP call cancellation through to handler cleanup', async () => {
  const started = deferred<ToolExecutionContext>();
  const finished = deferred<void>();
  const app = createApp(createToolExecutor({ ...toolHandlers, ip: async (_input, context) => {
    started.resolve(context);
    try {
      return await new Promise<PublicIpResult>((_resolve, reject) => {
        context.signal.addEventListener('abort', () => reject(new Error('Private cancellation reason')), { once: true });
      });
    } finally { finished.resolve(); }
  } }));
  const client = await connectedClient(app);
  try {
    const controller = new AbortController();
    const call = client.callTool({ name: toolCatalog.ip.mcp.name, arguments: {} }, { signal: controller.signal });
    const failure = expect(call).rejects.toThrow();
    const context = await started.promise;
    controller.abort('Private caller abort reason');
    await failure;
    await finished.promise;
    expect(context.signal.aborted).toBe(true);
  } finally { await client.close(); }
}, 15_000);

it('uses a separate MCP call signal when concurrent calls share one server and HTTP request', async () => {
  const contexts: ToolExecutionContext[] = [];
  const firstFinished = deferred<void>();
  const second = deferred<void>();
  const executor = createToolExecutor({ ...toolHandlers, ip: async (_input, context) => {
    contexts.push(context);
    if (contexts.length === 2) {
      await second.promise;
      return getPublicIp(context.connection);
    }
    try {
      return await new Promise<PublicIpResult>((_resolve, reject) => {
        context.signal.addEventListener('abort', () => reject(new Error('Private cancellation reason')), { once: true });
      });
    } finally { firstFinished.resolve(); }
  } });
  const httpRequest = new Request('http://localhost/mcp', { headers: { 'cf-connecting-ip': '203.0.113.1' } });
  const server = createMcpServer({ era: 'legacy', requestInfo: httpRequest }, executor);
  const client = new Client({ name: 'per-call-cancellation-tests', version: '0.1.0' }, { versionNegotiation: { mode: 'legacy' } });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const controller = new AbortController();
    const one = client.callTool({ name: toolCatalog.ip.mcp.name, arguments: {} }, { signal: controller.signal });
    const failure = expect(one).rejects.toThrow();
    await vi.waitFor(() => expect(contexts).toHaveLength(1));
    const two = client.callTool({ name: toolCatalog.ip.mcp.name, arguments: {} });
    await vi.waitFor(() => expect(contexts).toHaveLength(2));
    controller.abort();
    await failure;
    await firstFinished.promise;
    expect(contexts[0]!.signal.aborted).toBe(true);
    expect(contexts[1]!.signal.aborted).toBe(false);
    expect(httpRequest.signal.aborted).toBe(false);
    second.resolve();
    expect((await two).structuredContent).toEqual({ family: 'ipv4', ip: '203.0.113.1' });
  } finally {
    second.resolve();
    await client.close(); await server.close();
  }
}, 15_000);

it('propagates a directly aborted legacy MCP HTTP request through to handler cleanup', async () => {
  const started = deferred<ToolExecutionContext>();
  const finished = deferred<void>();
  const app = createApp(createToolExecutor({ ...toolHandlers, ip: async (_input, context) => {
    started.resolve(context);
    try {
      return await new Promise<PublicIpResult>((_resolve, reject) => {
        context.signal.addEventListener('abort', () => reject(new Error('Private cancellation reason')), { once: true });
      });
    } finally { finished.resolve(); }
  } }));
  const http = new AbortController();
  const response = Promise.resolve(app.request(new Request('http://localhost/mcp', {
    method: 'POST', signal: http.signal,
    headers: {
      host: 'localhost', 'content-type': 'application/json', accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-11-25', 'cf-connecting-ip': '203.0.113.1',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: toolCatalog.ip.mcp.name, arguments: {} } }),
  })));
  const context = await started.promise;
  http.abort('Private HTTP abort reason');
  await finished.promise;
  expect(context.signal.aborted).toBe(true);
  // The legacy stream can close without a JSON-RPC response. Observe server
  // cleanup directly instead of asserting the client's separate wait completes.
  const cancelled = await response;
  await cancelled.body?.cancel();
}, 15_000);
