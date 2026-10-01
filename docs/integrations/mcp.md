# MCP connection

Packetrove provides a stateless remote Model Context Protocol (MCP) server using
Streamable HTTP. Connect to the production endpoint below, or start a local
Worker with `pnpm dev:api`.

| Setting | Value |
| --- | --- |
| Production URL | `https://packetrove.com/mcp` |
| Verification URL | `https://packetrove.example.workers.dev/mcp` |
| Local URL | `http://localhost:8787/mcp` |
| Transport | Streamable HTTP |
| Authentication | None |
| Tool | `smallest_covering_cidr` |

Use your client's remote HTTP server configuration and set the production URL
above. Configuration keys vary by client. Both public hostnames are deployed and
verified. The server supports modern stateless requests and legacy
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
  await client.connect(new StreamableHTTPClientTransport(new URL('https://packetrove.com/mcp')));
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

For local development, replace the URL with `http://localhost:8787/mcp`.

## Deployment configuration

The implementation uses Cloudflare's `createMcpHandler` with a fresh SDK v2
server factory per request. It needs no Durable Objects or database. The
compatible SDK versions are pinned in the Worker package and lockfile.

The handler explicitly validates Host and browser Origin hostnames against
localhost, `packetrove.example.workers.dev`, and `packetrove.com`. Update the exact
allowlists when adding another hostname. Non-browser clients without an Origin
header work without login. Deployment steps and live verification are described
in the [Cloudflare deployment guide](../deployment.md).
