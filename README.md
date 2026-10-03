<p>
  <img src="apps/web/src/assets/packetrove-logo-160x160.png" width="96" height="96" alt="Packetrove logo" />
</p>

# Packetrove

**Network tools for humans and agents.**

Packetrove helps developers and network administrators simplify firewall IP
lists, subtract networks, convert IP ranges to CIDRs, and check a connection's
public IP. Use the website for a quick calculation, the API or CLI for scripts,
or connect AI agents through Model Context Protocol (MCP).

**[Website](https://packetrove.com) ·
[CIDR calculator](https://packetrove.com/cidr-cover) ·
[CIDR subtraction](https://packetrove.com/cidr-subtract) ·
[IP range to CIDRs](https://packetrove.com/range-to-cidrs) ·
[My Public IP](https://packetrove.com/public-ip)**

## What you can do

- **Cover an IP list with one CIDR.** Find the smallest IPv4 or IPv6 network
  covering your inputs, with its full address range and exact additional coverage.
- **Subtract CIDR lists exactly.** Remove excluded networks and copy the smallest
  CIDR list representing the remaining addresses, without adding addresses.
- **Convert an IP range exactly.** Enter inclusive start and end addresses and
  copy the minimal CIDR list covering that range, with an exact address count.
- **Check a connection's public IP.** See and copy the IPv4 or IPv6 address
  observed for the connection making the request.

The website supports ten languages. Hosted tools require no account or API key.
All four tools are available through the website, Web API, and MCP. The CLI
provides covering-CIDR calculations and public IP lookup.

Browse example results in the homepage gallery, then open a tool to enter your
own inputs. Gallery previews use documentation addresses and make no live lookups.

## Quick start

Open the [CIDR calculator](https://packetrove.com/cidr-cover), or call the API:

```sh
curl https://api.packetrove.com/v1/cidr-cover \
  -H 'Content-Type: application/json' \
  -d '{"inputs":["203.0.113.1","203.0.113.2","203.0.113.6"]}'
```

The result is `203.0.113.0/29`: eight addresses, including five beyond the three
inputs. Review this expansion before using it in an allowlist or blocklist.
API address counts are decimal strings to preserve exact IPv6 values.

## Use it your way

| Interface | Get started |
| --- | --- |
| Website | [Browse the tools](https://packetrove.com) |
| Web API | [Interactive reference](https://packetrove.com/docs/api) · [API contract](docs/api/README.md) |
| Command-line interface (CLI) | `npm install --global @packetrove/cli` · [CLI guide](docs/integrations/cli.md) |
| Model Context Protocol (MCP) | [Connection guide](https://packetrove.com/docs/mcp) · [Technical guide](docs/integrations/mcp.md) |
| OpenAI plugin package | [Source draft and status](docs/integrations/openai-plugin.md) · Not published |

The website's main navigation opens browser tools. Its footer groups the API,
MCP, and CLI guides; the CLI guide is in English.

Tools share flat public names across interfaces. For changes to existing calls
and commands, see the [name migration guide](docs/tool-catalog.md#migration-to-flat-names).

## Privacy and scope

- Website CIDR calculations run locally in your browser; CLI calculations run
  offline. API and remote MCP calculations send inputs to the server.
- Public IP checks make a network request and observe one address family per
  check. A VPN or proxy supplies its exit address; a hosted MCP client may
  observe a different connection from your computer's.
  Browser and CLI lookups have a ten-second deadline and a 64 KiB response limit.
- The application does not store or log returned IP addresses. Lookup results
  and errors are not cached.
- MCP execution counts use operational events with the tool name, outcome, and
  a controlled error code, excluding inputs and results. The
  [deployment guide](docs/deployment.md#mcp-tool-execution-counts) describes the
  free-tier limits and per-tool queries.
- The [Privacy Policy](https://packetrove.com/privacy) describes remote input
  processing, browser storage, operational error logs, hosting, retention, and
  user choices. Cloudflare's platform processing is separate from application
  storage and logging.

For input formats, limits, and detailed behavior, see the
[covering-CIDR](docs/user-stories/001-smallest-covering-cidr.md),
[CIDR subtraction](docs/user-stories/004-cidr-subtraction.md),
[IP range conversion](docs/user-stories/006-ip-range-to-cidrs.md), and
[public IP](docs/user-stories/002-current-public-ip.md) guides.

## Development

Use the Node.js version in [.node-version](.node-version) and the pnpm version
in [package.json](package.json). Local development needs no production credentials.

```sh
pnpm install
pnpm dev:web
```

Open `http://127.0.0.1:5173`. For the API and MCP, run `pnpm dev:api` in another
terminal; they listen at `http://localhost:8787`. Local public IP lookup requires
Cloudflare connection metadata and reports `CLIENT_IP_UNAVAILABLE` without it.
See [Contributing](CONTRIBUTING.md) for complete setup, checks, and Git hooks.

## Documentation and contributing

- [Contribute or report an issue](CONTRIBUTING.md)
- [Self-hosting](docs/deployment.md)
- [Continuous integration and deployment](docs/continuous-integration.md)
- [Product releases, CLI publishing, and MCP Registry publication](docs/cli-publishing.md) · [Changelog](CHANGELOG.md)

## License

Packetrove is licensed under the [MIT License](LICENSE). Bundled components
retain their own licenses; see the [website notices](apps/web/public/third-party-notices.txt)
and [CLI notices](packages/cli/THIRD_PARTY_NOTICES).
