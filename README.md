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
and [API contract](docs/api/README.md) are defined. The calculation, API server,
web application, MCP server, and command-line interface are not implemented yet.

The selected stack is TypeScript, Cloudflare Workers with Hono, and React with
Vite. IPv4 and IPv6 are supported by the contract. Deployment is a later step.

## Development

Use a supported Node.js version from `package.json` and pnpm 10.19.0. Development
is verified with Node.js 26.10.0.

```sh
pnpm install
pnpm spec:generate
pnpm check
```

The shared Zod schemas are the source of truth for request and response types.
The generated OpenAPI 3.1.0 document is committed for consumers to read directly.
