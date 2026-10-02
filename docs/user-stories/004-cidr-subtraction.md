# Exact CIDR subtraction

## User stories

### WireGuard exceptions

As someone preparing a WireGuard configuration, I want to remove local or other
excluded networks from my intended tunnel address space, so that I can copy a
positive CIDR list into `AllowedIPs` without manually splitting ranges.

The user enters their intended address space in **Include** and exceptions in
**Exclude**. **Copy AllowedIPs** copies the complete result separated by commas,
as a setting value rather than a configuration file. The user reviews the result
before applying it. Packetrove does not configure WireGuard or change routes.

### Remaining address space

As someone planning subnet allocations, I want to subtract known allocations
from a parent range, so that I can inspect the remaining address space.

The user enters the parent range and known allocations, then reads the exact
remaining CIDRs and address count. Exclusions outside the included space remove
no addresses. The result describes gaps relative to the inputs; it does not
prove that addresses are unused on the live network or enumerate available
subnets of a requested size.

### List-to-list subtraction

As someone working with several network ranges, I want to subtract an entire
exclusion list at once, so that I do not need repeated single-range calculations
or a one-off script.

Both textareas accept multiple entries. The calculation returns the canonical,
sorted, non-overlapping minimal CIDR representation of
`union(include) - union(exclude)`. It never replaces the include list with its
single covering CIDR, which could introduce addresses between disjoint ranges.

These stories follow [issue #39](https://github.com/euyuil/packetrove/issues/39).
Its linked discussions motivate the use cases; they are qualitative examples,
not evidence of market size.

## Behavior and examples

The tool is available at `/cidr/subtract` and under the existing `/zh`, `/es`,
`/de`, and `/ja` prefixes, with labels, errors, descriptions, and metadata in all
five website languages. The homepage and navigation link to it. All five pages
are prerendered and included in the sitemap.

Enter one IPv4 or IPv6 address or CIDR per line. Blank lines are ignored; invalid
entries report the affected list and original physical line number. Individual
addresses become `/32` or `/128`. CIDRs with host bits follow the covering
calculator's normalization behavior. One calculation uses one address family
across both lists, including exclusions that fall outside the included space.

Including `203.0.113.0/24` and excluding `203.0.113.64/26` returns:

```text
203.0.113.0/26
203.0.113.128/25
```

The counts are 256 included addresses, 64 actually removed, and 192 remaining.
The `AllowedIPs` copy value is `203.0.113.0/26, 203.0.113.128/25`.

Including `2001:db8::/124` and excluding `2001:db8::4/126` returns:

```text
2001:db8::/126
2001:db8::8/125
```

The counts are 16 included addresses, 4 removed, and 12 remaining.

- An empty include list is a validation error.
- An empty exclude list returns the exact minimal union of included ranges.
  Adjacent siblings may merge; gaps are preserved.
- Duplicate, overlapping, and nested entries count once on each side.
- The removed count measures the intersection of the two unions, not the full
  exclusion list. An exclusion larger than an included range removes only that
  included range's addresses.
- Complete removal is a successful empty result: zero CIDRs and zero remaining
  addresses. It displays **No addresses remain** and disables both copy actions.
- **Copy list** copies every output CIDR separated by newlines. **Copy AllowedIPs**
  copies every CIDR separated by commas and spaces. Neither format truncates the
  result. If clipboard access fails, the read-only result remains selectable.
- Editing either input clears the result, error, and copy feedback. Switching
  language or navigating away and back in the same tab preserves both drafts,
  the result, or the validation error without recalculating. Reloading starts
  with empty inputs.

## Limits, privacy, and implementation

Include and exclude together allow at most 1,000 entries, including duplicates.
Each entry may contain at most 64 characters after browser input trimming.
The shared core also validates raw entry length when called directly.
Output may contain at most 10,000 CIDRs. Larger exact results produce an explicit
error and no partial result; the user must reduce exclusions or included ranges.
One excluded host from IPv6 `/0` already requires 128 result CIDRs, so input and
output limits are separate.

The shared TypeScript core reuses strict address parsing and canonical formatting.
It merges intervals on each side, subtracts them with an ordered sweep, and
decomposes the remaining intervals into their largest aligned CIDR blocks.
It uses `BigInt` without enumerating individual addresses. Address counts are
exact decimal strings; the web layer formats them without converting to `Number`.
Counts include all addresses, including network and broadcast addresses.

The browser calls the shared core locally. Inputs and results remain in memory;
they are not uploaded, logged, persisted, or added to URLs. Prerendering starts
with empty inputs and makes no network requests. There are no new dependencies
or external services. The API, CLI, MCP, and covering-calculator skill expose
their existing operations; subtraction is currently a core and website tool.

Focused tests cover interval boundaries, `/0`, `/32`, `/128`, canonicalization,
overlaps on both sides, disjoint ranges, spanning exclusions, complete removal,
input and output limits, exact IPv6 counts, copy formats, local calculation,
language and navigation state, prerendering, and hydration. A deterministic
small-set oracle checks both address families against independent set membership
and recursive minimal CIDR partitioning. Run `pnpm check` before submission.
