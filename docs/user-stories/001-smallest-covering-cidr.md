# Smallest covering CIDR for firewall IP lists

This document records a user story for Packetrove. The calculation described
below is agreed; interface details and implementation choices remain under
discussion. The tool has not been implemented.

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
IPv4 inputs, the agreed calculation is:

- Each input can be an individual IP address or a CIDR range. An individual
  address represents a single address, equivalent to a `/32` range.
- Return one canonical CIDR in `a.b.c.d/n` form. The address must be the network
  address for the returned prefix.
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
agents through Model Context Protocol (MCP) and reusable skills. Command-line
access is also a project direction under consideration.

When a calculation can run in the browser, the web application should be able to
perform it locally without calling the hosted API. Browser and server interfaces
can share the same calculation code. TypeScript is a candidate for this shared
code; the language and server runtime have not been selected.

Keep hosting costs low. Consider Cloudflare services and inexpensive server
hosting according to what the tool actually needs. A deployment choice has not
been made.

## Proposed result presentation

In addition to the resulting CIDR, show the covered address range and how many
addresses it adds beyond the union of the original inputs. Count overlapping
inputs once. These counts describe all addresses covered by firewall rules;
they do not subtract subnet network or broadcast addresses.

This presentation is a proposal to make the effect of combining entries clear.
The exact web interface and programmatic response fields remain to be agreed.

## Open design decisions

- Whether the first version supports IPv4 only or both IPv4 and IPv6.
- Whether CIDRs with host bits set are normalized with an explanation or rejected.
- The web API contract, MCP tool definition, skill contents, and command-line
  interface scope.
- The deployment platform and runtime.

Choosing which entries to combine across an entire list to meet a target entry
limit would require a separate definition of the optimization goal. That broader
behavior has not been agreed for this story.
