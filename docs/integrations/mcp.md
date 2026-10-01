# MCP connection

Packetrove provides a stateless remote Model Context Protocol (MCP) server using
Streamable HTTP. Start it locally with `pnpm dev:api`.

| Setting | Value |
| --- | --- |
| Local URL | `http://localhost:8787/mcp` |
| Transport | Streamable HTTP |
| Authentication | None |
| Tool | `smallest_covering_cidr` |

Use your client's remote HTTP server configuration and set the URL above. This
is a local development address, not a deployed public service. Configuration keys
vary by client. The server supports modern stateless requests and legacy
Streamable HTTP initialization, tool discovery, and tool calls. It does not
provide persistent MCP sessions or standalone server event streams.

## Tool input and result

Pass an `inputs` array containing 1 to 1,000 IPv4 addresses or IPv6 addresses,
including CIDRs. Use one address family throughout. For example:

```json
{ "inputs": ["203.0.113.1", "203.0.113.2", "203.0.113.6"] }
```

The tool returns the same structured result as the Web API. `structuredContent`
contains the object; a text content block also contains its JSON representation.
Address counts are decimal strings and overlapping inputs count once.

The result for this example is `203.0.113.0/29`, covering eight addresses, of
which five are additional. Report that expansion when explaining an allowlist
or blocklist result. A result is a calculation, not a firewall configuration
change.

Business errors return `isError: true` and a text block containing the shared
error JSON. Protocol validation errors are handled by the MCP SDK. Invalid JSON,
media types, and oversized HTTP bodies are rejected at the HTTP boundary.

## SDK example

With `@modelcontextprotocol/client@2.0.0` installed, a Node.js client can connect
as follows. The repository's Worker workspace includes this package.

```ts
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const client = new Client(
  { name: 'packetrove-example', version: '0.1.0' },
  { versionNegotiation: { mode: 'auto' } },
);
try {
  await client.connect(new StreamableHTTPClientTransport(new URL('http://localhost:8787/mcp')));
  const { tools } = await client.listTools();
  const result = await client.callTool({
    name: 'smallest_covering_cidr',
    arguments: { inputs: ['203.0.113.1', '203.0.113.2', '203.0.113.6'] },
  });
  console.log(tools, result.structuredContent);
} finally {
  await client.close();
}
```

## Deployment configuration

The implementation uses Cloudflare's `createMcpHandler` with a fresh SDK v2
server factory per request. It needs no Durable Objects or database. The
compatible SDK versions are pinned in the Worker package and lockfile.

The handler retains its default Host and browser Origin checks for localhost
and `workers.dev`. When deploying to a custom domain or supporting browser
clients on another domain, configure the SDK's hostname and Origin allowlists
for those actual domains. Non-browser clients without an Origin header work
without login. Actual Cloudflare deployment is outside the current delivery.
