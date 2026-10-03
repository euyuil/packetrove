import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as LegacyClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as LegacyTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport as LegacyTransportContract } from '@modelcontextprotocol/sdk/shared/transport.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tools, toolCatalog } from '@packetrove/contracts';
import { createApp } from '../src/app';
import { createToolExecutor, toolHandlers } from '../src/tools';
import { env } from 'cloudflare:workers';
import { AUTOMATION_RUN_ID_HEADER, AUTOMATION_TOKEN_HEADER } from '../src/automation-headers';

afterEach(() => { vi.restoreAllMocks(); });

async function connectedClient(runtime: 'current' | 'legacy', headers: Record<string, string> = {}, app = createApp(),
  automationToken?: string) {
  const workerFetch: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    request.headers.set('host', new URL(request.url).host);
    for (const [name, value] of Object.entries(headers)) request.headers.set(name, value);
    const response = await app.fetch(request, { ...env, PACKETROVE_AUTOMATION_TOKEN: automationToken });
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
        [{ event: 'mcp_tool_execution', traffic_source: 'public_call', tool: toolCatalog.cidr.id, outcome: 'success' }],
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
        [{ event: 'mcp_tool_execution', traffic_source: 'public_call', tool: tool.id, outcome: 'success' }],
        [{ event: 'mcp_tool_execution', traffic_source: 'public_call', tool: tool.id, outcome: 'success' }],
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
        [{ event: 'mcp_tool_execution', traffic_source: 'public_call', tool: tool.id, outcome: 'error', error_code: 'INVALID_INPUT' }],
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
        [{ event: 'mcp_tool_execution', traffic_source: 'public_call', tool: toolCatalog.ip.id, outcome: 'error', error_code: 'CLIENT_IP_UNAVAILABLE' }],
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

  it.each([false, true])('marks verified automation without changing results; tool error = %s', async fails => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { client } = await connectedClient(runtime, {
      [AUTOMATION_TOKEN_HEADER]: 'a'.repeat(64), [AUTOMATION_RUN_ID_HEADER]: '1234567890',
      'x-test-private-header': 'private-request-metadata',
    }, createApp(), 'a'.repeat(64));
    try {
      const result = await client.callTool({ name: toolCatalog.cidr.id,
        arguments: fails ? {} : toolCatalog.cidr.example.request });
      if (fails) expect(result.isError).toBe(true);
      else expect(result.structuredContent).toEqual(toolCatalog.cidr.example.result);
      expect(log.mock.calls).toEqual([[{
        event: 'mcp_tool_execution', tool: toolCatalog.cidr.id, outcome: fails ? 'error' : 'success',
        traffic_source: 'automated_check', automation_run_id: '1234567890',
        ...(fails ? { error_code: 'INVALID_INPUT' } : {}),
      }]]);
      expect(JSON.stringify(log.mock.calls)).not.toContain('a'.repeat(64));
      expect(JSON.stringify(result)).not.toContain('a'.repeat(64));
    } finally { await client.close(); }
  });

  it.each([
    { configured: undefined, supplied: 'a'.repeat(64) },
    { configured: '', supplied: 'a'.repeat(64) },
    { configured: 'malformed', supplied: 'a'.repeat(64) },
    { configured: 'a'.repeat(64), supplied: undefined },
    { configured: 'a'.repeat(64), supplied: 'b'.repeat(64) },
    { configured: 'a'.repeat(64), supplied: 'malformed' },
    { configured: 'a'.repeat(64), supplied: 'a'.repeat(64) + ', ' + 'a'.repeat(64) },
  ])('keeps missing, mismatched, and malformed credentials as public calls', async ({ configured, supplied }) => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { client } = await connectedClient(runtime, {
      ...(supplied === undefined ? {} : { [AUTOMATION_TOKEN_HEADER]: supplied }),
      [AUTOMATION_RUN_ID_HEADER]: '1234567890', 'Packetrove-Traffic-Source': 'automated_check',
    }, createApp(), configured);
    try {
      const result = await client.callTool({ name: toolCatalog.cidr.id, arguments: toolCatalog.cidr.example.request });
      expect(result.structuredContent).toEqual(toolCatalog.cidr.example.result);
      expect(log.mock.calls).toEqual([[{
        event: 'mcp_tool_execution', tool: toolCatalog.cidr.id, outcome: 'success', traffic_source: 'public_call',
      }]]);
    } finally { await client.close(); }
  });

  it.each([undefined, '0', '01', '123,456', '1'.repeat(21), 'private-run-metadata'])(
    'omits missing and invalid run identifiers from verified automation', async runId => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { client } = await connectedClient(runtime, {
        [AUTOMATION_TOKEN_HEADER]: 'a'.repeat(64),
        ...(runId === undefined ? {} : { [AUTOMATION_RUN_ID_HEADER]: runId }),
      }, createApp(), 'a'.repeat(64));
      try {
        expect((await client.callTool({ name: toolCatalog.cidr.id, arguments: toolCatalog.cidr.example.request }))
          .structuredContent).toEqual(toolCatalog.cidr.example.result);
        expect(log.mock.calls).toEqual([[{
          event: 'mcp_tool_execution', tool: toolCatalog.cidr.id, outcome: 'success', traffic_source: 'automated_check',
        }]]);
      } finally { await client.close(); }
    },
  );

  it('classifies each call independently of initialization headers', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const headers: Record<string, string> = {};
    const { client } = await connectedClient(runtime, headers, createApp(), 'a'.repeat(64));
    try {
      headers[AUTOMATION_TOKEN_HEADER] = 'a'.repeat(64);
      headers[AUTOMATION_RUN_ID_HEADER] = '1234567890';
      await client.callTool({ name: toolCatalog.cidr.id, arguments: toolCatalog.cidr.example.request });
      delete headers[AUTOMATION_TOKEN_HEADER];
      delete headers[AUTOMATION_RUN_ID_HEADER];
      await client.callTool({ name: toolCatalog.cidr.id, arguments: toolCatalog.cidr.example.request });
      expect(log.mock.calls).toEqual([
        [{ event: 'mcp_tool_execution', tool: toolCatalog.cidr.id, outcome: 'success',
          traffic_source: 'automated_check', automation_run_id: '1234567890' }],
        [{ event: 'mcp_tool_execution', tool: toolCatalog.cidr.id, outcome: 'success', traffic_source: 'public_call' }],
      ]);
    } finally { await client.close(); }
  });
});

it('isolates automation sources and run identifiers across concurrent clients', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const app = createApp();
  const clients = await Promise.all([
    connectedClient('current', { [AUTOMATION_TOKEN_HEADER]: 'a'.repeat(64), [AUTOMATION_RUN_ID_HEADER]: '123' }, app, 'a'.repeat(64)),
    connectedClient('legacy', { [AUTOMATION_TOKEN_HEADER]: 'a'.repeat(64), [AUTOMATION_RUN_ID_HEADER]: '456' }, app, 'a'.repeat(64)),
    connectedClient('current', { [AUTOMATION_TOKEN_HEADER]: 'b'.repeat(64), [AUTOMATION_RUN_ID_HEADER]: '789' }, app, 'a'.repeat(64)),
  ]);
  try {
    const results = await Promise.all(clients.map(({ client }) => client.callTool({
      name: toolCatalog.cidr.id, arguments: toolCatalog.cidr.example.request,
    })));
    expect(results.every(result => result.isError !== true)).toBe(true);
    expect(log.mock.calls).toHaveLength(3);
    expect(log.mock.calls).toEqual(expect.arrayContaining([
      [{ event: 'mcp_tool_execution', tool: toolCatalog.cidr.id, outcome: 'success',
        traffic_source: 'automated_check', automation_run_id: '123' }],
      [{ event: 'mcp_tool_execution', tool: toolCatalog.cidr.id, outcome: 'success',
        traffic_source: 'automated_check', automation_run_id: '456' }],
      [{ event: 'mcp_tool_execution', tool: toolCatalog.cidr.id, outcome: 'success', traffic_source: 'public_call' }],
    ]));
  } finally { await Promise.all(clients.map(({ client }) => client.close())); }
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
      [{ event: 'mcp_tool_execution', traffic_source: 'public_call', tool: toolCatalog.ip.id, outcome: 'success' }],
      [{ event: 'mcp_tool_execution', traffic_source: 'public_call', tool: toolCatalog.ip.id, outcome: 'success' }],
      [{ event: 'mcp_tool_execution', traffic_source: 'public_call', tool: toolCatalog.range.id, outcome: 'success' }],
      [{ event: 'mcp_tool_execution', traffic_source: 'public_call', tool: toolCatalog.subtract.id, outcome: 'error', error_code: 'INVALID_INPUT' }],
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
      [{ event: 'mcp_tool_execution', traffic_source: 'public_call', tool: toolCatalog.cidr.id, outcome: 'error', error_code: 'INTERNAL_ERROR' }],
    ]);
  } finally { await client.close(); }
});
