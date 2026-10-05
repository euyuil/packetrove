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

Follow the [development setup](../CONTRIBUTING.md#getting-started), using the
Node.js version in [.node-version](../.node-version) and the pnpm version in
[package.json](../package.json). Install dependencies with
`pnpm install --frozen-lockfile`, and authenticate Wrangler:

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

Vite derives every canonical page and localized counterpart from the shared
page catalog and one `apps/web/index.html` template. Virtual HTML inputs retain
their existing static output paths, with page-specific language and metadata;
the build prerenders their React content. No copied HTML source entries are
needed when adding tools or locales. The independent `404.html` keeps its
static fallback content. All pages share JavaScript and styles.
Cloudflare serves the project homepage at `/`, the CIDR
covering calculator at `/cidr-cover`, CIDR subtraction at `/cidr-subtract`,
My Public IP at `/public-ip`, and API documentation at
`/docs/api` directly, and uses `404-page`
handling for unknown paths. `/cidr-cover/`, `/cidr-subtract/`, `/public-ip/`, and `/docs/api/` redirect to their canonical
paths without the trailing slash. API routes continue to return structured
JSON errors, including for browser navigation.
Each supported locale has the same pages. The build generates `_redirects`
from the shared tool catalog and locale registry: legacy `/cidr`,
`/cidr/subtract`, and `/ip` links, including their trailing-slash and `.html`
forms, return 301 redirects to `/cidr-cover`, `/cidr-subtract`, and `/public-ip`
in the same locale,
preserving query strings. These aliases do not have static HTML entries and
are excluded from canonical metadata and the sitemap. See
[Cloudflare's redirect rules](https://developers.cloudflare.com/workers/static-assets/redirects/).
See [Cloudflare's static HTML routing guide](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/).

The MCP handler derives its exact Host allowlist from `PUBLIC_API_ORIGIN` plus
local hostnames. Browser Origin validation also allows `PUBLIC_WEBSITE_ORIGIN`.
When changing custom domains, update both Worker origin variables and the website
build origins, then rerun checks. Clients
without an Origin header are supported. Unrelated browser Origins are rejected.

## Privacy policy and operational errors

The static `/privacy` page and every localized counterpart use the same page
registry, prerendering, metadata, and sitemap as the other website pages. The
footer and MCP guide link to the same-language policy. MCP tool descriptions
link to the canonical English policy for client and directory discovery.
Use `https://packetrove.com/privacy` as the plugin's privacy-policy URL only
after the revision is deployed and the public page is verified.

The same registry publishes `/support` and `/terms` in every locale. The shared
footer links to them, and the plugin source manifest references their canonical
English HTTPS URLs. Before uploading a package, verify the deployed revision's
support, terms, and privacy pages with the production smoke command. Maintainer
approval of the terms and correspondence policy precedes their publication
through the normal pull request workflow.

Unexpected HTTP failures emit only `request_failure` and the fixed
`INTERNAL_ERROR` code. The application logger does not receive exception
objects, request data, or results, and logging failure cannot replace the HTTP
error response. MCP execution events use the separate controlled fields below.

Application event fields are not a whitelist for Cloudflare's complete log
record. Review actual observability settings and full persisted events before
making platform-data claims. Workers Logs retention is currently three days on
Free and seven days on Paid; Cloudflare has announced seven days for Free from
December 1, 2026. This limit concerns operator-queryable Workers Logs, not all
Cloudflare network or security processing. See the
[Workers Logs documentation](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
and [new Observability pricing](https://developers.cloudflare.com/observability/pricing/).

## MCP tool execution counts

After this revision is deployed, each completed MCP tool callback writes one
structured event to the existing API Worker log:

```json
{"event":"mcp_tool_execution","tool":"cidr-cover","outcome":"success","traffic_source":"public_call"}
```

A failed callback adds a controlled error code:

```json
{"event":"mcp_tool_execution","tool":"cidr-cover","outcome":"error","traffic_source":"public_call","error_code":"INVALID_INPUT"}
```

The tool identifier comes from the catalog closure. Events also identify the
traffic source and may include a validated automation run identifier for
verified checks. No inputs, results, connection addresses, raw request headers,
automation tokens, exception details, request identifiers, or duration fields
are passed to this application logger. Recording an event
uses the current invocation; it does not perform another API request or write
to a database. The public policy, MCP guide, and tool descriptions disclose this
logging in the same revision.

### Automated check classification

Before merging a change that enables marked production smoke checks, configure
the same dedicated `PACKETROVE_AUTOMATION_TOKEN` secret in the API Worker and
GitHub Actions. Use 32 cryptographically random bytes encoded as 64 lowercase
hexadecimal characters. Generate and transfer the value privately; do not reuse
a deployment credential or put it in tracked configuration, command arguments,
public logs, or workflow artifacts. These interactive commands accept the same
value without including it in shell history:

```sh
pnpm --filter @packetrove/worker exec wrangler secret put PACKETROVE_AUTOMATION_TOKEN
gh secret set PACKETROVE_AUTOMATION_TOKEN --repo <owner/repository>
```

This is an optional Worker secret: local development, builds, tests, and public
MCP clients require no production credential. Missing or malformed Worker
configuration classifies calls as `public_call`; it does not prevent execution.
The deployment workflow checks its GitHub Actions secret before publishing and
passes it only to the configuration check and production smoke step.

| Request header | Value and handling |
| --- | --- |
| `Packetrove-Automation-Token` | Dedicated secret, compared using the Worker's timing-safe comparison. It is never passed to the application logger or returned to the caller. |
| `Packetrove-Automation-Run-Id` | `GITHUB_RUN_ID`; logged only for a matching token and a positive decimal string of at most 20 digits. Invalid or missing values are omitted. |

Marked smoke requests use these headers for initialization, discovery, and
every tool call through both MCP clients. The fetch wrapper sends them only to
the exact configured `/mcp` URL and rejects redirects. Website and Web API
checks do not receive the automation token. Manual smoke checks without this
environment variable remain unmarked. Supplying a token requires a valid
`GITHUB_RUN_ID`; malformed local configuration fails before network checks.

Matching credentials produce `traffic_source: automated_check`. Missing,
mismatched, or malformed credentials produce `traffic_source: public_call`;
the request still runs with its original result and error semantics. The
classification uses the current tool-call request, not remembered initialization
headers. It grants no service permissions and adds no required MCP argument,
result field, or client configuration.

An automated execution can look like this:

```json
{"event":"mcp_tool_execution","tool":"cidr-cover","outcome":"success","traffic_source":"automated_check","automation_run_id":"1234567890"}
```

The run identifier is a correlation hint, not proof that a GitHub run exists;
the token identifies a holder of the configured automation credential. Public
calls include unmarked programs and manual checks, not just people. Old events
without a source cannot be reliably classified retrospectively. A mismatched
Worker and GitHub secret still allows smoke calculations to pass, so inspect
the production log classification after configuration and deployment. Rotate
the shared secret if it is exposed; request header values are not added to the
application events, but platform-enriched records must still be inspected.

### Counting boundary

An execution is counted after the callback awaits its executor and prepares a
success or error result. Retries count separately. Initialization,
`tools/list`, unknown names, and schema rejections before the callback do not
count. Local calculator requests deliberately reach core validation, so their
invalid inputs count as errors. Public-IP schema rejections occur before its
callback and do not count.

Cancellation after entering the callback can produce `error` with
`INTERNAL_ERROR` under the existing response contract. Error totals therefore
include callback cancellations as well as validation and execution failures.

`success` describes the callback before SDK output validation or response
delivery. Runtime termination or a failed logging sink may omit an event.
The result is recorded execution counts within the available log window, not
unique-user counts, all attempts, guaranteed deliveries, or an audit ledger.

### Log settings and free limits

Only the API configuration enables persisted logs, with
`logs.head_sampling_rate: 1`, `invocation_logs: false`, query-string redaction,
and traces and Issues disabled. This sampling configuration does not override
platform quotas. Disabling invocation logs removes the default invocation
entry; it does not remove all metadata from console events or prevent runtime
error capture. Query-string redaction removes URL query strings, not all
platform fields.

The pinned MCP SDK currently emits a fixed JSON-response-mode warning while
creating a server. Such SDK and runtime logs can consume the same quota,
including during discovery, but they are excluded from the tool-count query
by its `event` filter. Do not globally replace `console` or change the MCP
protocol to suppress that warning.

| Workers Free period | Included ingestion | Queryable retention |
| --- | --- | --- |
| Until November 30, 2026 | 200,000 log events per day | 3 days |
| From December 1, 2026 | 0.5 GB per day, shared at account level | 7 days |

These are log allowances, separate from the Worker request allowance. The new
meter includes complete uncompressed event bodies and enriched attributes.
From December 1, Free stops ingesting after its daily allowance is exhausted
and resumes at 00:00 UTC; existing records remain queryable for their retention
window. Free does not have paid overage ingestion. See
[current Workers Logs limits](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
and [announced Observability pricing](https://developers.cloudflare.com/observability/pricing/).

Confirm the actual Workers subscription before merging a change that enables
production logs. A Free zone plan does not establish the Workers subscription.
Paid subscriptions can charge overages; these Wrangler settings do not select
Free billing or set a spending cap. This implementation neither upgrades the
subscription nor adds a separate analytics service.

### Per-tool queries

After deployment, open Workers & Pages, select `packetrove-api`, then open
Observability and Overview. Keep the query scoped to this Worker, select the
last 24 hours, and use the raw event-count aggregation. Structured console
objects expose the fields below for filtering and grouping.

| Saved-query name | Filters | Group By |
| --- | --- | --- |
| MCP tool executions | `event = mcp_tool_execution` | `tool`, `traffic_source` |
| MCP tool errors | `event = mcp_tool_execution`, `outcome = error` | `tool`, `traffic_source`, `error_code` |
| MCP public executions | `event = mcp_tool_execution`, `traffic_source = public_call` | `tool` |
| MCP public errors | `event = mcp_tool_execution`, `traffic_source = public_call`, `outcome = error` | `tool`, `error_code` |
| MCP automated check executions | `event = mcp_tool_execution`, `traffic_source = automated_check` | `tool`, `automation_run_id` |

Sort by count descending and save each query under the listed name. Expand an
event in the Events tab to inspect its application fields and complete platform
envelope. The query excludes initialization, discovery, SDK warnings, and
`request_failure` events. Public-call queries exclude intentional validation
errors from verified smoke checks. The default window is one day; retained history
depends on the active plan. Saved queries do not extend retention or establish
monthly history. See the
[Query Builder guide](https://developers.cloudflare.com/workers/observability/query-builder/).

### Production acceptance

Before enabling statistics, confirm the production Workers subscription and
account-level log usage. After the authorized merge and successful deployment:

1. Verify the public policy, MCP discovery descriptions, and API observability
   settings match this revision.
2. Use documentation-address MCP examples to confirm that indexed
   `mcp_tool_execution` fields are available and the queries can be saved.
   Confirm that the deployment smoke run is `automated_check` with its run
   identifier, while an unmarked documentation-address call is `public_call`.
   Inspect success and controlled-error events without printing real lookup
   addresses.
3. Inspect complete persisted records privately, including any URL, request
   identifiers, IP-related fields, headers, or other enriched attributes.
   Confirm query strings are redacted and default invocation entries, traces,
   and Issues are disabled. Do not export raw logs to public artifacts or CI.
4. Check actual quota usage and state any missing-record limitation. A local
   exact-object logger assertion does not prove the platform envelope, billing
   plan, or complete production counts.

The code and local tests establish the application event boundary. Production
log inspection and saved queries require authenticated Cloudflare access.

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

## Permanent development and staging environments

The two Worker configurations also define named `development` and `staging`
environments. Each has a separate website Worker and API/MCP Worker:

| Environment | Website | API and MCP |
| --- | --- | --- |
| Development | `https://dev.packetrove.com` | `https://api.dev.packetrove.com` |
| Staging | `https://staging.packetrove.com` | `https://api.staging.packetrove.com` |

### Crawler policy

After this revision is deployed, development and staging serve
`User-agent: *` with `Disallow: /` at `/robots.txt` on both the website and API
origins. Their website builds omit `sitemap.xml` and its robots reference.
Production retains its website sitemap and allow-all robots policy.

Host-specific Static Assets `_headers` rules attach `X-Robots-Tag: noindex` to
development and staging website assets and the API's static OpenAPI document.
The API also attaches this header to dynamic responses, including API and MCP
errors, using its configured `PUBLIC_API_ORIGIN`. Request-supplied host or Origin
headers cannot change that policy. Static redirect rules run before `_headers`;
their destination responses carry the indexing header. Keep asset-first routing
so ordinary asset requests continue to use the static serving path. See
[Cloudflare's headers documentation](https://developers.cloudflare.com/workers/static-assets/headers/).

These are crawler requests, not access controls. Robots rules apply separately
to each origin, and AI clients visiting at a user's request may not follow them.
Also, a crawler blocked by `robots.txt` cannot read the `noindex` response header;
already indexed URLs need a separate removal process or a period of allowed
crawling with `noindex`. See [Google's indexing guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
and [OpenAI's crawler documentation](https://developers.openai.com/api/docs/bots).
Environment smoke checks verify both robots responses, the sitemap's absence,
and indexing headers on website assets, API responses, and MCP responses.

### Environment deployments

The **Deploy development or staging** workflow deploys only current revisions
with successful branch CI. Development selects `develop`; before that branch
exists, a manual run can bootstrap it from validated `main`. Staging selects the
single `release-<version>` branch while it exists and otherwise selects validated
`main`. Updates to other branches cannot replace an active staging candidate.
Deployment records identify the actual source SHA and become successful only
after website, API, and modern and legacy MCP smoke checks pass.

Create GitHub environments named `development` and `staging`. Give each a distinct
`NON_PRODUCTION_AUTOMATION_TOKEN` environment secret, generated as described for
the production automation token. The deployment workflow uploads it directly to
that environment's API Worker using a temporary secret file, removes that file,
and never prints the value. It uses the existing repository-level Cloudflare
deployment credentials for Workers in the same account and zone.

Bootstrap and verify both environments manually before setting the repository
variable `NON_PRODUCTION_DEPLOYMENTS_ENABLED=true`. That variable enables automatic
deployment after successful CI for `develop`, an active release branch, or idle
staging's `main`. Pull request validation does not deploy environments.

```sh
gh workflow run deploy-environment.yml --ref main -f environment=development
gh workflow run deploy-environment.yml --ref main -f environment=staging
```

For a local environment build, set both public origins before building, then
use the corresponding Wrangler `--env` value for both Workers:

```sh
VITE_WEBSITE_ORIGIN=https://dev.packetrove.com VITE_API_ORIGIN=https://api.dev.packetrove.com pnpm --filter @packetrove/web build
pnpm --filter @packetrove/worker run deploy --env development
pnpm --filter @packetrove/worker run deploy:website --env development
pnpm smoke https://dev.packetrove.com https://api.dev.packetrove.com
```

All environments share the account's existing free-plan quota. These
configurations do not activate a paid subscription. See the
[development and release policy](development-and-releases.md) for branch routing
and candidate lifecycle rules.

### Recover a non-production deployment

If the branch head is unchanged, rerun the failed deployment job after resolving
the reported error. Recovery retains that source revision and the environment's
own automation credential. If the branch has advanced, start **Deploy development
or staging** on `main` with the desired environment; it selects and validates the
current deployment source again.

Check the workflow summary and the GitHub environment's deployment record for
the source SHA and successful live checks. A failed smoke check leaves the
deployment unsuccessful even when the Workers were uploaded. Wait for a complete
successful attempt before accepting staging for publication.

During an active release, staging always selects its candidate branch. The
optional `source_ref` must name that branch and cannot force staging to `main`
or `develop`. Development deployments continue independently, and neither a
development update nor a production update replaces the active candidate.

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

For your own deployment, change the custom domains and `PUBLIC_API_ORIGIN` and
`PUBLIC_WEBSITE_ORIGIN` variables in the API Worker configuration. MCP derives its
exact Host and browser Origin allowlists from those variables. Build the website
with `VITE_API_ORIGIN=https://api.example.com` and
`VITE_WEBSITE_ORIGIN=https://www.example.com`, using your actual origins. The CLI
can use `public-ip --api-origin https://api.example.com`. OpenAPI uses a relative server
URL so it resolves against the host serving the specification. Local Vite
serves the website separately and points IP requests to `http://localhost:8787`.

Canonical URLs, alternate-language links, social metadata, the sitemap, and MCP
website examples use `VITE_WEBSITE_ORIGIN`. Changing Worker domains alone does
not rebuild website metadata. Generated repository integration guides retain the
public production defaults; the CLI's default API origin also remains production.

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
