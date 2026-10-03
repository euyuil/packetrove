import { exports } from 'cloudflare:workers';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as LegacyClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as LegacyTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport as LegacyTransportContract } from '@modelcontextprotocol/sdk/shared/transport.js';
import { describe, expect, it } from 'vitest';
import { smallestCoveringCidr } from '@packetrove/core';
import {
  CIDR_COVER_EXAMPLES, CIDR_SUBTRACT_EXAMPLES, CIDR_SUBTRACT_TOOL_NAME, CidrSubtractResultSchema,
  CidrCoverResultSchema, ErrorResponseSchema, tools as catalogTools,
  MAX_REQUEST_BYTES, MCP_TOOL_NAME, PACKETROVE_VERSION,
  PUBLIC_IP_TOOL_NAME, PublicIpResultSchema,
} from '@packetrove/contracts';
import { mcpExamples } from '../../web/src/mcp-examples';

const workerFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  // Direct Worker dispatch bypasses the HTTP layer that normally sets Host.
  request.headers.set('host', new URL(request.url).host);
  const response = await exports.default.fetch(request);
  expect(response.headers.get('mcp-session-id')).toBeNull();
  expect(response.headers.get('cache-control')).toContain('no-store');
  return response;
};

async function connectedClient(url = 'http://localhost/mcp', origin?: string, ip?: string) {
  const client = new Client({ name: 'packetrove-tests', version: '0.1.0' }, {
    versionNegotiation: { mode: 'auto' },
  });
  await client.connect(new StreamableHTTPClientTransport(new URL(url), {
    fetch: workerFetch,
    requestInit: { headers: { ...(origin ? { origin } : {}), ...(ip ? { 'cf-connecting-ip': ip } : {}) } },
  }));
  return client;
}

describe('stateless MCP in the Workers runtime', () => {
  it('discovers a read-only tool with input and output schemas', async () => {
    const client = await connectedClient();
    try {
      expect(client.getServerVersion()).toMatchObject({ name: 'Packetrove', version: PACKETROVE_VERSION });
      const { tools } = await client.listTools();
      expect(tools.map(tool => tool.name).sort()).toEqual(catalogTools.map(tool => tool.mcp.name).sort());
      for (const definition of catalogTools) {
        expect(tools.find(tool => tool.name === definition.mcp.name)).toMatchObject({
          title: definition.title, description: definition.mcp.description, annotations: definition.mcp.annotations,
          inputSchema: { type: 'object' }, outputSchema: { type: 'object' },
        });
      }
      expect(tools[0]).toMatchObject({
        name: MCP_TOOL_NAME, annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
        inputSchema: { type: 'object', required: ['inputs'] },
        outputSchema: { type: 'object' },
      });
      expect(tools.find(tool => tool.name === PUBLIC_IP_TOOL_NAME)).toMatchObject({
        name: 'public-ip',
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        inputSchema: { type: 'object', additionalProperties: false },
      });
    } finally { await client.close(); }
  });
  it.each(CIDR_COVER_EXAMPLES)('returns the API result for $name', async ({ request, result }) => {
    const client = await connectedClient();
    try {
      await client.listTools();
      const response = await client.callTool({ name: MCP_TOOL_NAME, arguments: request });
      expect(response.isError).not.toBe(true);
      expect(CidrCoverResultSchema.parse(response.structuredContent)).toEqual(result);
      expect(response.content).toEqual([{ type: 'text', text: JSON.stringify(result) }]);
    } finally { await client.close(); }
  });
  it.each(CIDR_SUBTRACT_EXAMPLES)('returns the exact subtraction $name result', async ({ request, result }) => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: CIDR_SUBTRACT_TOOL_NAME, arguments: request });
      expect(response.isError).not.toBe(true);
      expect(CidrSubtractResultSchema.parse(response.structuredContent)).toEqual(result);
      expect(response.content).toEqual([{ type: 'text', text: JSON.stringify(result) }]);
    } finally { await client.close(); }
  });
  it.each([
    { include: ['::/0'], exclude: [] },
    { include: ['203.0.113.0/24'], exclude: ['203.0.113.0/24'] },
  ])('preserves subtraction empty results and full IPv6 counts', async request => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: CIDR_SUBTRACT_TOOL_NAME, arguments: request });
      expect(response.isError).not.toBe(true);
      const result = CidrSubtractResultSchema.parse(response.structuredContent);
      expect(result.remainingAddressCount).toBe(request.include[0] === '::/0'
        ? '340282366920938463463374607431768211456' : '0');
      expect(result.cidrs).toEqual(request.include[0] === '::/0' ? ['::/0'] : []);
    } finally { await client.close(); }
  });
  it('reports subtraction list names and indices in shared tool errors', async () => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: CIDR_SUBTRACT_TOOL_NAME, arguments: { include: ['bad'], exclude: ['::/129'] } });
      expect(response.isError).toBe(true);
      expect(response.structuredContent).toBeUndefined();
      const content = response.content?.[0];
      if (content?.type !== 'text') throw new Error('Missing error content');
      expect(ErrorResponseSchema.parse(JSON.parse(content.text)).error).toMatchObject({
        code: 'INVALID_INPUT', issues: [{ list: 'include', index: 0 }, { list: 'exclude', index: 0 }],
      });
    } finally { await client.close(); }
  });
  it.each([
    { include: ['::/0'], exclude: ['203.0.113.1'] },
    { include: new Array(501).fill('::1'), exclude: new Array(500).fill('::2') },
    {
      include: Array.from({ length: 126 }, (_, i) => `2001:db8:${(i * 2).toString(16)}::/48`),
      exclude: Array.from({ length: 126 }, (_, i) => `2001:db8:${(i * 2).toString(16)}::1/128`),
    },
  ])('returns subtraction validation errors without a partial result', async request => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: CIDR_SUBTRACT_TOOL_NAME, arguments: request });
      expect(response.isError).toBe(true);
      expect(response.structuredContent).toBeUndefined();
      const content = response.content?.[0];
      if (content?.type !== 'text') throw new Error('Missing error content');
      expect(ErrorResponseSchema.safeParse(JSON.parse(content.text)).success).toBe(true);
    } finally { await client.close(); }
  });
  it.each(Object.values(mcpExamples))('executes the website guide example for $name', async example => {
    const client = await connectedClient('http://localhost/mcp', undefined, mcpExamples.ip.result.ip);
    try {
      expect((await client.listTools()).tools.some(tool => tool.name === example.name)).toBe(true);
      const response = await client.callTool({ name: example.name, arguments: example.arguments });
      expect(response.isError).not.toBe(true);
      expect(response.structuredContent).toEqual(example.result);
      expect(response.content).toHaveLength(1);
      const content = response.content?.[0];
      if (content?.type !== 'text') throw new Error('Missing result content');
      expect(JSON.parse(content.text)).toEqual(example.result);
    } finally { await client.close(); }
  });
  it('preserves dotted-tail IPv6 values using the shared calculation', async () => {
    const request = { inputs: ['::192.0.2.1', '::c000:201'] };
    const result = smallestCoveringCidr(request);
    expect(result.cidr).toBe('::c000:201/128');
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: MCP_TOOL_NAME, arguments: request });
      expect(response.isError).not.toBe(true);
      expect(CidrCoverResultSchema.parse(response.structuredContent)).toEqual(result);
      expect(response.content).toEqual([{ type: 'text', text: JSON.stringify(result) }]);
    } finally { await client.close(); }
  });
  it('returns actionable business errors as tool errors', async () => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: MCP_TOOL_NAME, arguments: { inputs: ['::1', '203.0.113.1'] } });
      expect(response.isError).toBe(true);
      const text = response.content?.find(content => content.type === 'text');
      expect(text?.type).toBe('text');
      if (text?.type !== 'text') throw new Error('Missing error content');
      expect(ErrorResponseSchema.parse(JSON.parse(text.text)).error.code).toBe('MIXED_ADDRESS_FAMILIES');
    } finally { await client.close(); }
  });
  it('returns all invalid entry indices in the shared tool error structure', async () => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: MCP_TOOL_NAME,
        arguments: { inputs: ['203.0.113.1', 'bad', '203.0.113.2', '::/129'] } });
      expect(response.isError).toBe(true);
      expect(response.structuredContent).toBeUndefined();
      const text = response.content?.find(content => content.type === 'text');
      if (text?.type !== 'text') throw new Error('Missing error content');
      const error = ErrorResponseSchema.parse(JSON.parse(text.text)).error;
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.message).toBe('Expected valid IP addresses or CIDRs.');
      expect(error.issues?.map(issue => issue.index)).toEqual([1, 3]);
      expect(error.issues?.every(issue => issue.message.length > 0)).toBe(true);
    } finally { await client.close(); }
  });
  it('supports legacy Streamable HTTP initialization, discovery, and calls without sessions', async () => {
    const client = new LegacyClient({ name: 'legacy-packetrove-tests', version: '0.1.0' });
    const transport = new LegacyTransport(new URL('http://localhost/mcp'), { fetch: workerFetch });
    // SDK 1.30 declares sessionId differently on its transport and interface.
    await client.connect(transport as LegacyTransportContract);
    try {
      expect(client.getServerVersion()?.name).toBe('Packetrove');
      expect(client.getServerVersion()?.version).toBe(PACKETROVE_VERSION);
      expect((await client.listTools()).tools[0]?.name).toBe(MCP_TOOL_NAME);
      const example = CIDR_COVER_EXAMPLES[1]!;
      const response = await client.callTool({ name: MCP_TOOL_NAME, arguments: example.request });
      expect(response.structuredContent).toEqual(example.result);
      const subtraction = CIDR_SUBTRACT_EXAMPLES[0]!;
      const subtractResponse = await client.callTool({ name: CIDR_SUBTRACT_TOOL_NAME, arguments: subtraction.request });
      expect(CidrSubtractResultSchema.parse(subtractResponse.structuredContent)).toEqual(subtraction.result);
    } finally { await client.close(); }
  });
  it('enforces the shared HTTP body limit', async () => {
    const response = await exports.default.fetch('http://localhost/mcp', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: ' '.repeat(MAX_REQUEST_BYTES + 1),
    });
    expect(response.status).toBe(413);
  });
  it.each(['https://packetrove.com', 'https://api.packetrove.com'])(
    'supports browser clients from %s', async origin => {
      const client = await connectedClient('https://api.packetrove.com/mcp', origin);
      try {
        expect((await client.listTools()).tools[0]?.name).toBe(MCP_TOOL_NAME);
        const example = CIDR_COVER_EXAMPLES[1]!;
        const response = await client.callTool({ name: MCP_TOOL_NAME, arguments: example.request });
        expect(response.structuredContent).toEqual(example.result);
      } finally { await client.close(); }
    },
  );
  it('rejects the website hostname as an MCP Host', async () => {
    const response = await exports.default.fetch('https://api.packetrove.com/mcp', {
      method: 'POST', headers: { 'content-type': 'application/json', host: 'packetrove.com' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    expect(response.status).toBe(403);
  });
  it('rejects a workers.dev hostname', async () => {
    const response = await exports.default.fetch('https://packetrove.example.workers.dev/mcp', {
      method: 'POST', headers: {
        'content-type': 'application/json', host: 'packetrove.example.workers.dev',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    expect(response.status).toBe(403);
  });
  it.each(['http://localhost', 'https://api.packetrove.com'])(
    'rejects unrelated browser Origins on %s', async origin => {
      const response = await exports.default.fetch(`${origin}/mcp`, {
        method: 'POST', headers: {
          'content-type': 'application/json', host: new URL(origin).host, origin: 'https://unrelated.example',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      });
      expect(response.status).toBe(403);
    },
  );
  it('rejects an unrecognized Host on the production endpoint', async () => {
    const response = await exports.default.fetch('https://api.packetrove.com/mcp', {
      method: 'POST', headers: { 'content-type': 'application/json', host: 'unrelated.example' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    expect(response.status).toBe(403);
  });
});

describe('public IP over MCP', () => {
  it.each(catalogTools.flatMap(tool => [...tool.removedInterfaces.mcpNames]))('rejects removed MCP name %s', async name => {
    const client = await connectedClient('http://localhost/mcp', undefined, '203.0.113.1');
    try {
      await expect(client.callTool({ name, arguments: {} })).rejects.toThrow(/not found/i);
    } finally { await client.close(); }
  });

  it.each([
    { ip: '203.0.113.1', family: 'ipv4' },
    { ip: '2001:db8::7', family: 'ipv6' },
  ])('reports the tool caller connection: $ip', async result => {
    const client = await connectedClient('http://localhost/mcp', undefined, result.ip);
    try {
      const response = await client.callTool({ name: PUBLIC_IP_TOOL_NAME, arguments: {} });
      expect(response.isError).not.toBe(true);
      expect(PublicIpResultSchema.parse(response.structuredContent)).toEqual(result);
      expect(response.content).toHaveLength(1);
      const text = response.content?.[0];
      if (text?.type !== 'text') throw new Error('Missing result content');
      expect(PublicIpResultSchema.parse(JSON.parse(text.text))).toEqual(result);
    } finally { await client.close(); }
  });

  it('isolates concurrent client addresses', async () => {
    const addresses = ['203.0.113.1', '2001:db8::7'];
    const clients = await Promise.all(addresses.map(ip => connectedClient('http://localhost/mcp', undefined, ip)));
    try {
      const responses = await Promise.all(clients.map(client => client.callTool({ name: PUBLIC_IP_TOOL_NAME, arguments: {} })));
      expect(responses.map(response => PublicIpResultSchema.parse(response.structuredContent).ip)).toEqual(addresses);
    } finally { await Promise.all(clients.map(client => client.close())); }
  });

  it('uses the tool-call request rather than initialization metadata', async () => {
    let ip = '203.0.113.1';
    const client = new Client({ name: 'changing-network-tests', version: '0.1.0' }, { versionNegotiation: { mode: 'auto' } });
    await client.connect(new StreamableHTTPClientTransport(new URL('http://localhost/mcp'), {
      fetch: async (input, init) => {
        const request = new Request(input, init);
        request.headers.set('cf-connecting-ip', ip);
        return workerFetch(request);
      },
    }));
    try {
      ip = '2001:db8::7';
      const response = await client.callTool({ name: PUBLIC_IP_TOOL_NAME, arguments: {} });
      expect(response.structuredContent).toEqual({ ip, family: 'ipv6' });
    } finally { await client.close(); }
  });

  it('returns a structured tool error when connection metadata is unavailable', async () => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: PUBLIC_IP_TOOL_NAME, arguments: {} });
      expect(response.isError).toBe(true);
      const text = response.content?.find(content => content.type === 'text');
      if (text?.type !== 'text') throw new Error('Missing error content');
      expect(ErrorResponseSchema.parse(JSON.parse(text.text)).error.code).toBe('CLIENT_IP_UNAVAILABLE');
    } finally { await client.close(); }
  });

  it('serves the same IP contract to a legacy MCP client', async () => {
    const client = new LegacyClient({ name: 'legacy-ip-tests', version: '0.1.0' });
    const transport = new LegacyTransport(new URL('http://localhost/mcp'), {
      fetch: workerFetch, requestInit: { headers: { 'cf-connecting-ip': '203.0.113.1' } },
    });
    await client.connect(transport as LegacyTransportContract);
    try {
      const response = await client.callTool({ name: PUBLIC_IP_TOOL_NAME, arguments: {} });
      expect(response.isError).not.toBe(true);
      expect(PublicIpResultSchema.parse(response.structuredContent)).toEqual({ ip: '203.0.113.1', family: 'ipv4' });
    } finally { await client.close(); }
  });
});
