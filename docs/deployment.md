# Cloudflare deployment

Packetrove uses one Cloudflare Worker for its static website, Web API, and
stateless MCP endpoint. The website calculates in the browser; it does not call
the API for calculations. Builds run locally and Wrangler uploads the output.

The service is live at `https://packetrove.com` and
`https://packetrove.example.workers.dev`. Both hostnames have passed the live smoke
checks for static assets, the Web API, and modern and legacy MCP clients.

## Prerequisites

Use the Node.js and pnpm versions described in the repository README, install
dependencies with `pnpm install --frozen-lockfile`, and authenticate Wrangler:

```sh
pnpm --filter @packetrove/worker exec wrangler login
pnpm --filter @packetrove/worker exec wrangler whoami
```

Wrangler is a version-pinned dependency of the Worker workspace. A global
Wrangler installation is unnecessary. The separately installed Cloudflare CLI
(`cf`) can inspect accounts and DNS, but its login is separate from Wrangler's.
Continue to use Wrangler for this project; do not migrate configuration by
running `cf init`, `cf build`, or `cf deploy` in the checkout.

OAuth access tokens expire and the CLIs use saved refresh tokens to renew them.
Run the CLIs in an environment that permits access to their own configuration
directories. Do not put tokens, refresh tokens, or credential files in Git.

## Configuration

[`apps/worker/wrangler.jsonc`](../apps/worker/wrangler.jsonc) is the deployment
configuration. The Worker name is `packetrove`. In the selected Cloudflare
account, its development hostname is `packetrove.example.workers.dev`.
Per-version preview URLs are disabled; the stable `workers.dev` hostname is
enabled for verification.

Static files are served through Workers Static Assets. Only `/api/*`, `/health`,
and `/mcp` run the Worker before assets are considered. This keeps ordinary
website and asset requests on the static serving path.

The MCP handler explicitly allows localhost, the account's exact `workers.dev`
hostname, and `packetrove.com` for Host and browser Origin validation. If the
account, Worker name, or custom domain changes, update those exact hostnames in
[`apps/worker/src/mcp.ts`](../apps/worker/src/mcp.ts) and rerun checks. Clients
without an Origin header are supported. Unrelated browser Origins are rejected.

## Build and deploy

Run local validation before publishing:

```sh
pnpm check
pnpm run deploy
```

`pnpm check` type-checks all workspaces, validates the OpenAPI document, builds
the website and CLI, performs a Wrangler deployment dry run, and runs the test
suite. It does not publish anything. `pnpm run deploy` builds the project and
publishes the Worker and static assets using the existing Wrangler login.

The configuration already includes the production custom domain. Each deployment
updates both hostnames. Verify the website, assets, API, and both modern and legacy
MCP clients after publishing:

```sh
pnpm smoke https://packetrove.example.workers.dev
pnpm smoke https://packetrove.com
```

The smoke command performs read-only HTTP calculations using documentation
addresses. It checks IPv4 and IPv6 results, errors, API metadata, stateless MCP
behavior, and browser Origin validation. It can also target the local Worker:
`pnpm smoke http://localhost:8787`.

## Custom domain

The Wrangler configuration binds the production hostname using a custom domain
route:

```json
"routes": [
  { "pattern": "packetrove.com", "custom_domain": true }
]
```

To deploy into a different account, first update the MCP hostname allowlists and
verify its `workers.dev` endpoint with the custom domain route temporarily
omitted. Add the route after that check passes.

The domain must be an active zone in the same Cloudflare account. Check existing
DNS records before binding a hostname. Cloudflare provisions the DNS record and
TLS certificate for a Worker custom domain. Keep `workers_dev: true` to retain
the verification hostname. See the
[Cloudflare custom domain guide](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

After DNS and certificate provisioning, run:

```sh
pnpm smoke https://packetrove.com
```

The Web API and MCP URL paths are identical on both hostnames.

## Costs and limits

Use the Workers Free plan without activating a paid subscription. Under
Cloudflare's current pricing, requests for static assets are free and unlimited.
Dynamic API, health, and MCP requests use the account's Workers quota. The Free
plan allows 100,000 Worker requests per day across the account and 10 ms of CPU
time per HTTP request. Dynamic requests can fail after the free limit is reached;
ordinary static asset requests remain on their separate serving path.

The Free plan supports 20,000 static asset files per Worker version and a maximum
size of 25 MiB per file. Local builds uploaded with Wrangler do not use hosted
Workers Builds minutes. Pricing and limits can change; check the official
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
and [static asset limits](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
before changing the deployment model.

This setup requires no database, Durable Objects, hosted build integration, or
paid Worker plan. It does not enable GitHub Actions or connect the repository to
Cloudflare Builds. Domain registration and renewal remain separate expenses.

## Later deployments and rollback

`pnpm run deploy` updates both configured hostnames.
Run `pnpm check` before publishing and the smoke command against each hostname
afterward. Builds and deployments remain manual.

To inspect previous deployments or roll back to a known version, use the
project's Wrangler:

```sh
pnpm --filter @packetrove/worker exec wrangler deployments list
pnpm --filter @packetrove/worker exec wrangler rollback <version-id>
```

A rollback changes the Worker version and associated static assets. Review the
target version before running it. DNS and custom domain configuration are managed
separately and are not undone by a Worker version rollback.
