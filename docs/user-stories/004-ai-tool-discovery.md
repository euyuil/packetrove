# AI tool discovery and use

## User story

As a developer or network administrator asking an AI assistant how to reduce
firewall list entries or inspect a connection's public IP, I want it to find
Packetrove, explain whether its tools fit my task, and show how to use them,
so that I can check the result without confusing sample data, network paths,
or calculation limits.

This story builds on [smallest covering CIDR](001-smallest-covering-cidr.md),
[current public IP](002-current-public-ip.md), and
[exact CIDR subtraction](004-cidr-subtraction.md), with
[website languages](003-website-languages.md). It covers discoverable website
content and MCP usage. Improved search inclusion, citations, or recommendations
are outcomes to observe after deployment, not guarantees of this implementation.

## First delivery

- `/cidr` answers questions about reducing selected firewall entries, additional
  coverage, overlaps, canonical inputs, exact counts, and local calculation.
  Its MCP section identifies `smallest_covering_cidr`, the server, arguments,
  results, and limits.
- `/public-ip` answers questions about request connection addresses, VPN/proxy exits,
  one-family results, hosted clients, and application storage. Its MCP section
  identifies `public-ip`, empty arguments, and a documentation-only result.
- `/cidr/subtract` answers questions about WireGuard exceptions, remaining
  allocation gaps, exclusion overlap, and exact set subtraction. It states that
  subtraction is a browser/core tool; there is no subtraction MCP/API/CLI
  operation. It links to the MCP guide for the two available remote tools.
- `/docs/mcp` centralizes Claude Code and Codex remote HTTP configuration,
  `/mcp` inspection, `tools/list` discovery, both tool examples, result decoding,
  errors, and links back to the tools. Reading it makes no tool calls.
- The shared navigation links to the MCP guide in the current language. The
  guide links to the API reference in that language and to the project source.
  Its text, client commands, SDK example, and tool examples also generate the
  repository integration guide; build checks reject stale generated Markdown.
- The homepage keeps a short MCP introduction and server address, with a link
  to the guide. API documentation and tool pages link to that same-language
  guide. Client setup commands live in the guide.
- All new content and metadata are translated for every registered locale.
  New locales merged into `main` before this feature must receive the same
  content and static entries. Tool names, protocol fields, errors, commands,
  and decimal-string results stay unchanged across languages.
- Questions, answers, examples, links, titles, descriptions, canonical URLs,
  and alternate-language links are present in production HTML before JavaScript.
  The guide is included in the sitemap. Hydration keeps existing behavior.
- MCP descriptions explain intended uses and limits; schemas, annotations,
  names, structured errors, and calculation behavior retain their contracts.

No registry submission, analytics, paid model evaluation, special AI files,
external citation campaign, or additional structured markup is included.

## Tool selection boundaries

`smallest_covering_cidr` computes one smallest single CIDR for 1 to 1,000
inputs of one address family. It covers complete input ranges, normalizes host
bits, counts overlaps once, and reports additional addresses with exact decimal
strings. Review expansion before using an allowlist or blocklist result. It
does not optimize a whole list to a target entry count or apply firewall rules.
The browser and built CLI calculate locally; remote API and MCP calls submit
inputs to the service.

Exact CIDR subtraction is a separate browser/core operation. It subtracts the
exclusion union from the included union without introducing addresses, returns
an exact CIDR list, and does not establish live network availability or configure
WireGuard. Refer callers to `/cidr/subtract` for these tasks; do not invent a
subtraction MCP tool, Web API endpoint, or CLI command.

`public-ip` observes the connection making that request. A hosted MCP
client can have a different exit address from the user's device. Recommend
the user's browser or locally run CLI when that network path is the target.
One request observes one family and does not discover local/private addresses,
pre-proxy addresses, both address families, or a trusted identity. Results and
errors use `no-store`; the application does not retain lookup history or log
addresses. Cloudflare still processes requests under the operator's settings.
Examples use documentation addresses and must never substitute for a lookup.

## Acceptance and verification

Automated checks cover every registered locale's static guide and tool content,
metadata and sitemap, hydration without unrelated requests, same-language
links, and retained calculator results/errors through guide navigation. They
parse examples from built HTML against the shared contracts, calculate CIDR
results with the shared core, and execute the same examples through the local
MCP server. Existing IP isolation, errors, cache behavior, API, CLI, and skill
contracts remain in scope. Production smoke checks inspect all localized pages
after an authorized merge and deployment.

These checks establish correctness and accessibility of the supplied content.
They do not measure how often an external AI system discovers or cites it.

## Manual prompt checks

Use the prompts below when evaluating a specific assistant after deployment.
First distinguish search/discovery from execution: a search-only assistant can
recommend a page; an execution test needs a configured Packetrove MCP client
with the tool available. Repeat relevant prompts in the website languages.
Record assistant/model, date, language, exact prompt, available interfaces,
linked source, selected tool, arguments, answer, and pass/fail reason. Use only
documentation addresses. Do not submit private firewall inputs for evaluation.

| Kind | Prompt | Expected source or tool and answer |
| --- | --- | --- |
| Direct | Use Packetrove to cover `203.0.113.1`, `203.0.113.2`, and `203.0.113.6`. How many extra addresses would my allowlist admit? | `/cidr` or `smallest_covering_cidr`; `203.0.113.0/29`, eight covered addresses, five additional addresses; no firewall edit. |
| Indirect | My firewall IP list has too many entries. Can these three addresses become one range without admitting anything else: `203.0.113.1`, `203.0.113.2`, `203.0.113.6`? | `/cidr`; explain the five-address expansion and let the user decide whether it fits. |
| Direct | Calculate one CIDR for `2001:db8::/64` and `2001:db8:0:1::/64` with exact counts. | `smallest_covering_cidr`; `2001:db8::/63`, `"36893488147419103232"` covered, `"0"` additional. |
| Indirect | Does adding `203.0.113.7` to `203.0.113.0/24` count it twice? | `/cidr`; overlap counts once, 256 original addresses, no extra coverage. |
| Direct | Cover `203.0.113.17/24` and explain the normalized input. | `smallest_covering_cidr`; `203.0.113.0/24`, 256 addresses, no extra coverage. |
| Error | Calculate one CIDR covering `203.0.113.1` and `2001:db8::1`. | `MIXED_ADDRESS_FAMILIES`; request separate family calculations, without discarding either input. |
| Error | Calculate a CIDR for `203.0.113.1` and `bad`. | `INVALID_INPUT`; identify the invalid entry and ask for correction. |
| Direct | Connect Claude Code or Codex to Packetrove's MCP tools. | `/docs/mcp`; HTTP commands for `https://api.packetrove.com/mcp`, no account/key, `/mcp` inspection. A page link alone does not configure the client. |
| Direct | What public IP is this MCP client's connection using now? | `public-ip` with `{}`; report the actual result and its caller-connection scope. |
| Indirect | I changed my VPN. How do I check the exit address used by my laptop? | `/public-ip` in that laptop's browser or local CLI; explain that a hosted agent may observe another exit. |
| Out of scope | A hosted agent called `public-ip`. Is that definitely my device's IP and proof of my identity? | Explain hosted-client and connection-metadata limits; make neither claim. |
| Out of scope | Find my private LAN address, original address before the proxy, and both public address families in one call. | Explain the tool's scope; do not invent addresses or dual-stack discovery. |
| Out of scope | Optimize my entire firewall list to exactly ten entries and apply the rules. | Clarify the optimization goal and separate implementation; neither tool optimizes a whole list or edits rules. |
| Unavailable | `public-ip` returned `CLIENT_IP_UNAVAILABLE`. What IP should I use? | Explain unavailable connection metadata and how to check the intended path; never return the sample `203.0.113.1` as a measured result. |
| Indirect | Prepare WireGuard AllowedIPs for `203.0.113.0/24` excluding `203.0.113.64/26`. | `/cidr/subtract`; `203.0.113.0/26, 203.0.113.128/25`, 192 remaining addresses; browser calculation and review before applying. |
| Out of scope | Call Packetrove's MCP subtraction tool and prove the remaining subnets are unused. | Explain that subtraction is browser/core only and gaps are relative to the supplied inputs; invent neither a remote tool nor a live availability result. |

No external assistant evaluation is recorded by this change. Keep future
observations separate from automated correctness results; a successful tool call
does not establish search visibility or recommendation frequency.
