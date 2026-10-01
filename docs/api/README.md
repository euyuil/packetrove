# API contract

[openapi.json](openapi.json) is generated from the shared Zod schemas. Edit the
schemas and generator, then run `pnpm spec:generate`. `pnpm spec:check` verifies
that the committed document matches its source and validates OpenAPI semantics.

## Smallest covering CIDR

The production base URL is `https://packetrove.com`. The deployed specification
is available at [api/openapi.json](https://packetrove.com/api/openapi.json).
For example:

```sh
curl https://packetrove.com/api/v1/cidr/cover \
  -H 'Content-Type: application/json' \
  -d '{"inputs":["203.0.113.1","203.0.113.2","203.0.113.6"]}'
```

`POST /api/v1/cidr/cover` accepts an object with an `inputs` array containing
1 to 1,000 IP addresses or CIDRs. Each string can contain at most 64 characters.
Use `Content-Type: application/json`; the request body limit is 64 KiB.

Use one address family per request. Individual IPv4 and IPv6 addresses represent
`/32` and `/128` ranges respectively. CIDRs with host bits are normalized to
their network address. Surrounding whitespace is ignored during parsing.
IPv4 must use four decimal octets without leading zeros. IPv6 zone identifiers
are not supported. IPv4-mapped IPv6 addresses retain the IPv6 address family.

The response returns a canonical covering CIDR, normalized inputs in the
original order, the covered address range, and exact address counts. Normalized
inputs retain duplicates; the original address count uses the union of the
inputs, counting overlapping addresses once. All counts are decimal strings,
including for IPv4. Counts include every address in the range, including subnet
network and broadcast addresses.

A covering CIDR may add addresses. Replacing allowlist entries with that CIDR
can allow additional addresses; replacing blocklist entries can block additional
addresses. The tool calculates a result and does not edit firewall rules.

## Errors

Errors use `{ "error": { "code": "...", "message": "...", "issues": [] } }`.
The optional `issues` array contains messages and, when applicable, a zero-based
`index` into `inputs`. An invalid entry makes the whole calculation fail;
entries are never silently skipped.

Invalid JSON, invalid inputs, and mixed address families return `400`. Oversized
request bodies return `413`, unsupported media types return `415`, and unexpected
failures return `500` without exposing internal exception details. Unsupported
methods on known endpoints return `405` with an `Allow` header.

## Service metadata

`GET /health` returns `{ "status": "ok" }`.
`GET /api/openapi.json` returns the generated specification.

The contract specifies anonymous access. Implementation and deployment status
are tracked in the repository README.
