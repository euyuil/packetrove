# Packetrove

**Network tools for humans and agents.**

Packetrove is a planned network tools and diagnostics platform for developers and
network administrators. It aims to help users inspect network information,
investigate connectivity problems, and understand diagnostic results, including
connectivity from mainland China.

The first calculator supports interactive use through a website and programmatic
access through a web API, command-line interface (CLI), Model Context Protocol
(MCP) server, and reusable agent skill. Additional diagnostic tools and agent
workflows are planned.

## Status

The first tool is a smallest covering CIDR calculator for firewall IP allowlists
and blocklists. Its [user story](docs/user-stories/001-smallest-covering-cidr.md)
and [API contract](docs/api/README.md) are defined. The shared IPv4/IPv6 calculation
and Hono API are implemented and verified locally in the Workers runtime. The
React web calculator is also implemented and calculates entirely in the browser.
The stateless MCP server, offline command-line interface, and reusable agent
skill are implemented as well.

The selected stack is TypeScript, Cloudflare Workers with Hono, and React with
Vite. IPv4 and IPv6 are supported by the contract. Deployment is a later step.

## Development

Use a supported Node.js version from `package.json` and pnpm 10.19.0. Development
is verified with Node.js 26.10.0.

```sh
pnpm install
pnpm spec:generate
pnpm check
pnpm dev:api
```

The shared Zod schemas are the source of truth for request and response types.
The generated OpenAPI 3.1.0 document is committed for consumers to read directly.

The local API runs at `http://localhost:8787`. For example:

```sh
curl http://localhost:8787/api/v1/cidr/cover \
  -H 'Content-Type: application/json' \
  -d '{"inputs":["203.0.113.1","203.0.113.2","203.0.113.6"]}'
```

`pnpm build` validates the specification and performs a Wrangler deployment dry
run. It does not deploy a live service. No Cloudflare account is needed for local
development and tests.

## Web application

`pnpm dev:api` builds the web app and serves both the built website and API at
`http://localhost:8787`. For React development with hot reload, run
`pnpm dev:web` and open `http://localhost:5173`. The Vite development server
proxies the API specification link to the local Worker; calculation itself
never calls the API and works with the Vite server alone.

The web app accepts one address or CIDR per line, displays normalized inputs
and exact address counts, and clears stale results when inputs change. All code
and styles are bundled locally, without fonts or scripts from external CDNs.

## MCP server

The same local Worker serves Streamable HTTP at `http://localhost:8787/mcp`.
It exposes `smallest_covering_cidr` with shared input and output schemas, exact
address counts, and read-only tool annotations. See the
[MCP connection guide](docs/integrations/mcp.md) for client setup and examples.

## CLI and agent skill

After `pnpm build`, run the CLI locally:

```sh
pnpm cli cidr cover 203.0.113.1 203.0.113.2 203.0.113.6
node packages/cli/dist/cli.js cidr cover --stdin --json < addresses.txt
```

The CLI bundles its runtime dependencies and calculates offline. JSON success
goes to stdout, errors to stderr, with exit status `0` or `1`. See the
[CLI guide](docs/integrations/cli.md) for piping, packaging, and exact result
semantics.

The [CIDR covering skill](skills/packetrove-cidr-cover/SKILL.md) helps agents use
an available CLI or MCP connection and explain additional address coverage.
See the [skill setup guide](docs/integrations/skill.md). The skill is supplied
in this repository; no global installation or npm publication is performed.
