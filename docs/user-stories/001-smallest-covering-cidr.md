# Smallest covering CIDR for firewall IP lists

This document records a user story for Packetrove. The calculation described
below and the first implementation choices are agreed. The shared calculation,
API, web app, MCP, CLI, and agent skill are implemented and documented in the
README.

## User story

As someone maintaining a cloud firewall IP allowlist or blocklist, I want to
combine multiple IP addresses or IP ranges into a single CIDR that covers every
input address while including as few additional addresses as possible, so that
I can reduce the number of entries in a list with a size limit.

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

## Implementation decisions

- Support both IPv4 and IPv6, rejecting mixed address families in one calculation.
- Normalize CIDRs with host bits set and show canonical inputs in the result.
- Use shared Zod schemas to generate the OpenAPI specification.
- Accept 1 to 1,000 entries per calculation, with a 64 KiB HTTP request body limit.
- Deliver a local CLI and repository skill in addition to the web app, API, and MCP.

Choosing which entries to combine across an entire list to meet a target entry
limit would require a separate definition of the optimization goal. That broader
behavior has not been agreed for this story.
