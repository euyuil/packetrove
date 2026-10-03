import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as LegacyClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as LegacyTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport as LegacyTransportContract } from '@modelcontextprotocol/sdk/shared/transport.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tools, toolCatalog } from '@packetrove/contracts';
import { createApp } from '../src/app';
import { createToolExecutor, toolHandlers } from '../src/tools';

afterEach(() => { vi.restoreAllMocks(); });

async function connectedClient(runtime: 'current' | 'legacy', headers: Record<string, string> = {}, app = createApp()) {
  const workerFetch: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    request.headers.set('host', new URL(request.url).host);
    const response = await app.fetch(request);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('mcp-session-id')).toBeNull();
    return response;
  };
  const url = new URL('http://localhost/mcp');
  if (runtime === 'legacy') {
    const client = new LegacyClient({ name: 'operational-log-tests', version: '0.1.0' });
    const transport = new LegacyTransport(url, { fetch: workerFetch, requestInit: { headers } });
    await client.connect(transport as LegacyTransportContract);
    return { client };
  }
  const client = new Client({ name: 'operational-log-tests', version: '0.1.0' }, {
    versionNegotiation: { mode: 'auto' },
  });
  await client.connect(new StreamableHTTPClientTransport(url, { fetch: workerFetch, requestInit: { headers } }));
  return { client };
}

describe.each(['current', 'legacy'] as const)('%s MCP execution events', runtime => {
  it('waits for an asynchronous execution to finish before counting it', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    let complete!: () => void;
    const pending = new Promise<void>(resolve => { complete = resolve; });
    const entered = vi.fn();
    const app = createApp(createToolExecutor({ ...toolHandlers, cidr: async input => {
      entered();
      await pending;
      return toolHandlers.cidr(input);
    } }));
    const { client } = await connectedClient(runtime, {}, app);
    try {
      const call = client.callTool({ name: toolCatalog.cidr.id, arguments: toolCatalog.cidr.example.request });
      await vi.waitFor(() => expect(entered).toHaveBeenCalledTimes(1));
      expect(log).not.toHaveBeenCalled();
      complete();
      expect((await call).structuredContent).toEqual(toolCatalog.cidr.example.result);
      expect(log.mock.calls).toEqual([
        [{ event: 'mcp_tool_execution', tool: toolCatalog.cidr.id, outcome: 'success' }],
      ]);
    } finally { complete(); await client.close(); }
  });

  it.each(tools)('counts each $id execution and retry without inputs, results, or headers', async tool => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { client } = await connectedClient(runtime, {
      'cf-connecting-ip': toolCatalog.ip.example.result.ip,
      'x-test-private-header': 'private-request-metadata',
    });
    try {
      await client.listTools();
      expect(log).not.toHaveBeenCalled();
      for (let attempt = 0; attempt < 2; attempt++) {
        const result = await client.callTool({ name: tool.id, arguments: tool.example.request });
        expect(result.isError).not.toBe(true);
        expect(result.structuredContent).toEqual(tool.example.result);
      }
      expect(log.mock.calls).toEqual([
        [{ event: 'mcp_tool_execution', tool: tool.id, outcome: 'success' }],
        [{ event: 'mcp_tool_execution', tool: tool.id, outcome: 'success' }],
      ]);
    } finally { await client.close(); }
  });

  it.each(tools.filter(tool => tool.execution === 'local'))('counts shared input errors for $id once', async tool => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { client } = await connectedClient(runtime);
    try {
      const result = await client.callTool({ name: tool.id, arguments: {} });
      expect(result.isError).toBe(true);
      expect(log.mock.calls).toEqual([
        [{ event: 'mcp_tool_execution', tool: tool.id, outcome: 'error', error_code: 'INVALID_INPUT' }],
      ]);
    } finally { await client.close(); }
  });

  it('counts a missing connection address without recording the lookup result', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { client } = await connectedClient(runtime);
    try {
      const result = await client.callTool({ name: toolCatalog.ip.id, arguments: {} });
      expect(result.isError).toBe(true);
      expect(log.mock.calls).toEqual([
        [{ event: 'mcp_tool_execution', tool: toolCatalog.ip.id, outcome: 'error', error_code: 'CLIENT_IP_UNAVAILABLE' }],
      ]);
    } finally { await client.close(); }
  });

  it('excludes discovery, unknown names, and requests rejected before a callback', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { client } = await connectedClient(runtime);
    try {
      await client.listTools();
      await expect(client.callTool({ name: 'unknown-tool', arguments: {} })).rejects.toThrow(/not found/i);
      const rejected = await client.callTool({ name: toolCatalog.ip.id, arguments: {
        unexpected: 'private-request-value',
      } });
      expect(rejected.isError).toBe(true);
      expect(log).not.toHaveBeenCalled();
    } finally { await client.close(); }
  });

  it.each([false, true])('preserves the tool result when logging fails; tool error = %s', async fails => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => { throw new Error('Unavailable log sink'); });
    const { client } = await connectedClient(runtime);
    try {
      const result = await client.callTool({
        name: toolCatalog.cidr.id, arguments: fails ? {} : toolCatalog.cidr.example.request,
      });
      if (fails) expect(result.isError).toBe(true);
      else expect(result.structuredContent).toEqual(toolCatalog.cidr.example.result);
      expect(log).toHaveBeenCalledTimes(1);
    } finally { await client.close(); }
  });
});

it('isolates concurrent tools, outcomes, and connection addresses', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const clients = await Promise.all(['203.0.113.1', '2001:db8::7'].map(ip =>
    connectedClient('current', { 'cf-connecting-ip': ip })));
  try {
    const results = await Promise.all([
      clients[0]!.client.callTool({ name: toolCatalog.ip.id, arguments: {} }),
      clients[1]!.client.callTool({ name: toolCatalog.ip.id, arguments: {} }),
      clients[0]!.client.callTool({ name: toolCatalog.range.id, arguments: toolCatalog.range.example.request }),
      clients[1]!.client.callTool({ name: toolCatalog.subtract.id, arguments: {} }),
    ]);
    expect(results[0]!.structuredContent).toEqual({ ip: '203.0.113.1', family: 'ipv4' });
    expect(results[1]!.structuredContent).toEqual({ ip: '2001:db8::7', family: 'ipv6' });
    expect(results[2]!.structuredContent).toEqual(toolCatalog.range.example.result);
    expect(results[3]!.isError).toBe(true);
    expect(log).toHaveBeenCalledTimes(4);
    expect(log.mock.calls).toEqual(expect.arrayContaining([
      [{ event: 'mcp_tool_execution', tool: toolCatalog.ip.id, outcome: 'success' }],
      [{ event: 'mcp_tool_execution', tool: toolCatalog.ip.id, outcome: 'success' }],
      [{ event: 'mcp_tool_execution', tool: toolCatalog.range.id, outcome: 'success' }],
      [{ event: 'mcp_tool_execution', tool: toolCatalog.subtract.id, outcome: 'error', error_code: 'INVALID_INPUT' }],
    ]));
  } finally { await Promise.all(clients.map(({ client }) => client.close())); }
});

it('records a controlled code for an unexpected exception without raw details', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const app = createApp(createToolExecutor({ ...toolHandlers, cidr: async () => {
    throw new Error('private exception detail');
  } }));
  const { client } = await connectedClient('current', {}, app);
  try {
    const result = await client.callTool({ name: toolCatalog.cidr.id, arguments: toolCatalog.cidr.example.request });
    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: 'text', text: JSON.stringify({ error: {
      code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.',
    } }) }]);
    expect(log.mock.calls).toEqual([
      [{ event: 'mcp_tool_execution', tool: toolCatalog.cidr.id, outcome: 'error', error_code: 'INTERNAL_ERROR' }],
    ]);
  } finally { await client.close(); }
});
