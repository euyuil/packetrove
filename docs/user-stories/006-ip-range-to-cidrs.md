# IP range to an exact CIDR list

## User stories

As someone preparing an allowlist from a change request, I want to convert
inclusive start and end IP addresses into CIDRs that admit exactly that range,
so that no additional addresses are included.

As someone given a range in an inventory or spreadsheet, I want to enter its
endpoints directly and verify its address count without enumerating addresses
or writing a script.

These stories implement [issue #77](https://github.com/euyuil/packetrove/issues/77).
The initial version handles one endpoint pair, in one address family. Multiple
pairs, bulk imports, vendor-specific ACL exports, CLI or agent-skill operations,
live allocation checks, and configuration changes are outside this version.

## Inputs and results

The website path is `/range-to-cidrs`, with the existing nine locale prefixes.
All ten supported languages have labels, guidance, field errors, questions,
metadata, prerendered pages, and sitemap entries. Navigation and the homepage
gallery reference the shared catalog and its documentation-address examples.

Enter one **Start IP** and one **End IP**. Both are inclusive and must be IPv4
or both IPv6, without CIDR prefixes. Surrounding whitespace is ignored; each
raw endpoint allows up to 64 characters. The strict shared parser rejects zone
identifiers, IPv4 leading zeros, shorthand IPv4, and malformed addresses. Dotted
IPv6 tails retain their actual 128-bit value and address family.

Missing or invalid endpoints produce actionable issues identifying `start` or
`end`. Parsing reports both invalid fields together. Prefixes are rejected;
they are not normalized into addresses. Mixed families identify End IP.
Reversed ranges identify End IP and never silently swap the endpoints. Equal
endpoints return one host CIDR, `/32` or `/128`.

The result shows normalized endpoints, the address family, the exact address
count, the CIDR count, and every canonical CIDR sorted by network address. CIDRs
have no overlaps or gaps and contain no addresses outside the range. The list
is minimal: no smaller CIDR list represents the same set. Counts include both
endpoints and all intervening addresses, including IPv4 network and broadcast
addresses. `addressCount` is always an exact decimal string; the UI formats it
with `BigInt`, without conversion to an imprecise JavaScript `Number`.

The range `203.0.113.11` through `203.0.113.23` contains 13 addresses and returns:

```text
203.0.113.11/32
203.0.113.12/30
203.0.113.16/29
```

The corresponding single covering CIDR is `203.0.113.0/27`, containing 32
addresses and adding 19 beyond the requested range. Use the exact list when an
allowlist must match the supplied range. The single covering tool remains useful
when one network and its additional coverage are acceptable.

The IPv6 range `2001:db8::b` through `2001:db8::17` also contains 13 addresses:

```text
2001:db8::b/128
2001:db8::c/126
2001:db8::10/125
```

The complete IPv4 space returns `0.0.0.0/0` with `"4294967296"` addresses.
The complete IPv6 space returns `::/0` with
`"340282366920938463463374607431768211456"` addresses. Decomposition is bounded
by the address width: at most 62 CIDRs for one IPv4 range or 254 for IPv6.

## Interaction and privacy

Input and result panels use shared page components and size independently.
Successful submission keeps focus on the active control and reveals an entirely
offscreen result panel. A short polite status announces completion with address
and CIDR counts; the complete list is outside that live region. Invalid input
focuses the error summary, whose issue links focus the affected endpoint without
changing the URL.

**Copy with newlines** puts one CIDR on each line. **Copy with commas** separates
CIDRs with a comma and a space. Both copy the complete list. Feedback describes
the chosen format and corresponds to the current result. If clipboard access
fails, the read-only output remains fully selectable. Late clipboard completion
cannot restore feedback after the endpoints have changed.

Editing either endpoint, clearing, or choosing an example clears stale results,
errors, completion text, and copy feedback. Language changes and navigation in
the same tab preserve both drafts, results, or errors without recalculating.
Retained results and errors use the current language. Reloading starts with
empty endpoints.

Browser calculations call the shared core locally. Inputs and results stay in
memory; they are not uploaded, logged, persisted, or placed in URLs. Examples
and prerendering make no live lookups. API and remote MCP requests explicitly
submit endpoints to the server. The tool does not inspect live address usage
or change firewall, routing, or VPN configuration.

## Shared interfaces and verification

The catalog declares one name, `range-to-cidrs`, and derives the website path,
`POST /v1/range-to-cidrs`, OpenAPI operation identifier, and MCP tool name. API
and MCP call the same shared core as the website and preserve field-specific
structured errors. The MCP discovery schema remains the catalog request schema;
local calculation requests reach core validation so SDK validation cannot
replace located errors with plain text. HTTP-level errors retain their existing
JSON, content-type, size-limit, and method semantics.

See the [API contract](../api/README.md#ip-range-to-cidrs) and generated
[MCP guide](../integrations/mcp.md) for remote call examples. CLI and skill scope
remain unchanged. There are no new dependencies or external services.

The shared greedy interval decomposition emits the largest aligned block that
fits each step, using `BigInt` and never enumerating addresses. CIDR subtraction
reuses it while retaining its existing 10,000-output limit and error semantics.

Tests cover IPv4 and IPv6 examples, equal and adjacent endpoints, aligned and
unaligned ranges, subnet boundaries, minimum and maximum addresses, complete
spaces, canonicalization, invalid endpoint forms, missing fields, prefixes,
mixed families, reverse order, and exact serialization. An independent recursive
binary-tree oracle exhaustively checks every valid endpoint pair within a
64-address block for each family against explicit membership and minimal
partitioning. Interface tests verify API/MCP error parity, discovery, examples,
local browser privacy, full-copy formats, clipboard failure and stale feedback,
navigation, translations, and production HTML hydration. Production smoke
checks cover catalog-based endpoints, MCP calls, and every localized page.

Generate OpenAPI and the MCP guide, then run `pnpm check` before submission.
