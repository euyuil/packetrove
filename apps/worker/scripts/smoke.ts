import { strict as assert } from 'node:assert';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as LegacyClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as LegacyTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport as LegacyTransportContract } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  CIDR_COVER_EXAMPLES, CIDR_COVER_PATH, CidrCoverResultSchema, ErrorResponseSchema, MCP_TOOL_NAME,
  PUBLIC_IP_PATH, PUBLIC_IP_TOOL_NAME, PublicIpResultSchema,
} from '@packetrove/contracts';

const originArguments = process.argv.slice(2);
if (originArguments.length !== 2) {
  throw new Error('Usage: pnpm smoke <website-origin> <api-origin>');
}
function parseOrigin(argument: string): string {
  const target = new URL(argument);
  assert(['http:', 'https:'].includes(target.protocol), 'Use an HTTP or HTTPS origin.');
  assert(!target.username && !target.password, 'Do not include credentials in the URL.');
  assert(target.pathname === '/' && !target.search && !target.hash, 'Pass an origin without a path, query, or fragment.');
  return target.origin;
}
const origin = parseOrigin(originArguments[0]!);
const apiOrigin = parseOrigin(originArguments[1]!);
assert.notEqual(origin, apiOrigin, 'Website and API must use separate origins.');
const expectedCommit = process.env.VITE_GIT_COMMIT;
if (expectedCommit) assert.match(expectedCommit, /^[0-9a-f]{40}$/i, 'Expected a full Git commit SHA.');

const timedFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  return fetch(request, { signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]) });
};
const mcpFetch: typeof fetch = async (input, init) => {
  const response = await timedFetch(input, init);
  assert.equal(response.headers.get('mcp-session-id'), null, 'MCP must remain stateless.');
  assert.match(response.headers.get('cache-control') ?? '', /\bno-store\b/, 'MCP responses must not be stored.');
  return response;
};

const website = await timedFetch(`${origin}/`);
assert.equal(website.status, 200, 'Website status');
assert.match(website.headers.get('content-type') ?? '', /text\/html/);
const html = await website.text();
assert.match(html, /<title>Packetrove — Network tools for humans and agents<\/title>/);
for (const path of ['/cidr', '/cidr/', '/ip', '/ip/']) {
  const toolPage = await timedFetch(`${origin}${path}`, {
    headers: { accept: 'text/html', 'sec-fetch-mode': 'navigate' },
  });
  assert.equal(toolPage.status, 200, `Tool page status: ${path}`);
  assert.match(toolPage.headers.get('content-type') ?? '', /text\/html/);
  assert.match(await toolPage.text(), path.startsWith('/cidr')
    ? /<title>Smallest Covering CIDR — Packetrove<\/title>/ : /<title>My Public IP — Packetrove<\/title>/);
}
const missingPage = await timedFetch(`${origin}/missing-page`, {
  headers: { accept: 'text/html', 'sec-fetch-mode': 'navigate' },
});
assert.equal(missingPage.status, 404, 'Missing page status');
assert.match(missingPage.headers.get('content-type') ?? '', /text\/html/);
const missingHtml = await missingPage.text();
assert.match(missingHtml, /<h1>Page not found<\/h1>/);
assert.match(missingHtml, /<a href="\/">Return to home<\/a>/);
const missingAsset = await timedFetch(`${origin}/assets/missing.js`);
assert.equal(missingAsset.status, 404, 'Missing asset status');
for (const path of ['/api/v1/ip', '/api/v1/cidr/cover', '/api/openapi.json', '/mcp', '/health', '/v1/ip', '/openapi.json']) {
  const response = await timedFetch(`${origin}${path}`);
  assert.equal(response.status, 404, `Website must not serve an interface endpoint: ${path}`);
  await response.body?.cancel();
}
for (const path of ['/api/v1/cidr/cover', '/mcp']) {
  const response = await timedFetch(`${origin}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(response.status, 405, `Website must reject tool-call POST requests: ${path}`);
  await response.body?.cancel();
}
for (const path of ['/', '/cidr', '/ip', '/assets/missing.js', '/api/v1/ip', '/api/openapi.json']) {
  const response = await timedFetch(`${apiOrigin}${path}`, {
    headers: { accept: 'text/html', 'sec-fetch-mode': 'navigate' },
  });
  assert.equal(response.status, 404, `API must not serve website assets or old paths: ${path}`);
  assert.equal(ErrorResponseSchema.parse(await response.json()).error.code, 'NOT_FOUND');
}
console.log('PASS website and API origin separation');
const unknownApi = await timedFetch(`${apiOrigin}/v1/unknown`, {
  headers: { accept: 'text/html', 'sec-fetch-mode': 'navigate' },
});
assert.equal(unknownApi.status, 404, 'Unknown API status');
assert.equal(ErrorResponseSchema.parse(await unknownApi.json()).error.code, 'NOT_FOUND');
console.log('PASS direct page navigation, page and asset 404s, and JSON API errors');
const assets = Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^\"]+\.(?:js|css))"/g), match => match[1]!);
assert(assets.some(path => path.endsWith('.js')), 'Missing bundled JavaScript.');
assert(assets.some(path => path.endsWith('.css')), 'Missing bundled stylesheet.');
let sourceCommitFound = false;
for (const path of assets) {
  const response = await timedFetch(new URL(path, origin));
  assert.equal(response.status, 200, `Asset status: ${path}`);
  assert.match(response.headers.get('content-type') ?? '', path.endsWith('.js') ? /javascript/ : /text\/css/);
  const content = await response.text();
  assert(content.length > 0, `Empty asset: ${path}`);
  if (path.endsWith('.js') && expectedCommit && content.includes(expectedCommit)) sourceCommitFound = true;
  const apiAsset = await timedFetch(new URL(path, apiOrigin));
  assert.equal(apiAsset.status, 404, `API must not serve a website asset: ${path}`);
  assert.equal(ErrorResponseSchema.parse(await apiAsset.json()).error.code, 'NOT_FOUND');
}
console.log(`PASS website and ${assets.length} bundled assets`);
if (expectedCommit) {
  assert(sourceCommitFound, 'Website JavaScript does not contain the expected build commit.');
  console.log('PASS website build commit matches the deployment');
}

const health = await timedFetch(`${apiOrigin}/health`);
assert.equal(health.status, 200, 'Health status');
assert.deepEqual(await health.json(), { status: 'ok' });
const specification = await timedFetch(`${apiOrigin}/openapi.json`);
assert.equal(specification.status, 200, 'Specification status');
const document = await specification.json() as { openapi: string; paths: Record<string, unknown> };
assert.equal(document.openapi, '3.1.0');
assert(document.paths[CIDR_COVER_PATH], 'Missing calculator endpoint in the specification.');
assert(document.paths[PUBLIC_IP_PATH], 'Missing public IP endpoint in the specification.');
const publicIpResponse = await timedFetch(`${apiOrigin}${PUBLIC_IP_PATH}`, { cache: 'no-store', headers: { origin } });
assert.equal(publicIpResponse.status, 200, 'Public IP API status');
assert.equal(publicIpResponse.headers.get('access-control-allow-origin'), '*', 'Public IP must allow credential-free browser access.');
assert.equal(publicIpResponse.headers.get('access-control-allow-credentials'), null, 'Public API must not enable browser credentials.');
assert.equal(publicIpResponse.headers.get('set-cookie'), null, 'Public API must not set cookies.');
assert.equal(publicIpResponse.headers.get('cache-control'), 'no-store', 'Public IP results must not be stored.');
// Validate without printing the address into public deployment logs.
assert(PublicIpResultSchema.safeParse(await publicIpResponse.json()).success, 'Invalid public IP result.');
console.log('PASS public IP API result and no-store header');
const plainIpResponse = await timedFetch(`${apiOrigin}${PUBLIC_IP_PATH}`, {
  cache: 'no-store', headers: { accept: 'text/plain' },
});
assert.equal(plainIpResponse.status, 200, 'Plain-text public IP API status');
assert.match(plainIpResponse.headers.get('content-type') ?? '', /^text\/plain(?:;|$)/);
assert.equal(plainIpResponse.headers.get('cache-control'), 'no-store', 'Plain-text IP results must not be stored.');
assert(plainIpResponse.headers.get('vary')?.split(',').some(value => value.trim().toLowerCase() === 'accept'),
  'Public IP response format must vary by Accept.');
const plainIp = await plainIpResponse.text();
assert(plainIp.endsWith('\n'), 'Plain-text IP result must end with a newline.');
const ip = plainIp.slice(0, -1);
// Keep actual lookup addresses out of assertion output and deployment logs.
assert(PublicIpResultSchema.safeParse({ ip, family: ip.includes(':') ? 'ipv6' : 'ipv4' }).success,
  'Invalid plain-text public IP result.');
console.log('PASS plain-text public IP API result and no-store header');
for (const example of CIDR_COVER_EXAMPLES) {
  const response = await timedFetch(`${apiOrigin}${CIDR_COVER_PATH}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(example.request),
  });
  assert.equal(response.status, 200, example.name);
  assert.deepEqual(CidrCoverResultSchema.parse(await response.json()), example.result);
}
const invalid = await timedFetch(`${apiOrigin}${CIDR_COVER_PATH}`, {
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
  await client.connect(new StreamableHTTPClientTransport(new URL(`${apiOrigin}/mcp`), { fetch: mcpFetch }));
  const tools = (await client.listTools()).tools;
  assert(tools.some(tool => tool.name === MCP_TOOL_NAME), 'Missing CIDR tool.');
  assert(tools.some(tool => tool.name === PUBLIC_IP_TOOL_NAME), 'Missing public IP tool.');
  const result = await client.callTool({ name: MCP_TOOL_NAME, arguments: example.request });
  assert.notEqual(result.isError, true);
  assert.deepEqual(result.structuredContent, example.result);
  const publicIp = await client.callTool({ name: PUBLIC_IP_TOOL_NAME, arguments: {} });
  assert.notEqual(publicIp.isError, true, 'Public IP tool failed.');
  assert(PublicIpResultSchema.safeParse(publicIp.structuredContent).success, 'Invalid public IP tool result.');
} finally { await client.close(); }
console.log('PASS modern MCP discovery, calculation, and public IP without an Origin header');

const legacyClient = new LegacyClient({ name: 'packetrove-legacy-smoke', version: '0.1.0' });
try {
  const transport = new LegacyTransport(new URL(`${apiOrigin}/mcp`), {
    fetch: mcpFetch, requestInit: { headers: { origin } },
  });
  // SDK 1.30 declares sessionId differently on its transport and interface.
  await legacyClient.connect(transport as LegacyTransportContract);
  assert.equal(legacyClient.getServerVersion()?.name, 'Packetrove');
  assert.equal((await legacyClient.listTools()).tools[0]?.name, MCP_TOOL_NAME);
  const result = await legacyClient.callTool({ name: MCP_TOOL_NAME, arguments: example.request });
  assert.notEqual(result.isError, true);
  assert.deepEqual(result.structuredContent, example.result);
  const publicIp = await legacyClient.callTool({ name: PUBLIC_IP_TOOL_NAME, arguments: {} });
  assert.notEqual(publicIp.isError, true, 'Legacy public IP tool failed.');
  assert(PublicIpResultSchema.safeParse(publicIp.structuredContent).success, 'Invalid legacy public IP tool result.');
} finally { await legacyClient.close(); }
console.log('PASS legacy MCP initialization, discovery, calculation, and public IP with a website Origin header');

const rejected = await timedFetch(`${apiOrigin}/mcp`, {
  method: 'POST', headers: {
    'content-type': 'application/json', origin: 'https://unrelated.example',
  },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
});
assert.equal(rejected.status, 403, 'Unrelated browser Origins must be rejected.');
console.log(`PASS MCP Origin validation\nVerified website ${origin} and API ${apiOrigin}`);
