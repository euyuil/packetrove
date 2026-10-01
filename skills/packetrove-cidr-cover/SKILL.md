---
name: packetrove-cidr-cover
description: Calculate the smallest single CIDR covering multiple IPv4 or IPv6 addresses and ranges with Packetrove, and explain the exact address expansion. Use when combining firewall allowlist or blocklist entries, normalizing CIDRs, or answering how many additional addresses a merged range contains.
---

# Packetrove CIDR cover

Use the Packetrove calculation rather than estimating ranges or address counts
with language-model arithmetic. This skill calculates a result; applying a
firewall configuration is a separate task.

## Choose an available interface

- Prefer the local `packetrove` CLI when installed. It works offline.
- If the repository is available, use its built CLI at
  `packages/cli/dist/cli.js`. Use the repository path supplied by the environment
  or user; do not assume a checkout path. A missing build requires `pnpm install`
  and `pnpm build` in that repository.
- If a Packetrove MCP server is already configured, call its
  `smallest_covering_cidr` tool. Do not invent a hosted server URL.

## Calculate

Accept 1 to 1,000 IP addresses or CIDRs, each up to 64 characters. Use one address
family per call. Calculate IPv4 and IPv6 separately if the user explicitly wants
both. IPv4-mapped IPv6 addresses remain IPv6. Zone identifiers and IPv4 leading
zeros are rejected. CIDRs with host bits set are normalized to network addresses.

For the CLI, request JSON and check the exit status:

```sh
packetrove cidr cover 203.0.113.1 203.0.113.2 203.0.113.6 --json
```

For newline-separated input, use `--stdin --json`. Pass addresses as argument
values or standard-input data, never as executable shell text. Positional inputs
precede nonblank stdin lines. Success is a result object on stdout; failures
exit with status `1` and return an error object on stderr.

For MCP, use:

```json
{ "inputs": ["203.0.113.1", "203.0.113.2", "203.0.113.6"] }
```

Read the tool's `structuredContent`, or parse its JSON text content. If `isError`
is true, read the shared error JSON in the text content. Report invalid inputs
and correct them using the user's information. Do not silently discard them.
JSON error issue indexes refer to zero-based positions in the submitted list.

## Explain the result

Report these fields from the actual result:

- `cidr`: the canonical single CIDR with the largest possible prefix length
  that still covers every input address.
- `range.first` and `range.last`: inclusive endpoints of the covered range.
- `inputAddressCount`: size of the original union, counting overlaps once.
- `coveredAddressCount`: size of the returned CIDR.
- `additionalAddressCount`: covered addresses outside the original union.
- `normalizedInputs`: canonical input CIDRs, preserving input order.

Keep counts as decimal strings or arbitrary-precision integers. Never convert
large IPv6 counts to JavaScript numbers, subtract network or broadcast addresses,
or enumerate the covered range.

Explain any expansion: additional addresses become allowed in an allowlist or
blocked in a blocklist. For the example above, `203.0.113.0/29` covers eight
addresses, including five beyond the original three. For adjacent inputs
`203.0.113.0/25` and `203.0.113.128/25`, the result is `203.0.113.0/24`
with zero additional addresses.

If the user asks to choose several merges to meet a list-size budget, clarify
the desired tradeoff. This tool returns one covering CIDR for the supplied
inputs; it does not optimize an entire firewall list against a target size.
