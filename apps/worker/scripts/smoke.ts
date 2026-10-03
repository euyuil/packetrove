import { strict as assert } from 'node:assert';
import { isDeepStrictEqual } from 'node:util';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as LegacyClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as LegacyTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport as LegacyTransportContract } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CallToolResultSchema as LegacyCallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  CIDR_COVER_EXAMPLES, CIDR_COVER_PATH, CidrCoverResultSchema, ErrorResponseSchema, MCP_TOOL_NAME,
  PACKETROVE_IDENTITY, PACKETROVE_VERSION, PUBLIC_IP_PATH, PUBLIC_IP_TOOL_NAME, PublicIpResultSchema, MAX_SUBTRACTION_OUTPUTS, tools as catalogTools, isToolPage,
} from '@packetrove/contracts';
import { getPageMetadata, WEBSITE_ORIGIN } from '../../web/src/i18n/page-metadata';
import { resources } from '../../web/src/i18n/resources';
import { escapeHtml, robotsText, websitePages, websiteRedirects } from '../../web/src/seo';
import { localizedPath, pagePaths } from '../../web/src/i18n/routes';

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

for (const icon of PACKETROVE_IDENTITY.icons) {
  const url = new URL(icon.src);
  assert.equal(url.protocol, 'https:', 'MCP icon must use HTTPS.');
  assert.equal(url.origin, WEBSITE_ORIGIN, 'MCP icon must be project-owned.');
  const response = await timedFetch(new URL(url.pathname, origin));
  assert.equal(response.status, 200, 'MCP icon availability');
  assert.equal(response.headers.get('content-type')?.split(';')[0], icon.mimeType, 'MCP icon MIME type');
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'MCP icon PNG signature');
  assert.equal(bytes.subarray(12, 16).toString(), 'IHDR', 'MCP icon PNG dimensions');
  assert.deepEqual(icon.sizes, [`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`], 'MCP icon advertised size');
}
console.log('PASS project-owned MCP icon availability, MIME type, and image dimensions');

function assertMcpSuccessContent(content: unknown, tool: (typeof catalogTools)[number], result: unknown) {
  // Boolean checks avoid printing a real lookup address if a production assertion fails.
  assert(isDeepStrictEqual(content, [
    { type: 'text', text: JSON.stringify(result) }, tool.mcp.resultLink,
  ]), `MCP must retain exact JSON text and a generic tool page link: ${tool.id}`);
}

const website = await timedFetch(`${origin}/`);
assert.equal(website.status, 200, 'Website status');
assert.match(website.headers.get('content-type') ?? '', /text\/html/);
const html = await website.text();
for (const page of websitePages) {
  for (const path of page.pathname.endsWith('/') ? [page.pathname] : [page.pathname, page.pathname + '/']) {
    const response = await timedFetch(`${origin}${path}`, {
      headers: { accept: 'text/html', 'sec-fetch-mode': 'navigate' },
    });
    assert.equal(response.status, 200, `Page status: ${path}`);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/);
    const pageHtml = await response.text();
    assert(!/\{\{[^{}]*\}\}/.test(pageHtml), `Unresolved translation placeholder: ${path}`);
    const metadata = getPageMetadata(page.locale, page.page, page.path, resources[page.locale].translation);
    assert(pageHtml.includes('<html lang="' + metadata.lang + '"'), `Page language: ${path}`);
    assert(pageHtml.includes('<title>' + escapeHtml(metadata.title) + '</title>'), `Page title: ${path}`);
    for (const entry of metadata.meta) {
      assert(pageHtml.includes('<meta ' + entry.attribute + '="' + entry.key
        + '" content="' + escapeHtml(entry.content) + '"'), `Page metadata ${entry.key}: ${path}`);
    }
    for (const entry of metadata.links) {
      assert(pageHtml.includes('<link rel="' + entry.rel + '"'
        + (entry.hreflang ? ' hreflang="' + entry.hreflang + '"' : '')
        + ' href="' + entry.href + '"'), `Page link ${entry.rel}: ${path}`);
    }
    const text = resources[page.locale].translation;
    const heading = page.page === 'home' ? text.common.tagline : text[page.page].title;
    assert.equal(Array.from(pageHtml.matchAll(/<h1\b/g)).length, 1, `Single page heading: ${path}`);
    assert(new RegExp('<h1[^>]*>' + escapeHtml(heading) + '</h1>').test(pageHtml), `Prerendered heading: ${path}`);
    assert(pageHtml.includes('data-prerendered-path="' + page.pathname + '"'), `Prerendered page: ${path}`);
    const navigation = /<nav\b[^>]*>([\s\S]*?)<\/nav>/.exec(pageHtml)?.[1] ?? '';
    assert(navigation.includes('href="' + localizedPath(pagePaths.home, page.locale) + '"'), `Shared Home navigation: ${path}`);
    for (const tool of catalogTools) {
      assert(navigation.includes('href="' + localizedPath(tool.webPath, page.locale) + '"'), `Shared tool navigation: ${path}`);
    }
    for (const documentationPath of [pagePaths.api, pagePaths.mcp, pagePaths.privacy]) {
      assert(!navigation.includes('href="' + localizedPath(documentationPath, page.locale) + '"'), `Documentation outside primary navigation: ${path}`);
    }
    const footer = /<footer\b[^>]*>([\s\S]*?)<\/footer>/.exec(pageHtml)?.[1] ?? '';
    assert(footer.includes('href="' + localizedPath(pagePaths.privacy, page.locale) + '"'), `Privacy policy footer link: ${path}`);
    if (page.page === 'privacy') {
      assert(pageHtml.includes(escapeHtml(text.privacy.sections.remote.body)), `Remote data disclosure: ${path}`);
      assert(pageHtml.includes(escapeHtml(text.privacy.sections.logs.body)), `Application log disclosure: ${path}`);
      assert(pageHtml.includes(escapeHtml(text.privacy.sections.providers.body)), `Platform retention disclosure: ${path}`);
      assert(pageHtml.includes('href="mailto:hello@packetrove.com"'), `Privacy contact: ${path}`);
    }
    for (const [documentationPath, label] of [[pagePaths.api, text.footer.apiDocumentation], [pagePaths.mcp, text.mcp.navigation]] as const) {
      assert(footer.includes('href="' + localizedPath(documentationPath, page.locale) + '"'), `Localized footer documentation: ${path}`);
      assert(footer.includes(escapeHtml(label)), `Footer documentation label: ${path}`);
    }
    assert(footer.includes('/docs/integrations/cli.md') && footer.includes(escapeHtml(text.footer.cliGuide)), `Footer CLI guide: ${path}`);
    for (const heading of [text.footer.project, text.footer.integrations, text.footer.contact]) {
      assert(footer.includes(escapeHtml(heading)), `Footer section heading: ${path}`);
    }
    const explanation = page.page === 'home' ? text.home.cidrDescription : page.page === 'api'
      ? text.api.cidrSummary : page.page === 'privacy' ? text.privacy.introduction : text[page.page].explanation;
    assert(pageHtml.includes(escapeHtml(explanation)), `Prerendered explanation: ${path}`);
    if (isToolPage(page.page)) {
      for (const question of Object.values(text.discovery[page.page].questions)) {
        assert(pageHtml.includes(escapeHtml(question.question)), `Tool question: ${path}`);
        assert(pageHtml.includes(escapeHtml(question.answer)), `Tool answer: ${path}`);
      }
    }
    if (page.page !== 'mcp') {
      assert(pageHtml.includes('href="' + localizedPath(pagePaths.mcp, page.locale) + '"'), `MCP guide link: ${path}`);
    } else {
      assert(pageHtml.includes('claude mcp add --transport http --scope user packetrove'), `Claude Code setup: ${path}`);
      assert(pageHtml.includes('codex mcp add packetrove'), `Codex setup: ${path}`);
      assert(pageHtml.includes('structuredContent') && pageHtml.includes('CLIENT_IP_UNAVAILABLE')
        && pageHtml.includes('resource_link'), `MCP result, optional link, and error guide: ${path}`);
      assert(pageHtml.includes('href="' + localizedPath(pagePaths.api, page.locale) + '"'), `MCP API reference link: ${path}`);
      assert(pageHtml.includes('data-mcp-sdk-example') && pageHtml.includes('client.listTools()')
        && pageHtml.includes('client.callTool('), `MCP SDK connection example: ${path}`);
    }
    const documentedTools = catalogTools.filter(tool => page.page === 'mcp' || page.page === tool.page);
    assert.deepEqual(Array.from(pageHtml.matchAll(/data-mcp-tool="([^"]+)"/g), match => match[1]),
      documentedTools.map(tool => tool.mcp.name), `MCP documentation catalog coverage: ${path}`);
    for (const definition of documentedTools) {
      const tool = definition.page;
      const example = definition.example;
      assert(pageHtml.includes('data-mcp-example="resource-link"')
        && pageHtml.includes(escapeHtml(JSON.stringify(definition.mcp.resultLink, null, 2))),
        `MCP resource link example: ${path}`);
      assert(pageHtml.includes('data-mcp-tool="' + definition.mcp.name + '"'), `MCP tool name: ${path}`);
      assert(pageHtml.includes(escapeHtml(JSON.stringify(example.request, null, 2))), `MCP example arguments: ${path}`);
      assert(pageHtml.includes(escapeHtml(JSON.stringify(example.result, null, 2))), `MCP example result: ${path}`);
      const guidance = text.discovery[tool].result
        .replaceAll('{{maximumOutputs}}', new Intl.NumberFormat(page.locale).format(MAX_SUBTRACTION_OUTPUTS));
      assert(pageHtml.includes(escapeHtml(guidance)), `MCP result guidance: ${path}`);
      assert(pageHtml.includes(escapeHtml(text.discovery[tool].boundary)), `MCP tool limitations: ${path}`);
    }
  }
}
const sitemap = await timedFetch(`${origin}/sitemap.xml`);
assert.equal(sitemap.status, 200, 'Sitemap status');
assert.match(sitemap.headers.get('content-type') ?? '', /xml/);
const sitemapXml = await sitemap.text();
assert(sitemapXml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'Sitemap namespace');
assert.deepEqual(Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]),
  websitePages.map(page => WEBSITE_ORIGIN + page.pathname), 'Sitemap canonical URLs');
const robots = await timedFetch(`${origin}/robots.txt`);
assert.equal(robots.status, 200, 'Robots status');
assert.match(robots.headers.get('content-type') ?? '', /text\/plain/);
assert.equal(await robots.text(), robotsText, 'Robots policy and sitemap reference');
console.log(`PASS ${websitePages.length} prerendered localized pages, metadata, canonical and language links, sitemap, and robots policy`);
for (const { from, to } of websiteRedirects) {
  const response = await timedFetch(`${origin}${from}?source=example`, { redirect: 'manual' });
  assert.equal(response.status, 301, `Legacy website redirect status: ${from}`);
  const location = new URL(response.headers.get('location')!, origin);
  assert.equal(location.origin, origin, `Legacy website redirect origin: ${from}`);
  assert.equal(location.pathname, to, `Legacy website redirect destination: ${from}`);
  assert.equal(location.search, '?source=example', `Legacy website redirect query: ${from}`);
  await response.body?.cancel();
}
console.log('PASS all localized legacy tool redirects');
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
for (const path of ['/api/v1/ip', '/api/v1/public-ip', '/api/openapi.json', '/mcp', '/health', '/openapi.json',
  ...catalogTools.map(tool => tool.api.path)]) {
  const response = await timedFetch(`${origin}${path}`);
  assert.equal(response.status, 404, `Website must not serve an interface endpoint: ${path}`);
  await response.body?.cancel();
}
for (const path of ['/mcp', ...catalogTools.filter(tool => tool.api.method === 'post').map(tool => tool.api.path)]) {
  const response = await timedFetch(`${origin}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(response.status, 405, `Website must reject tool-call POST requests: ${path}`);
  await response.body?.cancel();
}
for (const path of ['/', '/docs/api', '/docs/mcp', '/_headers', '/assets/missing.js', '/api/v1/ip', '/api/v1/public-ip', '/api/openapi.json',
  ...catalogTools.flatMap(tool => [tool.webPath, ...tool.legacyWebPaths, ...tool.removedInterfaces.apiPaths])]) {
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
const specification = await timedFetch(`${apiOrigin}/openapi.json`, { headers: { origin } });
assert.equal(specification.status, 200, 'Specification status');
assert.equal(specification.headers.get('access-control-allow-origin'), '*', 'Specification must allow browser access.');
assert.equal(specification.headers.get('access-control-allow-credentials'), null);
assert.equal(specification.headers.get('set-cookie'), null);
assert(specification.headers.get('etag'), 'Static specification must have an ETag.');
assert.match(specification.headers.get('cache-control') ?? '', /\bmust-revalidate\b/);
const document = await specification.json() as { openapi: string; paths: Record<string, unknown> };
assert.equal(document.openapi, '3.1.0');
for (const tool of catalogTools) {
  assert(document.paths[tool.api.path], `Missing tool endpoint in the specification: ${tool.id}`);
  for (const path of tool.removedInterfaces.apiPaths) assert(!document.paths[path], `Removed API path in the specification: ${path}`);
}
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
const invalidCalculationErrors = new Map<string, unknown>();
for (const tool of catalogTools.filter(tool => tool.execution === 'local')) {
  for (const example of tool.examples) {
    const response = await timedFetch(`${apiOrigin}${tool.api.path}`, {
      method: tool.api.method.toUpperCase(), headers: { 'content-type': 'application/json' },
      body: JSON.stringify(example.request),
    });
    assert.equal(response.status, 200, `API calculation status: ${tool.id}`);
    assert.deepEqual(tool.outputSchema.parse(await response.json()), example.result);
  }
  const invalid = await timedFetch(`${apiOrigin}${tool.api.path}`, {
    method: tool.api.method.toUpperCase(), headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(invalid.status, 400, `API must reject an incomplete calculation: ${tool.id}`);
  const error = ErrorResponseSchema.parse(await invalid.json());
  assert.equal(error.error.code, 'INVALID_INPUT');
  invalidCalculationErrors.set(tool.id, error);
}
console.log('PASS health, OpenAPI, IPv4/IPv6 API results, and invalid input');

const example = CIDR_COVER_EXAMPLES[1]!;
const client = new Client({ name: 'packetrove-smoke', version: '0.1.0' }, {
  versionNegotiation: { mode: 'auto' },
});
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(`${apiOrigin}/mcp`), { fetch: mcpFetch }));
  assert.deepEqual(client.getServerVersion(), { ...PACKETROVE_IDENTITY, version: PACKETROVE_VERSION }, 'Modern MCP service identity');
  const tools = (await client.listTools()).tools;
  assert.deepEqual(tools.map(tool => tool.name).sort(), catalogTools.map(tool => tool.mcp.name).sort(), 'MCP catalog coverage');
  for (const name of catalogTools.flatMap(tool => [...tool.removedInterfaces.mcpNames])) {
    await assert.rejects(client.callTool({ name, arguments: {} }), /not found/i, `Removed MCP tool must be rejected: ${name}`);
  }
  const result = await client.callTool({ name: MCP_TOOL_NAME, arguments: example.request });
  assert.notEqual(result.isError, true);
  assert.deepEqual(result.structuredContent, example.result);
  for (const tool of catalogTools.filter(tool => tool.execution === 'local')) {
    for (const example of tool.examples) {
      const response = await client.callTool({ name: tool.mcp.name, arguments: example.request });
      assert.notEqual(response.isError, true, `MCP calculation failed: ${tool.id}`);
      assert.deepEqual(response.structuredContent, example.result);
      assertMcpSuccessContent(response.content, tool, example.result);
    }
    const invalid = await client.callTool({ name: tool.mcp.name, arguments: {} });
    assert.equal(invalid.content?.length, 1, `MCP failures must contain no optional tool page link: ${tool.id}`);
    assert.equal(invalid.isError, true, `MCP must reject an incomplete calculation: ${tool.id}`);
    const content = invalid.content?.[0];
    assert(content?.type === 'text', `MCP must return error content: ${tool.id}`);
    assert.deepEqual(ErrorResponseSchema.parse(JSON.parse(content.text)), invalidCalculationErrors.get(tool.id));
  }
  const publicIp = await client.callTool({ name: PUBLIC_IP_TOOL_NAME, arguments: {} });
  assert.notEqual(publicIp.isError, true, 'Public IP tool failed.');
  assert(PublicIpResultSchema.safeParse(publicIp.structuredContent).success, 'Invalid public IP tool result.');
  assertMcpSuccessContent(publicIp.content, catalogTools.find(tool => tool.mcp.name === PUBLIC_IP_TOOL_NAME)!, publicIp.structuredContent);
} finally { await client.close(); }
console.log('PASS modern MCP discovery, calculation, and public IP without an Origin header');

const legacyClient = new LegacyClient({ name: 'packetrove-legacy-smoke', version: '0.1.0' });
try {
  const transport = new LegacyTransport(new URL(`${apiOrigin}/mcp`), {
    fetch: mcpFetch, requestInit: { headers: { origin } },
  });
  // SDK 1.30 declares sessionId differently on its transport and interface.
  await legacyClient.connect(transport as LegacyTransportContract);
  assert.deepEqual(legacyClient.getServerVersion(), { ...PACKETROVE_IDENTITY, version: PACKETROVE_VERSION }, 'Legacy MCP service identity');
  assert.deepEqual((await legacyClient.listTools()).tools.map(tool => tool.name).sort(),
    catalogTools.map(tool => tool.mcp.name).sort(), 'Legacy MCP catalog coverage');
  const result = await legacyClient.callTool({ name: MCP_TOOL_NAME, arguments: example.request });
  assert.notEqual(result.isError, true);
  assert.deepEqual(result.structuredContent, example.result);
  for (const tool of catalogTools.filter(tool => tool.execution === 'local')) {
    for (const example of tool.examples) {
      const response = await legacyClient.callTool({ name: tool.mcp.name, arguments: example.request });
      assert.notEqual(response.isError, true, `MCP calculation failed: ${tool.id}`);
      assert.deepEqual(response.structuredContent, example.result);
      assertMcpSuccessContent(response.content, tool, example.result);
    }
    const invalid = LegacyCallToolResultSchema.parse(await legacyClient.callTool({ name: tool.mcp.name, arguments: {} }));
    assert.equal(invalid.content?.length, 1, `MCP failures must contain no optional tool page link: ${tool.id}`);
    assert.equal(invalid.isError, true, `Legacy MCP must reject an incomplete calculation: ${tool.id}`);
    const content = invalid.content?.[0];
    assert(content?.type === 'text', `Legacy MCP must return error content: ${tool.id}`);
    assert.deepEqual(ErrorResponseSchema.parse(JSON.parse(content.text)), invalidCalculationErrors.get(tool.id));
  }
  const publicIp = await legacyClient.callTool({ name: PUBLIC_IP_TOOL_NAME, arguments: {} });
  assert.notEqual(publicIp.isError, true, 'Legacy public IP tool failed.');
  assert(PublicIpResultSchema.safeParse(publicIp.structuredContent).success, 'Invalid legacy public IP tool result.');
  assertMcpSuccessContent(publicIp.content, catalogTools.find(tool => tool.mcp.name === PUBLIC_IP_TOOL_NAME)!, publicIp.structuredContent);
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
