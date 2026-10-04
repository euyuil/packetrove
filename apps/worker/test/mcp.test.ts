import { exports } from 'cloudflare:workers';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as LegacyClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as LegacyTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema as LegacyCallToolResultSchema, ResourceLinkSchema as LegacyResourceLinkSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Transport as LegacyTransportContract } from '@modelcontextprotocol/sdk/shared/transport.js';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { smallestCoveringCidr } from '@packetrove/core';
import { checkCertificateBundle } from '@packetrove/core/certificate-bundle';
import {
  CIDR_COVER_EXAMPLES, CIDR_SUBTRACT_EXAMPLES, CIDR_SUBTRACT_TOOL_NAME, CidrSubtractResultSchema,
  CidrCoverResultSchema, ErrorResponseSchema, tools as catalogTools,
  MAX_REQUEST_BYTES, MCP_TOOL_NAME, PACKETROVE_IDENTITY, PACKETROVE_VERSION, PUBLIC_WEBSITE_ORIGIN,
  PUBLIC_IP_TOOL_NAME, PublicIpResultSchema,
  RANGE_TO_CIDRS_EXAMPLES, RangeToCidrsResultSchema, toolCatalog, CertificateBundleResultSchema,
} from '@packetrove/contracts';
import { rangeEndpointErrorCases } from './range-endpoint-error-cases';

const workerFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  // Direct Worker dispatch bypasses the HTTP layer that normally sets Host.
  request.headers.set('host', new URL(request.url).host);
  const response = await exports.default.fetch(request);
  expect(response.headers.get('mcp-session-id')).toBeNull();
  expect(response.headers.get('cache-control')).toContain('no-store');
  return response;
};

async function connectedClient(url = 'http://localhost/mcp', origin?: string, ip?: string, fetcher = workerFetch) {
  const client = new Client({ name: 'packetrove-tests', version: '0.1.0' }, {
    versionNegotiation: { mode: 'auto' },
  });
  await client.connect(new StreamableHTTPClientTransport(new URL(url), {
    fetch: fetcher,
    requestInit: { headers: { ...(origin ? { origin } : {}), ...(ip ? { 'cf-connecting-ip': ip } : {}) } },
  }));
  return client;
}

function expectSuccessContent(content: unknown, tool: (typeof catalogTools)[number], result: unknown) {
  const originalResult = tool.execution === 'connection' ? PublicIpResultSchema.parse(result) : result;
  expect(content).toEqual([{ type: 'text', text: JSON.stringify(originalResult) }, tool.mcp.resultLink]);
  expect(LegacyResourceLinkSchema.parse((content as unknown[])[1])).toEqual(tool.mcp.resultLink);
}

async function expectedObservation(tool: (typeof catalogTools)[number], example: { request: unknown; result: unknown }, value: unknown) {
  if (tool.page !== 'certificate') return example.result;
  const observation = CertificateBundleResultSchema.parse(value);
  expect(Math.abs(Date.now() - Date.parse(observation.evaluatedAt))).toBeLessThan(10_000);
  return checkCertificateBundle(example.request, new Date(observation.evaluatedAt));
}

describe('stateless MCP in the Workers runtime', () => {
  it('discovers a read-only tool with input and output schemas', async () => {
    const client = await connectedClient();
    try {
      expect(client.getServerVersion()).toEqual({ ...PACKETROVE_IDENTITY, version: PACKETROVE_VERSION });
      const { tools } = await client.listTools();
      expect(tools.map(tool => tool.name).sort()).toEqual(catalogTools.map(tool => tool.mcp.name).sort());
      for (const definition of catalogTools) {
        expect(tools.find(tool => tool.name === definition.mcp.name)).toMatchObject({
          title: definition.title, description: definition.mcp.description, annotations: definition.mcp.annotations,
          inputSchema: { type: 'object' }, outputSchema: { type: 'object' },
        });
        const schema = z.toJSONSchema(definition.inputSchema, { io: 'input' });
        expect(tools.find(tool => tool.name === definition.mcp.name)?.inputSchema).toEqual(schema);
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
  it.each(['current', 'legacy'] as const)('supports discovery and calls when a %s client ignores optional identity fields', async runtime => {
    const requiredIdentityOnly: typeof fetch = async (input, init) => {
      const response = await workerFetch(input, init);
      if (response.status === 202 || response.status === 204) return response;
      const omitOptionalIdentity = (text: string) => {
        const message = JSON.parse(text) as { result?: {
          serverInfo?: { name: string; version: string };
          _meta?: Record<string, unknown>;
        } };
        if (message.result?.serverInfo) {
          const { name, version } = message.result.serverInfo;
          message.result.serverInfo = { name, version };
        }
        const identity = message.result?._meta?.['io.modelcontextprotocol/serverInfo'] as
          { name: string; version: string } | undefined;
        if (identity) {
          message.result!._meta!['io.modelcontextprotocol/serverInfo'] = { name: identity.name, version: identity.version };
        }
        return JSON.stringify(message);
      };
      const type = response.headers.get('content-type') ?? '';
      if (!type.includes('application/json') && !type.includes('text/event-stream')) return response;
      const text = await response.text();
      const body = type.includes('application/json') ? omitOptionalIdentity(text)
        : text.replace(/^data: (.+)$/gm, (_line, data: string) => 'data: ' + omitOptionalIdentity(data));
      return new Response(body, { status: response.status, headers: response.headers });
    };
    const client = runtime === 'current'
      ? await connectedClient('http://localhost/mcp', undefined, undefined, requiredIdentityOnly)
      : new LegacyClient({ name: 'legacy-packetrove-tests', version: '0.1.0' });
    try {
      if (runtime === 'legacy') {
        const transport = new LegacyTransport(new URL('http://localhost/mcp'), { fetch: requiredIdentityOnly });
        await (client as LegacyClient).connect(transport as LegacyTransportContract);
      }
      // The client omits its own optional fields and sees only required server identity fields.
      expect(client.getServerVersion()).toEqual({ name: 'Packetrove', version: PACKETROVE_VERSION });
      expect((await client.listTools()).tools.map(tool => tool.name)).toEqual(catalogTools.map(tool => tool.mcp.name));
      const example = CIDR_COVER_EXAMPLES[1]!;
      const response = await client.callTool({ name: MCP_TOOL_NAME, arguments: example.request });
      expect(response.isError).not.toBe(true);
      expect(response.structuredContent).toEqual(example.result);
      expectSuccessContent(response.content, toolCatalog.cidr, example.result);
    } finally { await client.close(); }
  });
  it.each(catalogTools.filter(tool => tool.execution === 'local'))('keeps malformed-request errors identical to the API for $id', async tool => {
    const client = await connectedClient();
    try {
      await client.listTools();
      const api = await exports.default.fetch(`http://localhost${tool.api.path}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
      });
      expect(api.status).toBe(400);
      const response = await client.callTool({ name: tool.mcp.name, arguments: {} });
      expect(response.isError).toBe(true);
      expect(response.content).toHaveLength(1);
      const content = response.content?.[0];
      if (content?.type !== 'text') throw new Error('Missing error content');
      expect(ErrorResponseSchema.parse(JSON.parse(content.text))).toEqual(await api.json());
    } finally { await client.close(); }
  });
  it.each(CIDR_COVER_EXAMPLES)('returns the API result for $name', async ({ request, result }) => {
    const client = await connectedClient();
    try {
      await client.listTools();
      const response = await client.callTool({ name: MCP_TOOL_NAME, arguments: request });
      expect(response.isError).not.toBe(true);
      expect(CidrCoverResultSchema.parse(response.structuredContent)).toEqual(result);
      expectSuccessContent(response.content, toolCatalog.cidr, result);
    } finally { await client.close(); }
  });
  it.each(CIDR_SUBTRACT_EXAMPLES)('returns the exact subtraction $name result', async ({ request, result }) => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: CIDR_SUBTRACT_TOOL_NAME, arguments: request });
      expect(response.isError).not.toBe(true);
      expect(CidrSubtractResultSchema.parse(response.structuredContent)).toEqual(result);
      expectSuccessContent(response.content, toolCatalog.subtract, result);
    } finally { await client.close(); }
  });
  it.each(RANGE_TO_CIDRS_EXAMPLES)('returns the exact IP range $name result', async ({ request, result }) => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: toolCatalog.range.mcp.name, arguments: request });
      expect(response.isError).not.toBe(true);
      expect(RangeToCidrsResultSchema.parse(response.structuredContent)).toEqual(result);
      expectSuccessContent(response.content, toolCatalog.range, result);
    } finally { await client.close(); }
  });
  it('returns the full IPv6 range as /0 with an exact string count', async () => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: toolCatalog.range.mcp.name, arguments: {
        start: '::', end: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      } });
      expect(RangeToCidrsResultSchema.parse(response.structuredContent)).toMatchObject({
        cidrs: ['::/0'], cidrCount: 1, addressCount: '340282366920938463463374607431768211456',
      });
    } finally { await client.close(); }
  });
  it.each(rangeEndpointErrorCases)('returns shared range endpoint errors: $request', async ({ request, code, fields }) => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: toolCatalog.range.mcp.name, arguments: request });
      expect(response.isError).toBe(true);
      expect(response.content).toHaveLength(1);
      expect(response.structuredContent).toBeUndefined();
      const content = response.content?.[0];
      if (content?.type !== 'text') throw new Error('Missing error content');
      const error = ErrorResponseSchema.parse(JSON.parse(content.text)).error;
      expect(error.code).toBe(code);
      expect(error.issues?.map(issue => issue.field)).toEqual(fields);
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
      expect(response.content).toHaveLength(1);
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
      expect(response.content).toHaveLength(1);
      expect(response.structuredContent).toBeUndefined();
      const content = response.content?.[0];
      if (content?.type !== 'text') throw new Error('Missing error content');
      expect(ErrorResponseSchema.safeParse(JSON.parse(content.text)).success).toBe(true);
    } finally { await client.close(); }
  });
  it.each(catalogTools)('executes the website guide example for $mcp.name', async tool => {
    const example = tool.example;
    const client = await connectedClient('http://localhost/mcp', undefined, toolCatalog.ip.example.result.ip);
    try {
      expect((await client.listTools()).tools.some(entry => entry.name === tool.mcp.name)).toBe(true);
      const response = await client.callTool({ name: tool.mcp.name, arguments: example.request });
      expect(response.isError).not.toBe(true);
      const expected = await expectedObservation(tool, example, response.structuredContent);
      expect(response.structuredContent).toEqual(expected);
      expectSuccessContent(response.content, tool, expected);
      const content = response.content?.[0];
      if (content?.type !== 'text') throw new Error('Missing result content');
      expect(JSON.parse(content.text)).toEqual(expected);
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
      expectSuccessContent(response.content, toolCatalog.cidr, result);
    } finally { await client.close(); }
  });
  it('returns actionable business errors as tool errors', async () => {
    const client = await connectedClient();
    try {
      const response = await client.callTool({ name: MCP_TOOL_NAME, arguments: { inputs: ['::1', '203.0.113.1'] } });
      expect(response.isError).toBe(true);
      expect(response.content).toHaveLength(1);
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
      expect(response.content).toHaveLength(1);
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
      expect(client.getServerVersion()).toEqual({ ...PACKETROVE_IDENTITY, version: PACKETROVE_VERSION });
      expect((await client.listTools()).tools[0]?.name).toBe(MCP_TOOL_NAME);
      for (const tool of catalogTools.filter(tool => tool.execution === 'local')) {
        for (const example of tool.examples) {
          const response = await client.callTool({ name: tool.mcp.name, arguments: example.request });
          expect(response.isError).not.toBe(true);
          const expected = await expectedObservation(tool, example, response.structuredContent);
          expect(response.structuredContent).toEqual(expected);
          expectSuccessContent(response.content, tool, expected);
          // A text-only consumer can ignore optional resource links and retain the complete answer.
          const text = LegacyCallToolResultSchema.parse(response).content.find(item => item.type === 'text');
          if (text?.type !== 'text') throw new Error('Missing JSON result');
          expect(JSON.parse(text.text)).toEqual(expected);
        }
      }
    } finally { await client.close(); }
  });
  it.each(catalogTools)('keeps the $id link independent of inputs, results, and request language', async tool => {
    const destinations: string[] = [];
    const results: unknown[] = [];
    for (const example of tool.examples) {
      const client = new Client({ name: 'optional-link-tests', version: '0.1.0' }, {
        versionNegotiation: { mode: 'auto' },
      });
      await client.connect(new StreamableHTTPClientTransport(new URL('http://localhost/mcp'), {
        fetch: workerFetch, requestInit: { headers: {
          'accept-language': 'zh-CN,fr;q=0.9',
          ...(tool.execution === 'connection' ? { 'cf-connecting-ip': (example.result as { ip: string }).ip } : {}),
        } },
      }));
      try {
        await client.listTools();
        const response = await client.callTool({ name: tool.mcp.name, arguments: example.request });
        const expected = await expectedObservation(tool, example, response.structuredContent);
        expect(response.structuredContent).toEqual(expected);
        expectSuccessContent(response.content, tool, expected);
        const link = response.content?.find(item => item.type === 'resource_link');
        if (link?.type !== 'resource_link') throw new Error('Missing optional tool page link');
        const destination = new URL(link.uri);
        expect(destination.protocol).toBe('https:');
        expect(destination.origin).toBe(PUBLIC_WEBSITE_ORIGIN);
        expect(destination.pathname).toBe(tool.webPath);
        expect(destination.search).toBe('');
        expect(destination.hash).toBe('');
        expect(destination.username).toBe('');
        expect(destination.password).toBe('');
        expect(link.title).toBe(tool.title);
        expect(link.mimeType).toBe('text/html');
        destinations.push(link.uri);
        results.push(response.structuredContent);
        // The original text content remains a complete answer for clients ignoring links.
        const text = response.content?.find(item => item.type === 'text');
        if (text?.type !== 'text') throw new Error('Missing JSON result');
        expect(JSON.parse(text.text)).toEqual(expected);
      } finally { await client.close(); }
    }
    expect(new Set(results.map(result => JSON.stringify(result))).size).toBeGreaterThan(1);
    expect(new Set(destinations)).toEqual(new Set([PUBLIC_WEBSITE_ORIGIN + tool.webPath]));
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
      expectSuccessContent(response.content, toolCatalog.ip, result);
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
      expect(response.content).toHaveLength(1);
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
      expectSuccessContent(response.content, toolCatalog.ip, { ip: '203.0.113.1', family: 'ipv4' });
    } finally { await client.close(); }
  });
});
