# Continuous integration and deployment

[`ci.yml`](../.github/workflows/ci.yml) defines Packetrove's GitHub Actions
validation and production deployment workflow. It runs on pushes to `main` and
can be started manually on `main`. The repository continues to use direct
commits to `main`; each update is intended for production.

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
- A Wrangler deployment dry run for the Worker.
- Shared calculation, CLI, web application, API, and MCP tests. Worker tests
  execute in the local Workers runtime on the GitHub runner.

The same command is available locally. Installation, builds, and tests receive
no Cloudflare account credentials.

## Production deployment

After validation succeeds, the workflow reads the current `main` revision through
the GitHub API. It only deploys if that revision still matches the run's commit.
Superseded commits retain their validation result and skip publishing.

The deployment step uses the workspace's pinned Wrangler through
`pnpm --filter @packetrove/worker run deploy`. The website is already built by
`pnpm check`, so the root `pnpm run deploy` command is unnecessary in CI.
Wrangler publishes the Worker and its static assets together using the committed
configuration. It tags the Worker version with the full Git commit SHA and records
the GitHub Actions run ID in the version message.

The workflow then runs `pnpm smoke https://packetrove.com` to verify the website,
bundled assets, API results, OpenAPI document, modern and legacy MCP clients, and
Origin validation. It makes up to three attempts, waiting five seconds between
failures to allow for temporary network or deployment propagation delays.

A failed validation prevents publishing. A failed smoke check marks the run as
failed after publishing; it does not automatically undo the deployment. Inspect
the service and follow the [rollback procedure](deployment.md#later-deployments-and-rollback).
The workflow summary records the verified commit or explains why publishing was
skipped or the live checks failed.

## Triggers and results

Open [the workflow's runs](https://github.com/euyuil/packetrove/actions/workflows/ci.yml)
to inspect validation results and logs. With GitHub CLI access to the private
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

Each job has a ten-minute timeout. Other branches neither deploy nor
automatically run this workflow. A manual run also requires the `main` branch.

## Cloudflare credentials

Configure these repository settings in GitHub Actions before the first run:

| Setting | Storage | Purpose |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Repository secret | Dedicated Cloudflare token for publishing the Worker. |
| `CLOUDFLARE_ACCOUNT_ID` | Repository secret | Cloudflare account containing the Worker and production zone, masked in workflow logs. |

Create a dedicated account-owned API token named `packetrove-github-actions`.
Cloudflare's **Edit Cloudflare Workers** template is a starting point; retain only
the permissions required by the current Worker and custom domain configuration:

| API permission | Resource scope | Dashboard selection |
| --- | --- | --- |
| `Workers Scripts Write` | Packetrove's Cloudflare account | Workers Scripts / Edit |
| `Zone Read` | `packetrove.com` only | Zone / Read |

The script permission is account-wide in this configuration. The token does not
need permissions for KV, R2, Pages, databases, hosted builds, containers, or
observability. The Worker uses a custom domain, rather than a zone route that
requires `Workers Routes Write`.

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
explicitly through `allowBuilds`; esbuild and workerd require them.
The informational `core-js-pure` postinstall is explicitly disabled.
After dependency changes, validate a frozen-lockfile install, run `pnpm check`,
and inspect `pnpm audit` before pushing. Verify the resulting GitHub Actions
run as well.

## Cost controls

The workflow uses one standard Linux runner, a dependency cache, a timeout, and
skips deployments of superseded commits. It does not upload build artifacts to
GitHub. The project uses the repository owner's included GitHub Actions
allowance for private repositories. This is separate from Cloudflare's Workers
request and build quotas. Builds happen on the GitHub runner and do not use
Cloudflare Workers Builds minutes. Production smoke checks make a small number
of dynamic requests against the account's Workers request quota.

Included minutes depend on the GitHub plan; usage beyond the included allowance
can be billed according to the account's billing settings. Check account usage
and budgets in GitHub when increasing CI frequency or adding jobs. See
[GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
