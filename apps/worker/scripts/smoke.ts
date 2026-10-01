import { strict as assert } from 'node:assert';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as LegacyClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as LegacyTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport as LegacyTransportContract } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  CIDR_COVER_EXAMPLES, CIDR_COVER_PATH, CidrCoverResultSchema, MCP_TOOL_NAME,
} from '@packetrove/contracts';

const argument = process.argv[2];
if (!argument || process.argv.length !== 3) {
  throw new Error('Usage: pnpm smoke <http-or-https-origin>');
}
const target = new URL(argument);
assert(['http:', 'https:'].includes(target.protocol), 'Use an HTTP or HTTPS origin.');
assert(!target.username && !target.password, 'Do not include credentials in the URL.');
assert(target.pathname === '/' && !target.search && !target.hash, 'Pass an origin without a path, query, or fragment.');
const origin = target.origin;

const timedFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  return fetch(request, { signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]) });
};
const mcpFetch: typeof fetch = async (input, init) => {
  const response = await timedFetch(input, init);
  assert.equal(response.headers.get('mcp-session-id'), null, 'MCP must remain stateless.');
  return response;
};

const website = await timedFetch(`${origin}/`);
assert.equal(website.status, 200, 'Website status');
assert.match(website.headers.get('content-type') ?? '', /text\/html/);
const html = await website.text();
assert.match(html, /Smallest Covering CIDR/);
const assets = Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^\"]+\.(?:js|css))"/g), match => match[1]!);
assert(assets.some(path => path.endsWith('.js')), 'Missing bundled JavaScript.');
assert(assets.some(path => path.endsWith('.css')), 'Missing bundled stylesheet.');
for (const path of assets) {
  const response = await timedFetch(new URL(path, origin));
  assert.equal(response.status, 200, `Asset status: ${path}`);
  assert.match(response.headers.get('content-type') ?? '', path.endsWith('.js') ? /javascript/ : /text\/css/);
  assert((await response.arrayBuffer()).byteLength > 0, `Empty asset: ${path}`);
}
console.log(`PASS website and ${assets.length} bundled assets`);

const health = await timedFetch(`${origin}/health`);
assert.equal(health.status, 200, 'Health status');
assert.deepEqual(await health.json(), { status: 'ok' });
const specification = await timedFetch(`${origin}/api/openapi.json`);
assert.equal(specification.status, 200, 'Specification status');
const document = await specification.json() as { openapi: string; paths: Record<string, unknown> };
assert.equal(document.openapi, '3.1.0');
assert(document.paths[CIDR_COVER_PATH], 'Missing calculator endpoint in the specification.');
for (const example of CIDR_COVER_EXAMPLES) {
  const response = await timedFetch(`${origin}${CIDR_COVER_PATH}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(example.request),
  });
  assert.equal(response.status, 200, example.name);
  assert.deepEqual(CidrCoverResultSchema.parse(await response.json()), example.result);
}
const invalid = await timedFetch(`${origin}${CIDR_COVER_PATH}`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ inputs: ['::1', '203.0.113.1'] }),
});
assert.equal(invalid.status, 400);
assert.equal((await invalid.json() as { error: { code: string } }).error.code, 'MIXED_ADDRESS_FAMILIES');
console.log('PASS health, OpenAPI, IPv4/IPv6 API results, and invalid input');

const example = CIDR_COVER_EXAMPLES[1]!;
const client = new Client({ name: 'packetrove-smoke', version: '0.1.0' }, {
  versionNegotiation: { mode: 'auto' },
});
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), { fetch: mcpFetch }));
  assert.equal((await client.listTools()).tools[0]?.name, MCP_TOOL_NAME);
  const result = await client.callTool({ name: MCP_TOOL_NAME, arguments: example.request });
  assert.notEqual(result.isError, true);
  assert.deepEqual(result.structuredContent, example.result);
} finally { await client.close(); }
console.log('PASS modern MCP discovery and calculation without an Origin header');

const legacyClient = new LegacyClient({ name: 'packetrove-legacy-smoke', version: '0.1.0' });
try {
  const transport = new LegacyTransport(new URL(`${origin}/mcp`), {
    fetch: mcpFetch, requestInit: { headers: { origin } },
  });
  // SDK 1.30 declares sessionId differently on its transport and interface.
  await legacyClient.connect(transport as LegacyTransportContract);
  assert.equal(legacyClient.getServerVersion()?.name, 'Packetrove');
  assert.equal((await legacyClient.listTools()).tools[0]?.name, MCP_TOOL_NAME);
  const result = await legacyClient.callTool({ name: MCP_TOOL_NAME, arguments: example.request });
  assert.notEqual(result.isError, true);
  assert.deepEqual(result.structuredContent, example.result);
} finally { await legacyClient.close(); }
console.log('PASS legacy MCP initialization, discovery, and calculation with a same-origin header');

const rejected = await timedFetch(`${origin}/mcp`, {
  method: 'POST', headers: {
    'content-type': 'application/json', origin: 'https://unrelated.example',
  },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
});
assert.equal(rejected.status, 403, 'Unrelated browser Origins must be rejected.');
console.log(`PASS MCP Origin validation\nVerified ${origin}`);
