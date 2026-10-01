import { exports } from 'cloudflare:workers';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as LegacyClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as LegacyTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport as LegacyTransportContract } from '@modelcontextprotocol/sdk/shared/transport.js';
import { describe, expect, it } from 'vitest';
import {
  CIDR_COVER_EXAMPLES, CidrCoverResultSchema, ErrorResponseSchema,
  MAX_REQUEST_BYTES, MCP_TOOL_NAME,
} from '@packetrove/contracts';

const workerFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  // Direct Worker dispatch bypasses the HTTP layer that normally sets Host.
  request.headers.set('host', new URL(request.url).host);
  const response = await exports.default.fetch(request);
  expect(response.headers.get('mcp-session-id')).toBeNull();
  return response;
};

async function connectedClient() {
  const client = new Client({ name: 'packetrove-tests', version: '0.1.0' }, {
    versionNegotiation: { mode: 'auto' },
  });
  await client.connect(new StreamableHTTPClientTransport(new URL('http://localhost/mcp'), { fetch: workerFetch }));
  return client;
}

describe('stateless MCP in the Workers runtime', () => {
  it('discovers a read-only tool with input and output schemas', async () => {
    const client = await connectedClient();
    try {
      const { tools } = await client.listTools();
      expect(tools).toHaveLength(1);
      expect(tools[0]).toMatchObject({
        name: MCP_TOOL_NAME, annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
        inputSchema: { type: 'object', required: ['inputs'] },
        outputSchema: { type: 'object' },
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
  it('supports legacy Streamable HTTP initialization, discovery, and calls without sessions', async () => {
    const client = new LegacyClient({ name: 'legacy-packetrove-tests', version: '0.1.0' });
    const transport = new LegacyTransport(new URL('http://localhost/mcp'), { fetch: workerFetch });
    // SDK 1.30 declares sessionId differently on its transport and interface.
    await client.connect(transport as LegacyTransportContract);
    try {
      expect(client.getServerVersion()?.name).toBe('Packetrove');
      expect((await client.listTools()).tools[0]?.name).toBe(MCP_TOOL_NAME);
      const example = CIDR_COVER_EXAMPLES[1]!;
      const response = await client.callTool({ name: MCP_TOOL_NAME, arguments: example.request });
      expect(response.structuredContent).toEqual(example.result);
    } finally { await client.close(); }
  });
  it('enforces the shared HTTP body limit', async () => {
    const response = await exports.default.fetch('http://localhost/mcp', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: ' '.repeat(MAX_REQUEST_BYTES + 1),
    });
    expect(response.status).toBe(413);
  });
  it('keeps default browser Origin validation', async () => {
    const response = await exports.default.fetch('http://localhost/mcp', {
      method: 'POST', headers: { 'content-type': 'application/json', host: 'localhost', origin: 'https://unrelated.example' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    expect(response.status).toBe(403);
  });
});
