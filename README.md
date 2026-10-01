# Packetrove

**Network tools for humans and agents.**

Packetrove is a planned network tools and diagnostics platform for developers and
network administrators. It aims to help users inspect network information,
investigate connectivity problems, and understand diagnostic results, including
connectivity from mainland China.

The goal is to support interactive use through a website and programmatic access
for scripts, applications, and AI agents. Planned integration directions include
web APIs, a command-line interface (CLI), Model Context Protocol (MCP) servers,
reusable skills, and agent workflows.

## Status

The first tool is a smallest covering CIDR calculator for firewall IP allowlists
and blocklists. Its [user story](docs/user-stories/001-smallest-covering-cidr.md)
and [API contract](docs/api/README.md) are defined. The shared IPv4/IPv6 calculation
and Hono API are implemented and verified locally in the Workers runtime. The
React web calculator is also implemented and calculates entirely in the browser.
The stateless MCP server is implemented. The command-line interface and agent
skill are not implemented yet.

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
