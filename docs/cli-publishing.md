# Publishing the CLI to npm

The CLI is published as `@packetrove/cli`, with the `packetrove` executable.
The initial `0.1.0` release is available on
[npm](https://www.npmjs.com/package/@packetrove/cli) and
[GitHub](https://github.com/euyuil/packetrove/releases/tag/0.1.0). Only the CLI is
published; it bundles the core, contracts, and runtime dependencies.

## Release policy

After the one-time setup below, maintainers merge ordinary feature pull
requests as usual. The existing `CI and deployment` workflow validates and
deploys the website, API, and MCP on `main`.

Packetrove uses one product version for the website, API, MCP, CLI, core, and
contracts. Shared calculations and contracts keep corresponding capabilities
aligned. Release numbers identify a source snapshot; deployed services can
contain newer unreleased changes, identified by their Git commit SHA.

[`release.yml`](../.github/workflows/release.yml) runs after a successful
current `main` validation, deployment, and production check. Release-please
maintains a separate `chore: release <version>` pull request containing the
product changelog and all workspace version updates. This pull request also runs the required
`Validate project` check and must be up to date with `main`. It is never
automatically merged. Leave it open to accumulate changes without publishing
npm.

The owner's approval to squash-merge that release pull request authorizes its
npm release. Complete the public-material and package review required by
[AGENTS.md](../AGENTS.md) before approving it; there is no second publishing
prompt after the release pull request is merged. After the merged revision passes CI, release-please creates
the plain `<version>` tag, such as `0.1.1`, and a GitHub Release. The release event triggers
[`publish-cli.yml`](../.github/workflows/publish-cli.yml), which validates, packs,
publishes through npm trusted publishing, and verifies the exact npm version.
Ordinary feature merges continue to deploy the services; they do not themselves
publish npm.

### Versions and release scope

Version numbers, Git tags, and GitHub release names omit the `v` prefix.
Tags also omit component prefixes. A formal product release publishes the CLI
at the same version, including releases whose changes only affect the website
or API. Publishing a product version does not restrict ordinary service
deployments to release tags.

Use Conventional Commit titles for squash-merged pull requests:

| Change affecting the product | Title example | Result from 0.1.0 |
| --- | --- | --- |
| Fix, packaging correction, or dependency update | `fix(cli): correct JSON error output` | 0.1.1 |
| Feature in the website, API, MCP, CLI, core, or contracts | `feat(core): support another calculation`, `feat(web): add a tool` | 0.2.0 |
| Breaking change before 1.0 | `feat(cli)!: change the input format` | 0.2.0 |
| Documentation or chores | `docs: clarify installation`, `chore: update tooling` | No product release |

For a stable version of 1.0.0 or later, breaking changes bump the major version.
Use release-please's documented [Release-As override](https://github.com/googleapis/release-please#how-do-i-change-the-version-number)
when deliberately graduating to 1.0.0. Routine releases require no manual
version edits or workflow version input. Give dependency and packaging fixes
a `fix` title; an ordinary `chore` title does not request a release.

The release component uses the pinned `release-please` development dependency
and the Node strategy with a small file filter in `scripts/release-please.ts`.
The filter handles root files exactly; the upstream directory exclusion does
not. This tooling is not bundled in the CLI. One component rooted at `.` groups
`packages/cli`, `packages/core`, `packages/contracts`, `apps/web`, and
`apps/worker`. Shared manifests, the lockfile, `.node-version`,
`tsconfig.base.json`, `LICENSE`, and the OpenAPI and API-asset build scripts also
contribute. Documentation, agent skills, other repository scripts, and workflow
files are excluded. A mixed commit that changes product inputs still
contributes. Update the relevant package manifest when changing a dependency
and regenerate the lockfile together.

Release-please updates the root and every workspace's `package.json`,
`.release-please-manifest.json`, `docs/api/openapi.json`, and `CHANGELOG.md`
together. It also regenerates `docs/integrations/mcp.md` from the shared MCP
guide content using the candidate version. API and MCP version metadata comes
from the shared contracts package version. The generated OpenAPI version and
MCP guide are updated in the release PR so the required consistency checks
continue to pass. Only the CLI is published to npm; the other packages remain
private. Publication checks every workspace version, the OpenAPI version, and
the release manifest against the tag before uploading.

## One-time GitHub App setup

Create a GitHub App in **Settings → Developer settings → GitHub Apps**. Use a
descriptive name, the public repository URL as its homepage, disable webhooks,
and grant only these repository permissions:

| Permission | Access |
| --- | --- |
| Contents | Read and write |
| Issues | Read and write |
| Pull requests | Read and write |
| Metadata | Read, granted automatically |

Install the App only on `euyuil/packetrove`. Generate a private key and store the
following as GitHub Actions **repository secrets**:

| Secret | Value |
| --- | --- |
| `RELEASE_APP_CLIENT_ID` | The App's Client ID |
| `RELEASE_APP_PRIVATE_KEY` | The complete private-key PEM |

Keep both values out of tracked files, repository variables, and logs. The
workflow generates a short-lived token limited to the current repository and
revokes it when the job ends. The token is passed only to release-please. The
App does not bypass `main` protection or automatically merge pull requests.

GitHub's default workflow token does not trigger new workflow runs for the
pull requests and releases it creates. The App allows release pull requests to
run the required CI check and GitHub Releases to trigger npm publication. See
the [release-please action documentation](https://github.com/googleapis/release-please-action#other-actions-on-release-please-prs).
If the App secrets are absent, preparation records a setup message and skips;
ordinary validation and service deployment still run.

## First release and baseline

The steps below document the initial distribution setup. The project's `0.1.0`
package and GitHub Release already exist; subsequent releases follow the
release policy above and still require publication verification.

1. Sign in to an npm account with verified email, interactive publishing 2FA,
   and permission to publish public packages under the `packetrove`
   organization.
2. Have the owner authorize and squash-merge the publishing preparation pull
   request. Wait for the actual merged revision's validation, deployment, and
   production checks. Record that exact `main` commit as `<release-commit>` and
   build the initial `0.1.0` archive from that commit.
3. Review tracked files, reachable Git history, workflow logs, and uploaded
   artifacts for private information as required by [AGENTS.md](../AGENTS.md).
   Review the actual archive, including the source map, README, root license,
   and third-party notices. Report the scope and limits of the review.
4. Using the pinned Node.js and pnpm versions, install locked dependencies,
   validate, and pack:

   ```sh
   pnpm install --frozen-lockfile
   pnpm check
   pnpm --filter @packetrove/cli pack --pack-destination /tmp/packetrove-artifacts
   npm publish /tmp/packetrove-artifacts/packetrove-cli-0.1.0.tgz --dry-run --json
   ```

5. After explicit authorization for the first npm release, publish that reviewed
   archive from the account's own terminal and complete npm's browser or 2FA
   prompts:

   ```sh
   npm login --registry=https://registry.npmjs.org/
   npm publish /tmp/packetrove-artifacts/packetrove-cli-0.1.0.tgz --access public --registry=https://registry.npmjs.org/
   ```

   The first interactive release establishes the package settings. It does not
   have GitHub Actions provenance. Keep the archive and its integrity for the
   baseline verification.
6. Verify the published version from an empty temporary directory:

   ```sh
   mkdir -p /tmp/packetrove-npm-verification
   cd /tmp/packetrove-npm-verification
   npm view @packetrove/cli@0.1.0 version --registry=https://registry.npmjs.org/
   npm exec --yes --ignore-scripts --registry=https://registry.npmjs.org/ --package=@packetrove/cli@0.1.0 -- packetrove cidr cover 203.0.113.1 203.0.113.2 203.0.113.6 --json
   ```

   Expect `203.0.113.0/29`, with input, covered, and additional address counts of
   `"3"`, `"8"`, and `"5"`. Use documentation addresses rather than a real
   public IP lookup for release checks.
7. Configure npm trusted publishing as described below, then create the
   initial GitHub Release at the exact commit used for the npm archive:

   ```sh
   gh release create 0.1.0 --repo euyuil/packetrove --target <release-commit> --title "0.1.0" --notes "Initial Packetrove release."
   ```

   Replace `<release-commit>` with the recorded SHA. Do not tag a later commit
   with different package contents. This event starts the publishing workflow;
   it detects the identical existing npm archive and verifies without uploading
   it again. Review the workflow result.

The initial `0.1.0` GitHub Release is release-please's baseline. Preparation
skips until it exists, so installing this automation does not silently publish
the first npm package. Once setup is complete, the next successful `main` run
maintains the next release pull request. To prepare immediately, run:

```sh
gh workflow run release.yml --repo euyuil/packetrove --ref main
```

After npm publication is verified, keep installation and availability wording
in the README, package README, and integration guides consistent with the
published package through a follow-up pull request.

## Configure npm trusted publishing

After the initial npm publication, open the package's settings on npmjs.com,
add a trusted publisher, and select GitHub Actions:

| Field | Value |
| --- | --- |
| Organization or user | `euyuil` |
| Repository | `packetrove` |
| Workflow filename | `publish-cli.yml` |
| Environment name | Leave empty; this workflow does not use a GitHub environment |
| Allowed actions | Allow direct publishing with `npm publish` |

Leave `Allow npm dist-tag` unchecked; this workflow does not manage tags with a
separate `npm dist-tag` command. Under Publishing access, select the option that
requires two-factor authentication and disallows tokens that bypass it. This
restriction does not prevent trusted publishing through OIDC.

Staged publication alone does not permit this workflow's direct command. npm
does not validate this configuration when it is saved; a later workflow upload
is the live test of the trusted-publisher setup. Recovery of an identical
existing archive skips upload and does not test OIDC publication.

The workflow uses a GitHub-hosted runner, npm CLI 11.5.1 or later, and
`id-token: write`. No long-lived npm token is needed. Trusted publication from
this public repository receives automatic provenance. See the
[npm trusted-publishing guide](https://docs.npmjs.com/trusted-publishers/).
Scoped public packages require public access. Name/version pairs cannot be
reused; see the [npm publish command](https://docs.npmjs.com/cli/v11/commands/npm-publish/).

## Verification and recovery

Publication checks the stable GitHub Release, tag ancestry on `main`, agreement
between the tag and version files, and successful main CI validation for that
exact commit. It reruns `pnpm check` on the tagged checkout and packs that
checkout. Later commits on `main` do not change the publication contents.
Service deployment remains governed by `ci.yml`; the tagged CLI only needs its
exact commit's successful validation even if a later main revision deployed
the services.

Before publication preview or upload, the workflow compares the archive's
SHA-512 integrity with any existing npm version. An absent version proceeds to
preview and publication; an identical existing archive skips both and proceeds
to verification; different contents fail. Even `npm publish --dry-run` rejects
an already published version, so it runs only when the version is absent.
Registry errors are failures, not evidence that a version is absent. After
publication it allows up to two minutes of polling delays for the new version
to become visible, then checks registry integrity, installs the exact version
with a fresh npm cache outside the workspace, and verifies its calculation.

If upload succeeds but later verification fails, the version may already be
public. Inspect the registry and workflow logs, then rerun the failed job or
request recovery of the existing GitHub Release:

```sh
gh workflow run publish-cli.yml --repo euyuil/packetrove --ref main -f tag=0.1.1
```

Recovery uses the original tag, runs all publication checks, and never bumps a
version or overwrites a published package. If release preparation failed, fix
the configuration or recover main CI first, then rerun `release.yml`.
A failed GitHub Release or npm upload does not undo service deployment.
