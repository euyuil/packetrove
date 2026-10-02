<p>
  <img src="apps/web/src/assets/packetrove-logo-160x160.png" width="96" height="96" alt="Packetrove logo" />
</p>

# Packetrove

**Network tools for humans and agents.**

Packetrove helps developers and network administrators simplify firewall IP
lists, check a connection's public IP, and use the same tools from a browser,
scripts, or an AI agent.

**[Explore Packetrove](https://packetrove.com) ·
[Try the CIDR calculator](https://packetrove.com/cidr) ·
[Check your public IP](https://packetrove.com/ip)**

## What you can do

### Simplify firewall IP lists

Running out of entries in an IP allowlist or blocklist? Paste your IPv4 or IPv6
addresses and CIDR ranges to find the smallest single CIDR that covers them all.
Packetrove shows the full address range and exactly how many additional
addresses it includes, so you can decide whether the wider coverage fits your
firewall rules.

| Your inputs | Smallest covering CIDR | Coverage |
| --- | --- | --- |
| `203.0.113.1`, `203.0.113.2`, `203.0.113.6` | `203.0.113.0/29` | 8 addresses: your 3 plus 5 additional addresses |
| `203.0.113.0/25`, `203.0.113.128/25` | `203.0.113.0/24` | 256 addresses, with no additional coverage |

Use up to 1,000 entries of one address family per calculation. Overlapping
ranges and duplicate addresses count once. A covering CIDR can allow or block
addresses outside your original list; review that expansion before applying it.

### Check your connection's public IP

Open [My Public IP](https://packetrove.com/ip) to see and copy the IPv4 or IPv6
address used by your current connection. Refresh after changing networks, VPNs,
or proxy settings.

With a VPN or proxy, the result is its exit address. Each check observes one
address family; it does not separately discover both IPv4 and IPv6 addresses.

## Why Packetrove?

- **Keep CIDR inputs local.** The web calculator runs entirely in your browser
  without sending your address list to the API. The CLI calculates offline after
  it is built.
- **See what changes.** Results include the canonical CIDR, address range, and
  exact counts, including large IPv6 ranges and any additional coverage.
- **Fit your workflow.** Use the website for a quick check, JSON results for
  scripts, or Model Context Protocol (MCP) tools for AI agents.
- **Start without an account.** The hosted website, Web API, and MCP server
  require no login or API key.

Public IP checks make a network request. The application does not store or log
the returned address, and lookup results and errors are not cached.

## Use it your way

| Interface | Get started |
| --- | --- |
| Website | [Project overview](https://packetrove.com) · [CIDR calculator](https://packetrove.com/cidr) · [My Public IP](https://packetrove.com/ip) |
| Web API | [Interactive API documentation](https://packetrove.com/docs/api) · [API guide](docs/api/README.md) · [OpenAPI specification](https://api.packetrove.com/openapi.json) |
| Command-line interface (CLI) | [CLI guide](docs/integrations/cli.md), with offline CIDR calculations and JSON output |
| AI agents | [MCP connection guide](docs/integrations/mcp.md) · [CIDR covering skill setup](docs/integrations/skill.md) |

### Call the API

Calculate a covering CIDR with a single request:

```sh
curl https://api.packetrove.com/v1/cidr/cover \
  -H 'Content-Type: application/json' \
  -d '{"inputs":["203.0.113.1","203.0.113.2","203.0.113.6"]}'
```

The result includes `cidr: "203.0.113.0/29"` and
`additionalAddressCount: "5"`. Address counts are decimal strings to preserve
exact IPv6 values. Use `GET https://api.packetrove.com/v1/ip` to check the
connection making the request.

### Connect an AI agent

Add `https://api.packetrove.com/mcp` to a client that supports Streamable HTTP.
The server provides `smallest_covering_cidr` and `get_public_ip` without
authentication. The repository also includes a
[CIDR covering skill](skills/packetrove-cidr-cover/SKILL.md) for calculating ranges
and explaining additional allowlist or blocklist coverage.

A hosted MCP client checks its own connection, which may differ from your
computer's. Use the website or run the CLI on your machine to inspect that
network path.

### Run the CLI

With the [development toolchain](#development) installed, build from this
repository:

```sh
pnpm install
pnpm build
node packages/cli/dist/cli.js cidr cover 203.0.113.1 203.0.113.2 203.0.113.6 --json
node packages/cli/dist/cli.js ip
```

CIDR calculations run locally; `ip` calls the public API from the machine
running the command. The CLI is supplied in this repository and has not been
published to npm. See the [CLI guide](docs/integrations/cli.md) for file input,
JSON errors, and packaging.

## Development

The web interface uses React, Vite, and Mantine. Prefer Mantine components and
layout props, with shared visual settings in `apps/web/src/theme.ts`. Custom CSS
handles the page background and wrapping long network values.

Use Node.js 24.21.0 LTS, pinned in `.node-version`, and pnpm 12.8.1, pinned in
`package.json`.

```sh
pnpm install
pnpm spec:generate
pnpm check
pnpm dev:api
```

`pnpm dev:api` serves the API and MCP at `http://localhost:8787`. In another
terminal, run `pnpm dev:web` and open `http://localhost:5173` for the website with
hot reload. Its IP lookup calls the local API without cookies. CIDR calculation
works with the web development server alone. Production builds use
`https://api.packetrove.com`; set `VITE_API_ORIGIN` when building a self-hosted copy
with a different API origin.

`pnpm install` automatically enables repository-local Git hooks. Install
Gitleaks once (`brew install gitleaks` on macOS) for credential scanning and
Conventional Commit checks. Missing Gitleaks allows local development but blocks
commits. See the [local Git checks guide](docs/git-checks.md) for setup and
troubleshooting.

Local development and tests need no Cloudflare account or production credentials.
`pnpm build` validates the API specification and performs deployment dry runs
for both the API and website Workers.
The API publishes the generated specification as a static asset at
`/openapi.json`; development, build, and deployment commands prepare this asset
automatically. The website's `/docs/api` page loads Scalar only when opened and
sends test requests directly to the configured API origin without cookies.
Scalar's AI features, telemetry, proxy, and external fonts are disabled.
Local public IP lookup depends on Cloudflare connection metadata; without it,
the API returns `CLIENT_IP_UNAVAILABLE`.

Dependency build scripts are limited to the reviewed entries in
`pnpm-workspace.yaml`. Scalar's Vue integration uses `vue-demi`; its approved
installation script selects the adapter for the installed Vue version.

## Self-hosting

The website uses `packetrove.com`; the Web API and MCP use
`api.packetrove.com` on a separate Worker. The former root-domain API and MCP
addresses no longer serve interfaces after the split; update configured clients
to the new URLs. GET requests return 404 and POST requests return 405.
The services run on Cloudflare Workers. Follow
the [deployment guide](docs/deployment.md) to deploy your own copy, configure
credentials, and verify it.

GitHub Actions validates pull requests with `pnpm check`; updates to `main`
deploy after validation and run production checks. See the
[continuous integration guide](docs/continuous-integration.md) for details.

## Contributing

See the [contribution guide](CONTRIBUTING.md) for discussing changes, local
development, checks, and pull requests.

## License

Packetrove is licensed under the [MIT License](LICENSE).
Third-party components retain their own licenses and copyright notices. The
website includes [third-party notices](apps/web/public/third-party-notices.txt),
and the bundled CLI includes [third-party notices](packages/cli/THIRD_PARTY_NOTICES).
