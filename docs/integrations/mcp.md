# MCP connection

Packetrove provides a stateless remote Model Context Protocol (MCP) server using
Streamable HTTP. Connect to the production endpoint below, or start a local
Worker with `pnpm dev:api`.

The [website MCP guide](https://packetrove.com/docs/mcp) provides the same
connection steps and tool examples in every supported website language. Tool
pages link there for configuration. Reading documentation does not connect a
client; clients discover tools through `tools/list` after configuration.

| Setting | Value |
| --- | --- |
| Production URL | `https://api.packetrove.com/mcp` |
| Local URL | `http://localhost:8787/mcp` |
| Transport | Streamable HTTP |
| Authentication | None |
| Tools | `smallest_covering_cidr`, `subtract_cidrs`, `public-ip` |

Use your client's remote HTTP server configuration and set the production URL
above. Configuration keys vary by client. GitHub Actions publishes the configured
production endpoint when changes reach `main`; verify the deployment with the
smoke check in the deployment guide. The server supports modern stateless
requests and legacy Streamable HTTP initialization, tool discovery, and tool calls. It does not
provide persistent MCP sessions or standalone server event streams.

## Claude Code and Codex

With Claude Code installed, add Packetrove to your user configuration so it is
available across projects:

```sh
claude mcp add --transport http --scope user packetrove \
  https://api.packetrove.com/mcp
```

With the Codex CLI installed, add the remote server:

```sh
codex mcp add packetrove \
  --url https://api.packetrove.com/mcp
```

Use `/mcp` inside either client to inspect the connection. These commands
configure the remote server; they do not install a local Packetrove server.
See the [Claude Code MCP guide](https://code.claude.com/docs/en/mcp) and
[Codex MCP guide](https://developers.openai.com/codex/mcp/) for client options.

## Smallest covering CIDR tool

Use `smallest_covering_cidr` for one selected group of firewall allowlist or
blocklist entries, including questions about extra coverage and normalized
inputs. It returns one CIDR, not a choice of several merges to meet an entire
list's entry budget. It does not modify firewall rules. Remote calls send the
input list to the server; use the browser calculator or built CLI for local
calculation.

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
For `INVALID_INPUT` and `MIXED_ADDRESS_FAMILIES`, correct the submitted inputs
using the caller's information rather than silently dropping entries. Preserve
IPv6 counts as decimal strings or arbitrary-precision integers.

## Exact CIDR subtraction tool

Use `subtract_cidrs` to prepare WireGuard exceptions or compute the remaining
address space relative to supplied include and exclude lists:

```json
{ "include": ["203.0.113.0/24"], "exclude": ["203.0.113.64/26"] }
```

Include must be nonempty; exclude may be empty. Use one address family, at most
1,000 entries across both arrays, and at most 64 characters per entry. The
result is the minimal sorted canonical CIDR list for the exact set difference;
overlaps count once and no addresses are added. This example returns
`203.0.113.0/26` and `203.0.113.128/25`, with 256 included, 64 removed, and 192
remaining addresses. Address counts are decimal strings, including for IPv6.

The result includes `cidrs`, `normalizedInclude`, `normalizedExclude`,
`includedAddressCount`, `removedAddressCount`, and `remainingAddressCount`.
Complete removal returns an empty list successfully. More than 10,000 output
CIDRs returns an error with no partial list. Invalid-entry error issues identify
the `include` or `exclude` list and its zero-based entry `index`.

Remote calls send both lists to the server. The website uses the same core
locally. Remaining ranges do not prove live availability, and the tool does
not configure WireGuard or change firewall rules. The CLI currently does not
expose subtraction.

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
  await client.connect(new StreamableHTTPClientTransport(new URL('https://api.packetrove.com/mcp')));
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

## Current public IP tool

Use `public-ip` to inspect the connection making the MCP request, including
checks after a network, VPN, or proxy change. Call it with an empty arguments object:

```ts
const result = await client.callTool({ name: 'public-ip', arguments: {} });
```

The former `get_public_ip` tool name is removed without a compatibility alias.
Update saved tool calls and refresh tool discovery to use `public-ip`.

Success returns the same result in `structuredContent` and a text JSON block,
for example `{ "ip": "203.0.113.1", "family": "ipv4" }`. Tool discovery is
available even when connection metadata is missing; a call then returns an
`isError: true` result with `CLIENT_IP_UNAVAILABLE` in its text error JSON.
Do not replace an unavailable result with the sample address.

The address belongs to the connection making this tool call. A hosted AI client
may report its own exit address, not the user's computer. Use the web page or
run the CLI on the user's machine when that is the network path to inspect.
The tool does not discover a pre-proxy address or separately probe IPv4 and
IPv6. Cloudflare Worker subrequests can have platform-specific address semantics;
the result is not a client identity or authorization proof.

The server reads metadata for each tool-call request, with isolated server
instances for concurrent clients. MCP responses use `Cache-Control: no-store,
no-transform`. The application does not retain or log lookup addresses. The
tool is read-only, non-destructive, idempotent, and annotated as open-world
because its result depends on the current network connection.

## Deployment configuration

Tool registration, metadata, schemas, and documentation examples are generated
from the [shared tool catalog](../../packages/contracts/src/tools.ts). The
localized guide and tool pages use one `ToolMcpSection` template. Tests compare
the actual discovered tool set with the catalog and verify every documented
example, including subtraction.

The implementation uses Cloudflare's `createMcpHandler` with a fresh SDK v2
server factory per request. It needs no Durable Objects or database. The
compatible SDK versions are pinned in the Worker package and lockfile.

The handler validates Host against the local hostnames and `api.packetrove.com`.
Browser Origin validation additionally allows `packetrove.com`. Update these
separate exact allowlists when adding another hostname. Non-browser clients
without an Origin header work without login. Deployment steps and live verification are described
in the [Cloudflare deployment guide](../deployment.md).

After this revision is deployed, `https://packetrove.com/mcp` no longer serves MCP:
GET returns 404 and POST returns 405.
Update existing MCP client configurations to `https://api.packetrove.com/mcp`;
the website does not proxy or redirect tool calls to the API Worker.
