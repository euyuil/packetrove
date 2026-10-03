# Smallest covering CIDR for firewall IP lists

This document records the agreed calculation, behavior, and implementation
choices for Packetrove's covering-CIDR tool. The shared calculation is available
through the website, API, MCP, CLI, and agent skill. See the
[API contract](../api/README.md) and [integration guides](../integrations/)
for interface usage.

## User stories

As someone maintaining a cloud firewall IP allowlist or blocklist, I want to
combine multiple IP addresses or IP ranges into a single CIDR that covers every
input address while including as few additional addresses as possible, so that
I can reduce the number of entries in a list with a size limit.

As someone pasting an address list from a configuration, spreadsheet, or another
calculation, I want the web calculator to accept common separators, so that I can
calculate without manually putting every value on a separate line.

## Context

The user's public IP address changes frequently. Adding new addresses to a
firewall allowlist over time creates more entries, eventually approaching the
cloud platform's limit. Combining entries can reduce the entry count, but a
larger range may also include addresses outside the original inputs.

The same calculation applies to blocklists. Replacing entries with a covering
range can allow additional addresses in an allowlist or block additional
addresses in a blocklist.

## Agreed calculation

The tool accepts a list of inputs, with more than two entries supported. For
IPv4 and IPv6 inputs, the agreed calculation is:

- Each input can be an individual IP address or a CIDR range. An individual
  address represents a single address, equivalent to `/32` for IPv4 or `/128`
  for IPv6. A calculation must use one address family throughout.
- Return one canonical CIDR. The address must be the network address for the
  returned prefix; IPv6 uses its standard address notation.
- The result must contain every address represented by any input, including
  the entire range when an input is a CIDR.
- Maximize the prefix length `n` among all single CIDRs that contain all inputs.
  This gives the smallest single covering CIDR.
- The result may contain addresses absent from the original inputs. Preserving
  exactly the original set of addresses is not always possible with one CIDR.

| Inputs | Smallest covering CIDR | Additional addresses |
| --- | --- | --- |
| `203.0.113.0/25`, `203.0.113.128/25` | `203.0.113.0/24` | None |
| `203.0.113.1`, `203.0.113.2` | `203.0.113.0/30` | `203.0.113.0` and `203.0.113.3` |
| `203.0.113.1`, `203.0.113.2`, `203.0.113.6` | `203.0.113.0/29` | `203.0.113.0`, `203.0.113.3`, `203.0.113.4`, `203.0.113.5`, and `203.0.113.7` |

## Requested access and cost goals

The user wants an interactive web application, a web API, and access for AI
agents through Model Context Protocol (MCP), a command-line interface, and a
reusable skill.

When a calculation can run in the browser, the web application should be able to
perform it locally without calling the hosted API. Browser and server interfaces
will share TypeScript calculation code. The selected stack is Cloudflare
Workers with Hono for API and MCP access, and React with Vite and Mantine for
the web app. Use Mantine controls, layout components, and a shared theme to
minimize custom CSS.

Keep hosting costs low. The website, API, and MCP are deployed on Cloudflare
Workers with Static Assets; see the [deployment guide](../deployment.md).
API and MCP access is anonymous, without accounts or authentication.

## Result presentation

In addition to the resulting CIDR, show the covered address range and how many
addresses it adds beyond the union of the original inputs. Count overlapping
inputs once. These counts describe all addresses covered by firewall rules;
they do not subtract subnet network or broadcast addresses.

The web app performs the calculation locally. The API returns a structured
result with exact counts represented as decimal strings; MCP uses the same result.

The input grows with pasted content up to a bounded scrollable height. Input
and result panels size independently. Present the resulting CIDR and copy
action first, with the additional-address count and coverage warning immediately
below, followed by input/covered counts and the address range. Keep the warning
visible without expanding a disclosure.

On submission, focus a visible error summary whose issue links return to the
input. Retain physical line numbers and associate the summary with the input.
A successful calculation updates a short polite, atomic status containing the
resulting CIDR, rather than announcing the entire result panel. Repeating the
calculation refreshes that status. Success keeps keyboard focus on the active
control and reveals the result panel when it is entirely outside the viewport;
editing and clearing remove the previous result and status.

The web input accepts commas (ASCII `,` or full-width `，`), spaces, tabs, and
line breaks, in any combination. Empty entries are ignored; input order and
duplicates are preserved for validation and the entry limit. Invalid entries
report their original physical line. When a line contains multiple entries,
errors also identify the entry's position within that line, counting every
non-empty entry, including valid entries. Both CIDR
tools use this parsing rule, and either subtraction copy format can be pasted
directly into the covering calculator.

The homepage introduces Packetrove and links to its tools. The calculator has
its own page at `/cidr`; My Public IP is at `/public-ip`. The calculator includes
questions about firewall entry limits, extra coverage, overlaps, exact counts,
and local input processing. Its MCP section shows `smallest_covering_cidr`
arguments and results, and links to the same-language `/docs/mcp` guide.
Remote API and MCP calculations send inputs to the server; the browser and
built CLI calculate locally.

Switching between the homepage, calculator, My Public IP, and documentation in the same tab
preserves the calculator's input and its result or validation error. This draft
stays in the current page session's memory; reloading or closing the tab clears
it. Clear removes the input, result, and error. Drafts are not saved to browser
storage or URLs, or uploaded to the service.

## Implementation decisions

- Support both IPv4 and IPv6, rejecting mixed address families in one calculation.
- Normalize CIDRs with host bits set and show canonical inputs in the result.
- Use shared Zod schemas to generate the OpenAPI specification.
- Accept 1 to 1,000 entries per calculation, with a 64 KiB HTTP request body limit.
- Deliver a local CLI and repository skill in addition to the web app, API, and MCP.

Choosing which entries to combine across an entire list to meet a target entry
limit would require a separate definition of the optimization goal. That broader
behavior has not been agreed for this story.
