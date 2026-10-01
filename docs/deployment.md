# Cloudflare deployment

Packetrove uses one Cloudflare Worker for its static website, Web API, and
stateless MCP endpoint. The website calculates in the browser; it does not call
the API for calculations. GitHub Actions builds and publishes updates to `main`
after validation succeeds, then runs production smoke checks. Local publishing
with Wrangler is also available.

The service is live at `https://packetrove.com` and has passed the live smoke
checks for static assets, the Web API, and modern and legacy MCP clients.

## Automatic deployment

The [GitHub Actions workflow](../.github/workflows/ci.yml) validates updates to
`main`, publishes the current successful revision, and checks
`https://packetrove.com`. A manual workflow run on `main` uses the same process.
Configure the dedicated `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
repository secrets as described in the
[continuous integration and deployment guide](continuous-integration.md).

Deployments are serialized. New pushes can supersede pending runs but do not
interrupt a deployment already in progress. Worker versions are tagged with the
Git commit SHA to connect Cloudflare deployments to their source and GitHub
Actions run. The workflow does not create a `workers.dev` or preview URL.

## Local publishing prerequisites

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
configuration. The Worker name is `packetrove` and its public hostname is
`packetrove.com`. The `workers.dev` route and per-version preview URLs are both
disabled with `workers_dev: false` and `preview_urls: false`. Keep these settings
in the configuration so future deployments do not restore those public URLs.
See the [Cloudflare workers.dev guide](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).

Static files are served through Workers Static Assets. Only `/api/*`, `/health`,
and `/mcp` run the Worker before assets are considered. This keeps ordinary
website and asset requests on the static serving path.

The MCP handler explicitly allows localhost and `packetrove.com` for Host and
browser Origin validation. If the custom domain changes, update the exact
hostnames in
[`apps/worker/src/mcp.ts`](../apps/worker/src/mcp.ts) and rerun checks. Clients
without an Origin header are supported. Unrelated browser Origins are rejected.

## Manual build and deploy

Run local validation before publishing:

```sh
pnpm check
pnpm run deploy
```

`pnpm check` type-checks all workspaces, validates the OpenAPI document, builds
the website and CLI, performs a Wrangler deployment dry run, and runs the test
suite. It does not publish anything. `pnpm run deploy` builds the project and
publishes the Worker and static assets using the existing Wrangler login.

GitHub Actions automatically embeds the deployed commit in the website's GitHub
footer link. For a manual deployment from a clean committed checkout, provide
the same public build metadata:

```sh
VITE_GITHUB_REPOSITORY=euyuil/packetrove VITE_GIT_COMMIT="$(git rev-parse HEAD)" pnpm run deploy
VITE_GIT_COMMIT="$(git rev-parse HEAD)" pnpm smoke https://packetrove.com
```

Use your own GitHub repository name when deploying a fork. Without
`VITE_GIT_COMMIT`, the footer links to the repository homepage and the smoke
command skips the build-commit check. Uncommitted changes are not represented
by a commit link; validate and commit changes before using it for a deployment.

The configuration includes the production custom domain. Each deployment updates
the service at `packetrove.com`. Verify the website, assets, API, and both modern
and legacy MCP clients after publishing:

```sh
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

The domain must be an active zone in the same Cloudflare account. Check existing
DNS records before binding a hostname. Cloudflare provisions the DNS record and
TLS certificate for a Worker custom domain. See the
[Cloudflare custom domain guide](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

After DNS and certificate provisioning, run:

```sh
pnpm smoke https://packetrove.com
```

## Costs and limits

Use the Workers Free plan without activating a paid subscription. Under
Cloudflare's current pricing, requests for static assets are free and unlimited.
Dynamic API, health, and MCP requests use the account's Workers quota. The Free
plan allows 100,000 Worker requests per day across the account and 10 ms of CPU
time per HTTP request. Dynamic requests can fail after the free limit is reached;
ordinary static asset requests remain on their separate serving path.

The Free plan supports 20,000 static asset files per Worker version and a maximum
size of 25 MiB per file. Builds on local machines or GitHub Actions uploaded
with Wrangler do not use hosted Workers Builds minutes. Pricing and limits can
change; check the official
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
and [static asset limits](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
before changing the deployment model.

This deployment requires no database, Durable Objects, Cloudflare Builds
integration, or paid Worker plan. GitHub Actions performs validation, publishing,
and live checks as described in the [CI guide](continuous-integration.md).
Private-repository Actions usage draws on the repository owner's GitHub
allowance. Domain registration and renewal remain separate expenses.

## Later deployments and rollback

Successful current updates to `main` publish automatically. For manual local
publishing, `pnpm run deploy` updates the configured custom domain; run
`pnpm check` beforehand and `pnpm smoke https://packetrove.com` afterward.
Coordinate manual deployments and rollbacks with any active GitHub Actions run,
because the workflow's concurrency group does not serialize local commands.

If production smoke checks fail after automatic publishing, the workflow is
marked as failed and the deployed version remains live until a subsequent
deployment or rollback. Review the failed checks and target version before
rolling back. A failed build or test does not publish a new version.

To inspect previous deployments or roll back to a known version, use the
project's Wrangler:

```sh
pnpm --filter @packetrove/worker exec wrangler deployments list
pnpm --filter @packetrove/worker exec wrangler rollback <version-id>
```

A rollback changes the Worker version and associated static assets. Review the
target version before running it. DNS and custom domain configuration are managed
separately and are not undone by a Worker version rollback.
