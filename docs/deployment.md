# Cloudflare deployment

Packetrove uses two Cloudflare Workers: `packetrove` serves the static website at
`https://packetrove.com`, and `packetrove-api` serves the Web API and stateless MCP
endpoint at `https://api.packetrove.com`. The website calculates in the browser;
it does not call the API for calculations. GitHub Actions builds and publishes updates to `main`
after validation succeeds, then runs production smoke checks. Local publishing
with Wrangler is also available.

The website's `/docs/api` page provides a Scalar API reference. The API serves
`/openapi.json` through Static Assets; test calls to dynamic endpoints execute
the API Worker. These changes become live after this revision is deployed.
Workers Cache is not required or enabled by the repository.

This revision migrates the API and MCP to their separate origin. New production
URLs become available after deployment and domain provisioning; local validation
alone does not establish that they are live. Existing clients must update their
URLs: the website no longer serves `/api/v1/*`, `/api/openapi.json`, `/health`, or
`/mcp`, and does not proxy or redirect them.

## Automatic deployment

The [GitHub Actions workflow](../.github/workflows/ci.yml) validates updates to
`main`, publishes the current successful revision, and checks
both `https://packetrove.com` and `https://api.packetrove.com`. A manual workflow
run on `main` uses the same process. The API deploys before the website so the
new website does not point to an interface that has not been published. These
are separate deployments: a website failure can leave only the API updated.
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

The deployment configurations are:

| Configuration | Worker | Hostname | Content |
| --- | --- | --- | --- |
| [`wrangler.jsonc`](../apps/worker/wrangler.jsonc) | `packetrove-api` | `api.packetrove.com` | Static `/openapi.json`; dynamic `/v1/*`, `/health`, and `/mcp` |
| [`wrangler.website.jsonc`](../apps/worker/wrangler.website.jsonc) | `packetrove` | `packetrove.com` | Static website and assets |

Both configurations disable the `workers.dev` route and per-version preview URLs
with `workers_dev: false` and `preview_urls: false`. Keep those settings so future
deployments do not restore alternative public URLs. See the
[Cloudflare workers.dev guide](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).

The website keeps Cloudflare's static asset serving path. Its fallback handler
only fetches assets. The API Worker publishes a separate static directory
containing only the generated `openapi.json` and its `_headers` configuration.
Asset-first routing serves the specification without invoking the Worker
script; `_headers` allows anonymous cross-origin reads. Default ETags and
browser revalidation keep the document current across deployments. The asset
binding provides a fallback for direct Worker calls, while ordinary requests
use the asset-first path. Unknown paths still invoke the Worker and return
structured JSON 404 errors, including browser navigation. Website scripts are
not published to the API origin. Keep Workers Cache disabled and do not enable
Worker-first routing for `/openapi.json` when free static-asset requests are
desired.

Vite builds `index.html`, `cidr.html`, `public-ip.html`, `docs/api.html`, and `404.html` with shared
JavaScript and styles. Cloudflare serves the project homepage at `/`, the CIDR
calculator at `/cidr`, My Public IP at `/public-ip`, and API documentation at
`/docs/api` directly, and uses `404-page`
handling for unknown paths. `/cidr/`, `/public-ip/`, and `/docs/api/` redirect to their canonical
paths without the trailing slash. API routes continue to return structured
JSON errors, including for browser navigation.
Each supported locale has the same pages. The build generates `_redirects`
from the shared route and locale registries: legacy `/ip`, `/ip/`, and
`/ip.html` links return 301 redirects to `/public-ip` in the same locale,
preserving query strings. These aliases do not have static HTML entries and
are excluded from canonical metadata and the sitemap. See
[Cloudflare's redirect rules](https://developers.cloudflare.com/workers/static-assets/redirects/).
See [Cloudflare's static HTML routing guide](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/).

The MCP handler allows local hostnames and `api.packetrove.com` for Host
validation. Browser Origin validation additionally allows `packetrove.com`. If a
custom domain changes, update the separate exact hostname allowlists in
[`apps/worker/src/mcp.ts`](../apps/worker/src/mcp.ts) and rerun checks. Clients
without an Origin header are supported. Unrelated browser Origins are rejected.

## Manual build and deploy

Run local validation before publishing:

```sh
pnpm check
pnpm run deploy
```

`pnpm check` type-checks all workspaces, validates the OpenAPI document, builds
the website and CLI, performs deployment dry runs for both Workers, and runs the
test suite. It does not publish anything. `pnpm run deploy` builds the project and
publishes the API Worker followed by the website Worker and static assets using
the existing Wrangler login.

GitHub Actions automatically embeds the deployed commit in the website's GitHub
footer link. For a manual deployment from a clean committed checkout, provide
the same public build metadata:

```sh
VITE_GITHUB_REPOSITORY=euyuil/packetrove VITE_GIT_COMMIT="$(git rev-parse HEAD)" pnpm run deploy
VITE_GIT_COMMIT="$(git rev-parse HEAD)" pnpm smoke https://packetrove.com https://api.packetrove.com
```

Use your own GitHub repository name when deploying a fork. Without
`VITE_GIT_COMMIT`, the footer links to the repository homepage and the smoke
command skips the build-commit check. Uncommitted changes are not represented
by a commit link; validate and commit changes before using it for a deployment.

The configurations include both production custom domains. Each deployment
updates those services. Verify the website, assets, API, and both modern
and legacy MCP clients after publishing:

```sh
pnpm smoke https://packetrove.com https://api.packetrove.com
```

The smoke command performs read-only HTTP calculations using documentation
addresses. It checks IPv4 and IPv6 results, errors, API metadata, stateless MCP
behavior, browser Origin validation, direct page navigation, and page and asset
404 responses. It verifies that the website does not expose API or MCP endpoints
and that the API does not serve website assets. Pass both origins explicitly.
Full smoke checks require trusted connection metadata for public IP results; use
`pnpm check` for local tests, which supply documentation addresses.

After a manual deployment, optionally wait for the expected webpage version
before running the full smoke check:

```sh
VITE_GIT_COMMIT="$(git rev-parse HEAD)" pnpm wait:deployment https://packetrove.com
VITE_GIT_COMMIT="$(git rev-parse HEAD)" pnpm smoke https://packetrove.com https://api.packetrove.com
```

The wait checks the homepage and its bundled JavaScript for that commit, with
a 90-second total budget and a five-second delay between unsuccessful checks.
It does not query IP, API, or MCP endpoints. Readiness failure exits with status
1; success still requires the subsequent full smoke check. This is a bounded
wait, not a guarantee of platform propagation time.

## Custom domain

Each Wrangler configuration binds its production hostname using a custom domain
route. The API configuration uses:

```json
"routes": [
  { "pattern": "api.packetrove.com", "custom_domain": true }
]
```

The domain must be an active zone in the same Cloudflare account. Check existing
DNS records before binding a hostname. Cloudflare provisions the DNS record and
TLS certificate for each Worker custom domain. Both hostnames use the same
Cloudflare zone, so the existing deployment token scopes cover this split. See the
[Cloudflare custom domain guide](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

After DNS and certificate provisioning, run:

```sh
pnpm smoke https://packetrove.com https://api.packetrove.com
```

## Browser state and self-hosting

The production website calls `https://api.packetrove.com/v1/public-ip` directly with
`credentials: 'omit'` and `cache: 'no-store'`. API CORS permits anonymous calls
without enabling browser credentials. CIDR calculations continue to run locally.
MCP has its own exact Host and browser Origin allowlists.

When adding website cookies, omit `Domain` to keep them host-only. Setting
`Domain=packetrove.com` would also send them to subdomains when requests include
credentials. Future login cookies should use the `__Host-` prefix with `Secure`,
`HttpOnly`, `Path=/`, and an appropriate `SameSite` value. HTTPS subdomains remain
same-site, so `SameSite` does not replace host-only scoping or request validation.
Browser local storage is separate per origin and is not sent with API requests.

For your own deployment, change the custom domains in both configuration files
and the separate MCP Host and Origin allowlists. Build the website with
`VITE_API_ORIGIN=https://api.example.com`, using your actual API origin. The CLI
can use `public-ip --api-origin https://api.example.com`. OpenAPI uses a relative server
URL so it resolves against the host serving the specification. Local Vite
serves the website separately and points IP requests to `http://localhost:8787`.

## Costs and limits

Use the Workers Free plan without activating a paid subscription. Under
Cloudflare's current pricing, requests for static assets are free and unlimited.
Dynamic API, health, and MCP requests use the same account's Workers quota.
The additional Worker does not enable a paid plan or new platform integration.
The Free plan allows 100,000 Worker requests per day across the account and 10 ms of CPU
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
publishing, `pnpm run deploy` updates both configured custom domains; run
`pnpm check` beforehand and `pnpm smoke https://packetrove.com https://api.packetrove.com` afterward.
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
pnpm --filter @packetrove/worker exec wrangler deployments list --config wrangler.website.jsonc
pnpm --filter @packetrove/worker exec wrangler rollback <api-version-id>
pnpm --filter @packetrove/worker exec wrangler rollback <website-version-id> --config wrangler.website.jsonc
```

Rollbacks apply to one Worker at a time. The website rollback also restores its
associated static assets. Review both versions and keep the website API origin
compatible with the restored API. For the first split, a pre-split website version
includes the original root-domain API and MCP. Restoring that version does not
remove the newly created API Worker; do not delete recovery resources without
explicit authorization. DNS and custom domain configuration are managed
separately and are not undone by a Worker version rollback.
