# Continuous integration

[`ci.yml`](../.github/workflows/ci.yml) defines Packetrove's GitHub Actions
validation workflow. It runs on pushes to `main` and can be started manually.
The repository continues to use direct commits to `main`.

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

The same command is available locally. CI uses no Cloudflare account credentials;
production publishing remains the manual process in the
[deployment guide](deployment.md).

## Triggers and results

Open [the workflow's runs](https://github.com/euyuil/packetrove/actions/workflows/ci.yml)
to inspect validation results and logs. With GitHub CLI access to the private
repository, use:

```sh
gh run list --repo euyuil/packetrove --workflow ci.yml
gh run view <run-id> --repo euyuil/packetrove --log-failed
gh workflow run ci.yml --repo euyuil/packetrove --ref main
```

A new run for the same branch cancels an older pending or running CI job. Each
job has a ten-minute timeout. Pushes to other branches do not automatically run
this workflow.

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
cancellation of superseded runs to limit execution time. It does not upload
build artifacts. The project uses the repository owner's included GitHub Actions
allowance for private repositories. This is separate from Cloudflare's Workers
request and build quotas.

Included minutes depend on the GitHub plan; usage beyond the included allowance
can be billed according to the account's billing settings. Check account usage
and budgets in GitHub when increasing CI frequency or adding jobs. See
[GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
