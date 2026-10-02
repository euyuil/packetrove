# Current public IP address

The scope below is agreed. The README records implementation and deployment
status for each interface.

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
- Keep the result in memory for display. Do not store lookup history, add
  analytics, or log the IP in application logs or production verification.
  Cloudflare still processes the request under the operator's platform settings.
- Set a request timeout and provide useful loading, error, and retry behavior.
- Perform no background polling. Each lookup invokes the API Worker and
  counts toward its request allowance; the static page uses static asset hosting.
  See [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

The tool reports an address. It does not edit firewall rules or automatically
insert the result into the CIDR calculator.
