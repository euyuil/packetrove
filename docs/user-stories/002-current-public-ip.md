# Current public IP address

This document records the agreed behavior and connection limitations. See the
[API contract](../api/README.md), [CLI guide](../integrations/cli.md), and
[MCP guide](../integrations/mcp.md) for usage, and the
[deployment guide](../deployment.md) for hosting and live verification.

## User story

As a developer or network administrator whose network connection can change,
I want to see the public IP address used by my current connection to Packetrove,
so that I can diagnose my network path or copy the address into a firewall list.

## Agreed behavior

- Observe one IP address from the current request, whether IPv4 or IPv6.
- A VPN or proxy changes the result to its exit address. This is not discovery
  of the device's private local address or its address before the proxy.
- Do not separately probe IPv4 and IPv6 in this version. A single request does
  not establish whether the client has connectivity in both address families.
- Provide a web page, Web API, command-line command, and MCP tool using one
  shared result: `{ "ip": "203.0.113.1", "family": "ipv4" }`.
- The web page is at `/public-ip` (or `/<locale>/public-ip`). Legacy `/ip` links
  redirect permanently to the corresponding page. The API endpoint is
  `/v1/public-ip`, the CLI command is `packetrove public-ip`, and the MCP tool
  name is `public-ip`. All share the same descriptive identifier.
- The web page queries when opened and offers refresh and copy. The existing
  CIDR calculator continues to run locally without making an IP lookup request.
- The CLI observes the network path of the machine running it. A remote MCP
  call observes the MCP client's connection. A hosted AI client's result may
  differ from the user's browser or computer; never present it as the user's
  device address without establishing where the client runs.

## API and infrastructure

`GET /v1/public-ip` takes no body and returns the shared JSON result by default.
With `Accept: text/plain`, a successful response contains only the observed
address and a newline, with `Content-Type: text/plain; charset=UTF-8`.
Errors remain structured JSON and responses include `Vary: Accept`.
The CLI uses the default JSON response from this endpoint; the MCP tool is
named `public-ip` and takes an empty object.
Each interface reports missing or invalid connection information explicitly.
The old API path `/v1/ip`, CLI command `packetrove ip`, and MCP tool
`get_public_ip` are removed without compatibility aliases. Existing callers
must update to the canonical names. Website redirects are separate from these
API, CLI, and MCP contracts.

The API and MCP use the `packetrove-api` Cloudflare Worker at
`api.packetrove.com`, separately from the static website Worker at
`packetrove.com`. No database or third-party IP lookup service is required.
The browser calls the API directly with `credentials: 'omit'`. The deployment uses Cloudflare's connection
headers, handles preserved IPv6 with Pseudo IPv4, and does not substitute an
arbitrary `X-Forwarded-For`, `X-Real-IP`, or user-supplied IP.

This depends on Cloudflare's HTTP boundary. Local development without that
connection metadata reports `CLIENT_IP_UNAVAILABLE`; tests provide documentation
addresses. Another hosting environment would need its own trusted connection
metadata adapter. Worker-to-Worker requests can have Cloudflare-specific address
semantics; the result is an observed connection address, not an identity proof.
See [Cloudflare's header documentation](https://developers.cloudflare.com/fundamentals/reference/http-headers/).

## Freshness, privacy, and cost

- Send `Cache-Control: no-store` for IP results and errors. Browser and CLI
  requests bypass caches, and refreshing clears an old result before retrying.
- Keep the result in memory for display. Do not store lookup history or log
  the IP in application logs or production verification. MCP operational
  events may count executions using the catalog tool name, outcome, and a
  controlled error code; they must exclude inputs, results, connection
  addresses, arbitrary headers, and exception details.
  Cloudflare still processes the request under the operator's platform settings.
  The public [Privacy Policy](https://packetrove.com/privacy) explains that
  hosting boundary and the limits of operator-accessible log retention.
- Set a request timeout and provide useful loading, error, and retry behavior.
  Emphasize the address and copy action; present refresh as a secondary action.
  Reserve address space across loading and address-family changes, and prefer
  IPv6 line breaks between groups while preserving the exact copy value.
  Refresh/retry remains focusable while busy, reports `aria-disabled`, and ignores
  repeated activation until the current lookup finishes. It clears the old
  address and disables copy during loading. Keyboard focus stays on the control
  through completion or error.
- Perform no background polling. Each lookup invokes the API Worker and
  counts toward its request allowance; the static page uses static asset hosting.
  See [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

The tool reports an address. It does not edit firewall rules or automatically
insert the result into the CIDR calculator.

## HTTP client limits

The browser and CLI use one shared HTTP client. Its ten-second deadline covers
both response headers and the complete body; caller cancellation also stops
the pending lookup. Network or body-transfer failures report `NETWORK_ERROR`
without exposing exception details.

The client accepts at most 64 KiB of actual response-body bytes, including
whitespace, regardless of a missing or misleading `Content-Length`. This leaves
ample room for the fixed IP result and normal structured service errors while
bounding accumulation from an abnormal endpoint. At the first chunk exceeding
the limit, it stops reading, requests cancellation, releases its reader, and
reports `INVALID_RESPONSE` without displaying the body. Cancellation cleanup
does not delay or replace that error. Even otherwise valid JSON larger than
64 KiB is rejected; self-hosted endpoints must stay within this client limit.
Small valid structured service errors retain their existing error codes.

Client decoding retains UTF-8 replacement and BOM handling. The API and MCP
JSON request reader shares only the byte-counting and streaming text mechanism:
it keeps its existing 64 KiB request limit, strict UTF-8 validation, media-type
checks, and `PAYLOAD_TOO_LARGE` / `INVALID_JSON` errors. These HTTP body limits
do not apply to command-line address input.

## Page explanations and agent access

The tool page includes questions about connection addresses, VPN/proxy changes,
address families, hosted clients, and application storage. Its `public-ip`
section uses an empty arguments object and a clearly labelled documentation
address for the sample result. The section links to the same-language
`/docs/mcp` connection guide. Both pages explain that a hosted client may
observe its own exit address and direct users to their browser or local CLI
when their device's network path is the intended target.

These explanations and examples are static HTML. Building or reading the MCP
guide makes no IP lookup. Opening `/public-ip` in the browser retains the existing
lookup behavior; language switching does not trigger another request.
