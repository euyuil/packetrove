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

- `/cidr-cover` answers questions about reducing selected firewall entries, additional
  coverage, overlaps, canonical inputs, exact counts, and local calculation.
  Its MCP section identifies `cidr-cover`, the server, arguments,
  results, and limits.
- `/public-ip` answers questions about request connection addresses, VPN/proxy exits,
  one-family results, hosted clients, and application storage. Its MCP section
  identifies `public-ip`, empty arguments, and a documentation-only result.
- `/cidr-subtract` answers questions about WireGuard exceptions, remaining
  allocation gaps, exclusion overlap, and exact set subtraction. It states that
  subtraction runs locally in the browser and is also available through Web API
  and MCP. It links to the MCP guide and renders the catalog-derived
  `cidr-subtract` example using the same template as other tools.
- `/docs/mcp` centralizes Claude Code and Codex remote HTTP configuration,
  `/mcp` inspection, `tools/list` discovery, all catalog tool examples, result decoding,
  errors, and links back to the tools. Reading it makes no tool calls.
- The shared footer groups the same-language MCP guide and API documentation
  with the existing English CLI guide. Desktop and mobile primary navigation
  contain Home and browser tools. The MCP guide links to the API reference in
  that language and to the project source.
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
- Each successful MCP response retains the structured result and its first JSON
  text block, then appends one standard `resource_link` for that tool. The shared
  catalog derives its canonical HTTPS destination and names; the default is the
  English page, independent of request language. CIDR covering links to its extra
  coverage explanation, subtraction and range conversion to their exact browser
  calculators and limits, and public IP to a fresh browser-connection check.
  Opening a page does not restore the MCP inputs or result. Links contain no
  inputs, results, query strings, fragments, or tracking data. Their generation
  makes no outbound requests. Errors contain no optional page link.

The first delivery did not include registry submission, analytics, paid model
evaluation, special AI files, an external citation campaign, or additional
structured markup.

## MCP Registry preparation

The remote-only `server.json` describes the existing anonymous Streamable HTTP
service under `io.github.euyuil/packetrove`. Its title, description, website, and
icon come from shared server identity; its version equals the formal product
version. The protocol server name remains `Packetrove`. The manifest contains
no packages, user-supplied headers, or authentication configuration.

Offline checks reject unsupported fields and differences from the generated
manifest. Release preparation regenerates all manifest metadata with the next
product version, including metadata corrections. The maintained MCP guide links
to the [manual publication procedure](../cli-publishing.md#publish-to-the-official-mcp-registry).

Preparation and merging do not establish that an entry is published. First
publication requires a formal release containing these changes, successful
production verification, approved GitHub namespace authentication, publication,
and exact-name/version plus latest-version readback. Keep the issue open until
that readback is recorded. Registry discovery does not guarantee inclusion in a
particular client's directory, configuration, recommendations, or citations.

## Tool selection boundaries

`cidr-cover` computes one smallest single CIDR for 1 to 1,000
inputs of one address family. It covers complete input ranges, normalizes host
bits, counts overlaps once, and reports additional addresses with exact decimal
strings. Review expansion before using an allowlist or blocklist result. It
does not optimize a whole list to a target entry count or apply firewall rules.
The browser and built CLI calculate locally; remote API and MCP calls submit
inputs to the service.

Exact CIDR subtraction is a separate operation available through the website,
Web API, and MCP. It subtracts the
exclusion union from the included union without introducing addresses, returns
an exact CIDR list, and does not establish live network availability or configure
WireGuard. Use `/cidr-subtract` for browser-local calculation,
`POST /v1/cidr-subtract` for API access, or MCP `cidr-subtract`. The CLI does
not currently expose subtraction. Remote calls submit inputs to the server.

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
MCP server. Existing IP isolation, errors, cache behavior, API, and CLI
contracts remain in scope. Production smoke checks inspect all localized pages
after an authorized merge and deployment.

These checks establish correctness and accessibility of the supplied content.
They do not measure how often an external AI system discovers or cites it.

## Result-link compatibility observations

The maintained [MCP guide](../integrations/mcp.md) shows the exact link content
beside each documentation-address result and explains client-controlled
presentation. The protocol permits optional
[resource links in tool results](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#resource-links).
A client can display a link, use it as context, ignore it, or leave it unopened;
Packetrove does not require attribution or promise automatic citations.

The 2026-10-03 local verification uses the pinned server
`@modelcontextprotocol/server@2.0.0`, with the following observations. SDK
acceptance and text-only decoding establish compatibility; they do not establish
how a target application's interface presents the link.

| Client | Observed response handling | Link presentation |
| --- | --- | --- |
| `@modelcontextprotocol/client@2.0.0` | All catalog tools retain valid structured results and exact JSON text; optional resource links survive tool calls. | Returned to the caller; no application interface evaluated. |
| `@modelcontextprotocol/sdk@1.30.0` | Legacy initialization, discovery, and all catalog tool calls accept the additive content. A text-only consumer can ignore the link and decode the unchanged complete answer. | Returned to the caller; no application interface evaluated. |
| Codex CLI `0.160.0` | Actual calls through experimental app-server `mcpServer/tool/call` retain the structured result, JSON text, and `resource_link` for all four tools. Calculation calls use documentation-address inputs; the public-IP call uses a documentation-only header injected into the local test endpoint. | Present in raw app-server responses. TUI and desktop rendering unverified; do not assume displayed or ignored. |
| Claude Code `2.1.288` | The npm-cached CLI reports `Connected` with `claude mcp get` using a fresh temporary configuration and the local feature endpoint. A configured tool-result call was not evaluated. | Unverified; the isolated interactive client requires account login. No login or model request performed. |

The Codex check uses an ephemeral context, command-line MCP overrides, and
temporary state and log directories; it does not modify persisted client
configuration or make model requests. The injected `203.0.113.1` public-IP test
is a compatibility check of a documentation-only local request context, not an
observation of a real user's network connection.

After deployment, record the target client and exact version, date, tool,
documentation-only input, retained answer, and whether the link was displayed,
ignored, or available only in raw content. Opening `public-ip` observes a new
browser connection rather than replaying the MCP caller's returned address.

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
| Direct | Use Packetrove to cover `203.0.113.1`, `203.0.113.2`, and `203.0.113.6`. How many extra addresses would my allowlist admit? | `/cidr-cover` or `cidr-cover`; `203.0.113.0/29`, eight covered addresses, five additional addresses; no firewall edit. |
| Indirect | My firewall IP list has too many entries. Can these three addresses become one range without admitting anything else: `203.0.113.1`, `203.0.113.2`, `203.0.113.6`? | `/cidr-cover`; explain the five-address expansion and let the user decide whether it fits. |
| Direct | Calculate one CIDR for `2001:db8::/64` and `2001:db8:0:1::/64` with exact counts. | `cidr-cover`; `2001:db8::/63`, `"36893488147419103232"` covered, `"0"` additional. |
| Indirect | Does adding `203.0.113.7` to `203.0.113.0/24` count it twice? | `/cidr-cover`; overlap counts once, 256 original addresses, no extra coverage. |
| Direct | Cover `203.0.113.17/24` and explain the normalized input. | `cidr-cover`; `203.0.113.0/24`, 256 addresses, no extra coverage. |
| Error | Calculate one CIDR covering `203.0.113.1` and `2001:db8::1`. | `MIXED_ADDRESS_FAMILIES`; request separate family calculations, without discarding either input. |
| Error | Calculate a CIDR for `203.0.113.1` and `bad`. | `INVALID_INPUT`; identify the invalid entry and ask for correction. |
| Direct | Connect Claude Code or Codex to Packetrove's MCP tools. | `/docs/mcp`; HTTP commands for `https://api.packetrove.com/mcp`, no account/key, `/mcp` inspection. A page link alone does not configure the client. |
| Direct | What public IP is this MCP client's connection using now? | `public-ip` with `{}`; report the actual result and its caller-connection scope. |
| Indirect | I changed my VPN. How do I check the exit address used by my laptop? | `/public-ip` in that laptop's browser or local CLI; explain that a hosted agent may observe another exit. |
| Out of scope | A hosted agent called `public-ip`. Is that definitely my device's IP and proof of my identity? | Explain hosted-client and connection-metadata limits; make neither claim. |
| Out of scope | Find my private LAN address, original address before the proxy, and both public address families in one call. | Explain the tool's scope; do not invent addresses or dual-stack discovery. |
| Out of scope | Optimize my entire firewall list to exactly ten entries and apply the rules. | Clarify the optimization goal and separate implementation; neither tool optimizes a whole list or edits rules. |
| Unavailable | `public-ip` returned `CLIENT_IP_UNAVAILABLE`. What IP should I use? | Explain unavailable connection metadata and how to check the intended path; never return the sample `203.0.113.1` as a measured result. |
| Indirect | Prepare WireGuard AllowedIPs for `203.0.113.0/24` excluding `203.0.113.64/26`. | `/cidr-subtract`; `203.0.113.0/26, 203.0.113.128/25`, 192 remaining addresses; browser calculation and review before applying. |
| Out of scope | Call Packetrove's MCP subtraction tool and prove the remaining subnets are unused. | Use `cidr-subtract` for the exact remainder and explain that gaps are relative to supplied inputs; do not claim live availability. |

No external assistant evaluation is recorded by this change. Keep future
observations separate from automated correctness results; a successful tool call
does not establish search visibility or recommendation frequency.
