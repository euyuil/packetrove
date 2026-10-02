# Continuous integration and deployment

[`ci.yml`](../.github/workflows/ci.yml) defines Packetrove's GitHub Actions
validation and production deployment workflow. It runs on pull requests targeting
`main`, updates to `main`, and manual runs on `main`. All changes reach `main`
through a pull request using squash merging.

The `main` ruleset requires the `Validate project` check from GitHub Actions to
pass before merging and requires the pull request branch to be up to date with
`main`. Pull requests run validation; successful current revisions on `main`
also deploy and verify production.

## Validation

One standard Ubuntu 26.04 runner installs Node.js 24.21.0 LTS from
`.node-version` and the pnpm version declared in the root `package.json`.
Dependencies are installed from the committed lockfile with
`pnpm install --frozen-lockfile`. The pnpm package store is cached using that
lockfile's hash.

The workflow runs `pnpm check`, which includes:

- Type checks for every workspace and repository scripts.
- Generated OpenAPI consistency and specification validation.
- Production builds for the website and offline CLI.
- Wrangler deployment dry runs for the API and website Workers.
- Shared calculation, CLI, web application, website isolation, API, and MCP tests.
  Worker tests execute in the local Workers runtime on the GitHub runner.
- Prerendered multilingual content and metadata, hydration, canonical and alternate
  language links, sitemap entries, and robots policy.

The same command is available locally. Installation, builds, and tests receive
no Cloudflare account credentials.

Pull request validation checks the prospective merge revision with `main`.
There are no path filters, so documentation-only changes also run the required
check. The job name `Validate project` is the required status check's context;
keep the workflow and the `main` ruleset aligned if it is renamed. The ruleset
accepts this check only from the GitHub Actions app.

The job sets `VITE_GITHUB_REPOSITORY` to `github.repository` and `VITE_GIT_COMMIT`
to `github.sha`. Vite embeds these public values while building the website, so
the shared footer links to the source tree for that exact commit on GitHub and
displays its seven-character hash. Neither value is committed as generated
source or fetched by the browser. Fork workflows use their own repository name.

## Production deployment

Only runs on `main` enter the deployment steps. After validation succeeds, the
workflow reads the current `main` revision through
the GitHub API. It only deploys if that revision still matches the run's commit.
Superseded commits retain their validation result and skip publishing.

The deployment steps use the workspace's pinned Wrangler.
`pnpm --filter @packetrove/worker run deploy` publishes `packetrove-api` at
`api.packetrove.com` first, followed by `deploy:website`, which publishes
`packetrove` and its static assets at `packetrove.com`. The website is already
built by `pnpm check`, so the root `pnpm run deploy` command is unnecessary in CI.
Both Worker versions are tagged with the full Git commit SHA and record the
GitHub Actions run ID in the version message. The two deployments are not atomic;
a website deployment failure may leave the new API alongside the previous
website. Review both Workers before a manual recovery.

After deployment, `pnpm wait:deployment https://packetrove.com` waits up to
90 seconds for the homepage to reference JavaScript containing the expected
`VITE_GIT_COMMIT`. It checks only static assets, waits five seconds after an
unsuccessful check, and keeps requests and response-body reads within the same
total budget. Each individual request also has a 15-second timeout. A stale
version, a transient network failure, or missing assets can be retried while
time remains. This budget is not a guarantee of Cloudflare propagation time.
If the expected version is still unavailable at the deadline, the run fails
with a version-readiness error before running the functional checks.

Once the version is ready,
`pnpm smoke https://packetrove.com https://api.packetrove.com` verifies all 20
prerendered localized pages, metadata, canonical and alternate language links,
the sitemap and robots policy, bundled assets, API results, OpenAPI document,
modern and legacy MCP clients,
Origin validation, anonymous browser CORS, and origin isolation. With
`VITE_GIT_COMMIT` set, it also checks that the deployed JavaScript contains the expected build commit. It makes up to three attempts,
waiting five seconds between failures to allow for temporary network errors.
Version readiness does not count as a successful smoke check: API, MCP, public
IP `no-store`, Origin validation, page routing, and 404 checks must still pass.

A failed validation prevents publishing. A failed smoke check marks the run as
failed after publishing; it does not automatically undo the deployment. Inspect
the service and follow the [rollback procedure](deployment.md#later-deployments-and-rollback).
The workflow summary records the verified commit or explains why publishing was
skipped or the live checks failed.

## Triggers and results

Open [the workflow's runs](https://github.com/euyuil/packetrove/actions/workflows/ci.yml)
to inspect validation results and logs. With GitHub CLI access to the
repository, use:

```sh
gh run list --repo euyuil/packetrove --workflow ci.yml
gh run view <run-id> --repo euyuil/packetrove --log-failed
gh workflow run ci.yml --repo euyuil/packetrove --ref main
```

Runs for `main` share a production concurrency group with
`cancel-in-progress: false`. Only one run can execute at a time. New pushes do
not interrupt a running validation, deployment, or smoke check. GitHub keeps
one pending run by default and replaces it when another run enters the queue.
The revision check prevents an older queued or manually rerun commit from
overwriting a newer version. If `main` changes after that check, the active
deployment finishes and a subsequent successful run can publish the newer
revision. See [GitHub workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

Pull request runs use a separate concurrency group for each pull request.
New commits cancel an older run for that pull request so the latest revision
receives the required check. They do not cancel a production run.

Each job has a ten-minute timeout. A branch push alone does not run this workflow
unless it updates `main`; opening, reopening, or updating a pull request targeting
`main` triggers validation. Manual validation and deployment require `main`.

## Cloudflare credentials

Configure these repository settings in GitHub Actions before the first run:

| Setting | Storage | Purpose |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Repository secret | Dedicated Cloudflare token for publishing both Workers and their custom domains. |
| `CLOUDFLARE_ACCOUNT_ID` | Repository secret | Cloudflare account containing both Workers and the production zone, masked in workflow logs. |

Create a dedicated account-owned API token named `packetrove-github-actions`.
Cloudflare's **Edit Cloudflare Workers** template is a starting point; retain only
the permissions required by both Workers and their custom domains:

| API permission | Resource scope | Dashboard selection |
| --- | --- | --- |
| `Workers Scripts Write` | Packetrove's Cloudflare account | Workers Scripts / Edit |
| `Zone Read` | `packetrove.com` only | Zone / Read |

The script permission is account-wide in this configuration. The token does not
need permissions for KV, R2, Pages, databases, hosted builds, containers, or
observability. Both Workers use custom domains in the same zone, rather than zone
routes that require `Workers Routes Write`. The same secrets cover both deployments; an
interactive `cf` or Wrangler login is not needed by GitHub Actions.

Store both values directly in GitHub Secrets. Keeping the account identifier in
a secret also masks it in workflow logs. The token is exposed only to the
deployment step, not dependency installation, validation, or smoke checks. An
interactive local OAuth login does not authenticate the GitHub runner. See
[Cloudflare's GitHub Actions authentication guide](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).

Set both secrets with GitHub CLI if preferred:

```sh
gh secret set CLOUDFLARE_ACCOUNT_ID --repo euyuil/packetrove
gh secret set CLOUDFLARE_API_TOKEN --repo euyuil/packetrove
```

Both commands prompt for their values without putting them in shell history.
Do not put the API token or local OAuth credentials in Git. Rotate the repository
secret when its token expires or is revoked. Missing deployment settings fail
the deployment step with a configuration error.

## Permissions and maintenance

The workflow's GitHub token has read access to repository contents. Checkout
credentials are not persisted for subsequent build and test commands. Actions
are pinned to full commit hashes, with release versions recorded in comments.
When updating an action, verify its release and replace the pinned commit.

Keep `.node-version` aligned with the Node.js LTS version verified in the README
and the matching major version of `@types/node`. Update pnpm through the root
`packageManager` field and regenerate the lockfile when changing dependencies.

Prefer the default stable release channel and versions that satisfy the
dependencies' declared peer requirements. Vitest stays on 4.1.11 while
`@cloudflare/vitest-plugin` requires `^4.1.0`. The MCP SDK packages stay on
2.0.0 and 1.30.0 while `agents` 0.24.0 requires those exact versions.

`pnpm-workspace.yaml` gives newly published dependencies a 24-hour waiting
period with `minimumReleaseAge: 1440`. Its exact-version exceptions cover
the Cloudflare test plugin's security update and the previously validated
Wrangler, Miniflare, and Redocly CLI versions. Reassess these exceptions when
updating those packages. Dependency installation scripts are approved
explicitly through `allowBuilds`; esbuild and workerd require them, and Scalar's
`vue-demi` script selects the adapter for the installed Vue version.
The informational `core-js-pure` postinstall is explicitly disabled.
Exact overrides move Scalar's affected transitive dependencies to the patched
`undici` 7.29.1 and `@ai-sdk/provider-utils` 4.0.33 releases. Reassess these
overrides when upgrading Scalar.
After dependency changes, validate a frozen-lockfile install, run `pnpm check`,
and inspect `pnpm audit` before pushing. Verify the resulting GitHub Actions
run as well.

## Cost controls

Each run uses one standard Linux runner, a dependency cache, and a timeout.
Superseded pull request runs are canceled and superseded `main` revisions skip
deployment. The workflow does not upload build artifacts to GitHub. Standard
GitHub-hosted runner usage is free for this public repository; private copies
use their owner's included allowance and billing settings. See
[GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

GitHub Actions usage is separate from Cloudflare's Workers request and build
quotas. Builds happen on the GitHub runner and do not use Cloudflare Workers
Builds minutes. Pull request validation makes no production smoke-check requests.
Version readiness makes only static-asset requests; production smoke checks make
a small number of dynamic requests against the account's Workers request quota.
