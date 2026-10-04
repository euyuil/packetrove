import { env } from 'cloudflare:test';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { expect, it } from 'vitest';
import { CIDR_COVER_EXAMPLES, getServiceIdentity, getToolResultLink, PACKETROVE_VERSION, toolCatalog } from '@packetrove/contracts';
import { createApp } from '../src/app';

it.each(['dev', 'staging'] as const)('uses only the configured %s MCP host and website', async name => {
  const api = `https://api.${name}.packetrove.com` as Cloudflare.Env['PUBLIC_API_ORIGIN'];
  const website = `https://${name}.packetrove.com` as Cloudflare.Env['PUBLIC_WEBSITE_ORIGIN'];
  const app = createApp();
  const fetcher: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    request.headers.set('host', new URL(request.url).host);
    return app.fetch(request, { ...env, PUBLIC_API_ORIGIN: api, PUBLIC_WEBSITE_ORIGIN: website });
  };
  const client = new Client({ name: 'environment-tests', version: '0.1.0' }, { versionNegotiation: { mode: 'auto' } });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${api}/mcp`), {
    fetch: fetcher, requestInit: { headers: { origin: website } },
  }));
  try {
    expect(client.getServerVersion()).toEqual({ ...getServiceIdentity(website), version: PACKETROVE_VERSION });
    const example = CIDR_COVER_EXAMPLES[1]!;
    const result = await client.callTool({ name: toolCatalog.cidr.mcp.name, arguments: example.request });
    expect(result.structuredContent).toEqual(example.result);
    expect(result.content).toEqual([
      { type: 'text', text: JSON.stringify(example.result) }, getToolResultLink(toolCatalog.cidr, website),
    ]);
  } finally { await client.close(); }
  for (const [host, origin] of [['api.packetrove.com', website], [new URL(api).host, 'https://packetrove.com']]) {
    const response = await app.fetch(new Request(`${api}/mcp`, {
      method: 'POST', headers: { host: host!, origin: origin!, 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }), { ...env, PUBLIC_API_ORIGIN: api, PUBLIC_WEBSITE_ORIGIN: website });
    expect(response.status).toBe(403);
  }
});
