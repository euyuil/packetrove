# API contract

[openapi.json](openapi.json) is generated from the shared Zod schemas. Edit the
schemas and generator, then run `pnpm spec:generate`. `pnpm spec:check` verifies
that the committed document matches its source and validates OpenAPI semantics.

The [API documentation](https://packetrove.com/docs/api) includes prerendered
endpoint summaries and curl examples in every supported website language. In the
browser, it loads Scalar to render this specification and support interactive
test calls. Test requests go directly to the configured API without cookies or
a third-party proxy. Calculation inputs entered into the documentation's test
client are sent to the API; the website's CIDR calculator continues to run
locally in the browser.

If the interactive reference module fails to load or render, the documentation area
shows an error message with a link back to the calculator. Site navigation and
the calculator's input, result, or validation error remain in the current page
session's memory. Revisiting a failed module may show the same message; the
application does not retry its download or automatically reload the page.

## Smallest covering CIDR

The configured production base URL is `https://api.packetrove.com`. The
specification is served at [openapi.json](https://api.packetrove.com/openapi.json).
For example:

```sh
curl https://api.packetrove.com/v1/cidr/cover \
  -H 'Content-Type: application/json' \
  -d '{"inputs":["203.0.113.1","203.0.113.2","203.0.113.6"]}'
```

`POST /v1/cidr/cover` accepts an object with an `inputs` array containing
1 to 1,000 IP addresses or CIDRs. Each string can contain at most 64 characters.
Use `Content-Type: application/json`; the request body limit is 64 KiB.

Use one address family per request. Individual IPv4 and IPv6 addresses represent
`/32` and `/128` ranges respectively. CIDRs with host bits are normalized to
their network address. Surrounding whitespace is ignored during parsing.
IPv4 must use four decimal octets without leading zeros. IPv6 zone identifiers
are not supported. IPv4-mapped IPv6 addresses retain the IPv6 address family.
IPv6 addresses with dotted IPv4 tails preserve their original 128-bit value:
`::192.0.2.1` and `::c000:201` represent the same address; `::ffff:192.0.2.1`
represents a different address.

The response returns a canonical covering CIDR, normalized inputs in the
original order, the covered address range, and exact address counts. Normalized
inputs retain duplicates; the original address count uses the union of the
inputs, counting overlapping addresses once. All counts are decimal strings,
including for IPv4. Counts include every address in the range, including subnet
network and broadcast addresses.

A covering CIDR may add addresses. Replacing allowlist entries with that CIDR
can allow additional addresses; replacing blocklist entries can block additional
addresses. The tool calculates a result and does not edit firewall rules.

## Current public IP

The public IP endpoint is `/v1/public-ip`. The former `/v1/ip` path is removed
without a compatibility alias or redirect; update existing callers.

`GET /v1/public-ip` takes no request body and returns the address observed for the
current request. For a plain-text address suitable for shell commands:

```sh
curl -fsS https://api.packetrove.com/v1/public-ip \
  -H 'Accept: text/plain'
```

This success response has `Content-Type: text/plain; charset=UTF-8` and contains
only the IPv4 or IPv6 address followed by a newline. With no `Accept` header or
with `Accept: application/json`, the response remains JSON, for example:

```json
{ "ip": "203.0.113.1", "family": "ipv4" }
```

The address family is either `ipv4` or `ipv6`, matching the `ip` field. A request
observes one address family; it does not separately discover both addresses.
With a VPN or proxy this is the exit address. A hosted client observes its own
connection, which may differ from a user's browser or computer.

IP responses include `Vary: Accept`. Errors remain structured JSON, including
when plain text is requested. Results and errors use `Cache-Control: no-store`.
The application does not retain or log
the result. Cloudflare connection headers supply the address in the production
deployment; arbitrary forwarded headers, query parameters, or request bodies
cannot supply a substitute. Missing or invalid connection metadata returns
`503` with `CLIENT_IP_UNAVAILABLE`, including local environments without that
metadata. See the [user story](../user-stories/002-current-public-ip.md) for
network-path and hosting limitations.

## Errors

Errors use `{ "error": { "code": "...", "message": "...", "issues": [] } }`.
The optional `issues` array contains messages and, when applicable, a zero-based
`index` into `inputs`. An invalid entry makes the whole calculation fail;
entries are never silently skipped.
For a structurally valid calculation request, all invalid addresses or CIDRs
are reported together in input order, so they can be corrected in one pass.

Invalid JSON, invalid inputs, and mixed address families return `400`. Oversized
request bodies return `413`, unsupported media types return `415`, and unexpected
failures return `500` without exposing internal exception details. Missing IP
connection metadata returns `503`. Unsupported
methods on known endpoints return `405` with an `Allow` header.

## Service metadata

`GET /health` returns `{ "status": "ok" }`.
`GET /openapi.json` serves the generated specification through Cloudflare
Static Assets, ahead of the Worker script. It supports `HEAD`, ETag-based
revalidation, and anonymous cross-origin access. Each deployment publishes the
validated specification from the same source as the API contracts.

The contract specifies anonymous access. Implementation and deployment status
are tracked in the repository README.

The website at `https://packetrove.com` does not serve API endpoints. The former
`/api/v1/*` and `/api/openapi.json` addresses on that host no longer serve the API
after this revision is deployed (GET returns 404; POST returns 405).
Public API calls require no cookies; browser callers should
use `credentials: 'omit'`. The API allows anonymous cross-origin calls and does
not enable credentialed CORS or set application cookies.
