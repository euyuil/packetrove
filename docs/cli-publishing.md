# Product releases and publication

The CLI is published as `@packetrove/cli`, with the `packetrove` executable.
The initial `0.1.0` release is available on
[npm](https://www.npmjs.com/package/@packetrove/cli) and
[GitHub](https://github.com/euyuil/packetrove/releases/tag/0.1.0). Only the CLI is
published to npm; it bundles the core, contracts, and runtime dependencies.
The [MCP Registry procedure](#publish-to-the-official-mcp-registry) separately
registers the existing remote service. Registry publication is manual and is
not triggered by merging a pull request or publishing the CLI.

## Release policy

The [development and release workflow](development-and-releases.md) is the
primary operating procedure. Daily work uses squash PRs into
`develop`; candidate fixes use squash PRs into `release-<version>`. Production
still deploys validated `main`, including emergency hotfix PRs.

Packetrove uses one product version for the website, API, MCP, CLI, core, and
contracts, including the MCP Registry manifest and the
[OpenAI plugin package](integrations/openai-plugin.md). Shared calculations and
contracts keep corresponding capabilities aligned. Release numbers identify a
source snapshot; deployed services can
contain newer unreleased changes, identified by their Git commit SHA.

[`manual-release.yml`](../.github/workflows/manual-release.yml) coordinates
protected PRs after `DEVELOPMENT_WORKFLOW_ENABLED=true`. **Prepare** selects a
validated `develop` snapshot and an explicit next version. It prepares the
unified versions and changelog through a squash PR into the candidate branch,
then opens a promotion PR. Candidate preparation and staging deployment publish
neither a tag nor npm.

Complete the public-material and package review required by
[AGENTS.md](../AGENTS.md) before publication. After staging acceptance and
[separate explicit owner release approval](development-and-releases.md#release-approval),
run **Publish** with the exact candidate SHA to execute promotion using a merge
commit. The action waits for that merged `main` revision's production deployment and live
checks, creates the immutable plain `<version>` tag and GitHub Release, and
waits for [`publish-cli.yml`](../.github/workflows/publish-cli.yml) to verify the
CLI. It then synchronizes `main` into `develop` through a normal merge PR and
returns staging to validated `main` after deleting the completed candidate.

The final legacy release, `0.4.0`, is published. Automatic candidate preparation
in [`release.yml`](../.github/workflows/release.yml) was paused before that merge;
the legacy workflow is now disabled so it cannot compete with the coordinator. Failed steps
are recovered using the same candidate version or existing tag. Never advance
the version to retry a failed upload or verification.

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
| Feature in the website, API, MCP, CLI, core, contracts, or plugin | `feat(core): support another calculation`, `feat(web): add a tool` | 0.2.0 |
| Breaking change before 1.0 | `feat(cli)!: change the input format` | 0.2.0 |
| Documentation or chores | `docs: clarify installation`, `chore: update tooling` | No product release |

For a stable version of 1.0.0 or later, breaking changes bump the major version.
Choose the immediate next patch, minor, or major version explicitly in Prepare;
choose a patch for `prepare-hotfix`. The table guides that choice and changelog
generation. The coordinator supplies release-please's `releaseAs` override and
rejects skipped stable version increments; do not edit version files individually.
Give dependency and packaging fixes a `fix` title. Documentation and chores
alone ordinarily do not warrant a product release.

The release component uses the pinned `release-please` development dependency
and the Node strategy with a small file filter in `scripts/release-please.ts`.
The filter handles root files exactly; the upstream directory exclusion does
not. This tooling is not bundled in the CLI. One component rooted at `.` groups
`packages/cli`, `packages/core`, `packages/contracts`, `apps/web`,
`apps/worker`, and `plugins/packetrove`. Plugin manifests, listing text, and
assets therefore contribute to the same release. Shared manifests, the lockfile,
`.node-version`, `tsconfig.base.json`, `LICENSE`, and the OpenAPI and API-asset
build scripts also contribute. The Registry `server.json`, generator, and manifest builder also
contribute, so a Registry-only `fix(mcp)` receives a formal patch release.
Documentation, other repository scripts, and workflow files are excluded.
A mixed commit that changes product inputs still
contributes. Update the relevant package manifest when changing a dependency
and regenerate the lockfile together.

Candidate preparation collects commits reachable from its frozen source SHA
but not from the latest formal release's SHA. This ancestry-based range includes
next-release development created before the previous release tag and excludes
already released work after lifecycle merges. Commit dates and the position of
a tag in GitHub's linear history do not define release scope.

Release-please updates the root and every workspace's `package.json`,
`plugins/packetrove/plugin.json`, `.release-please-manifest.json`,
`docs/api/openapi.json`, and `CHANGELOG.md`
together. It also regenerates `docs/integrations/mcp.md` from the shared MCP
guide content and `server.json` from the shared server identity and endpoint
using the candidate version. API and MCP version metadata comes
from the shared contracts package version. The generated OpenAPI version and
MCP guide are updated in the release PR so the required consistency checks
continue to pass. Only the CLI is published to npm; the other packages remain
private. Publication checks every workspace version, the plugin and OpenAPI
versions, and the release and Registry manifests against the tag before uploading.
OpenAI plugin ZIP generation and submission remain separate maintainer actions;
a product release does not automatically upload or publish that package.

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
revokes it when the job ends. The token is passed to release-please and the
release coordinator. The App creates and merges release PRs after checks when
the operation is authorized; it has no branch-protection bypass. The workflow
token reads validation and deployment records and can dispatch recovery workflows.

The App lets its PRs run CI automatically and its GitHub Releases trigger npm
publication. GitHub's default workflow token suppresses most resulting workflow
events; its PR events require approval and `workflow_dispatch` is an exception.
See [GitHub's workflow triggering rules](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
Missing App secrets block release coordination; ordinary validation and service
deployment still run.

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
the first npm package. To explicitly prepare or update the legacy release PR
during migration, run:

```sh
gh workflow run release.yml --repo euyuil/packetrove --ref main -f prepare_pull_request=true
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
publication it allows up to five minutes of polling delays for the new version
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

## Publish to the official MCP Registry

This procedure prepares and publishes metadata for the anonymous remote
`https://api.packetrove.com/mcp` endpoint. It uses Registry name
`io.github.euyuil/packetrove` with GitHub namespace verification. The MCP
protocol server name remains `Packetrove`; publisher authentication does not
add login requirements to client connections. The manifest has one
`streamable-http` remote and no packages, headers, variables, or API keys.
`@packetrove/cli` is not a local MCP server.

The checked-in [server.json](../server.json) is generated by
`pnpm registry:generate` from shared identity, endpoint, and product version.
`pnpm registry:check` validates Packetrove's deliberately restricted subset of
the [official server schema](https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json)
and rejects drift offline. It does not verify namespace ownership, the live
service, or Registry acceptance. The schema dated `2025-12-11` and official
publisher `v1.8.1` were checked when preparing this workflow. Recheck schema and
publisher compatibility before publication or when upgrading either.

### Versions and corrections

The Registry version equals the formal Packetrove product release number,
without a tag prefix, build metadata, or a Registry prerelease suffix.
Release-please regenerates the entire manifest at the candidate version, not
just its version field. Review the generated identity and endpoint in the
release pull request as well as the workspace versions.

A name/version pair becomes immutable after Registry publication. Correct its
description, website, icon, repository, or endpoint in source, regenerate the
manifest, and publish it with the next formal product release. A correction
that must be published immediately needs a product patch release, which also
publishes the CLI even if its functionality is unchanged. Do not overwrite a
published version or invent a separate Registry revision. See the
[official versioning rules](https://modelcontextprotocol.io/registry/versioning).

The remote URL always connects to the current deployment. An older Registry
entry does not preserve an executable snapshot of that product version.
Registry discoverability does not guarantee inclusion in a particular client's
directory, automatic configuration, recommendations, or citations.

### Prepare the exact formal release

1. Select an existing, non-draft, non-prerelease GitHub Release whose tag
   contains the manifest, shared server identity, and this procedure. A feature
   merge can deploy while retaining the previous formal version, so matching
   package and live version strings alone is insufficient. An earlier release
   missing these files cannot be used for first publication. Preserve local
   work and use a clean verification clone or worktree at that release tag:

   ```sh
   gh release view <version> --repo euyuil/packetrove --json tagName,isDraft,isPrerelease,url
   git fetch origin main --tags
   git switch --detach <version>
   git merge-base --is-ancestor HEAD origin/main
   git cat-file -e HEAD:server.json
   git cat-file -e HEAD:packages/contracts/src/identity.ts
   git cat-file -e HEAD:scripts/mcp-registry-manifest.ts
   pnpm install --frozen-lockfile
   pnpm check
   ```

   Replace `<version>` with that formal release, using the toolchain declared
   by [.node-version](../.node-version) and [package.json](../package.json).
   Review `server.json` and confirm its version equals the tag, all workspace
   versions, and `.release-please-manifest.json`. Do not modify the tagged
   manifest in place. Changes require another reviewed product release.

2. Record the tag's exact commit SHA and the corresponding successful `main`
   `ci.yml` run. Review the actual validation, API and website deployment, and
   production verification steps; a pull request check or a run with skipped
   deployment is insufficient. Confirm production contains this release's
   identity and endpoint changes. If production has advanced, record its
   deployed commit, verify it descends from the release and has unchanged
   published metadata, and review its successful production checks too. Use
   the [deployment verification procedure](deployment.md) for deployed revisions.

3. From the selected checkout, run the generated MCP guide's Node.js example
   against `https://api.packetrove.com/mcp`. Confirm initialization reports
   `Packetrove`, the selected release version and shared identity, `tools/list`
   matches the current shared catalog, and `cidr-cover` returns
   `203.0.113.0/29` with exact counts `"3"`, `"8"`, and `"5"`. Do not call
   `public-ip` or submit real network inputs for this publication check. The
   guide example discovers tools and performs the documentation-address
   calculation; inspect server information from the same client with
   `client.getServerVersion()`. Keep real lookup addresses, private network
   inputs, and credentials out of logs.

### Recheck discovery and validate online

Immediately before publication, inspect the public Registry for any Packetrove
listing, including deleted entries, and query the exact name's versions:

```sh
curl --fail --silent --show-error 'https://registry.modelcontextprotocol.io/v0.1/servers?search=packetrove&include_deleted=true'
curl --fail --silent --show-error 'https://registry.modelcontextprotocol.io/v0.1/servers/io.github.euyuil%2Fpacketrove/versions?include_deleted=true'
```

Follow any `nextCursor` to inspect all results. An exact-name HTTP 404 means
that name is absent; authentication, rate-limit, network, and other server
errors do not. Reconcile an existing identity rather than creating a competing
name. If the chosen version already exists, compare it with the reviewed
manifest and proceed to readback for identical metadata. Different metadata
requires correction in a later formal release. Do not publish a lower version
to try to replace a newer listing.

Install the official publisher through the
[official installation instructions](https://modelcontextprotocol.io/registry/quickstart#step-3-install-mcp-publisher).
On macOS, Homebrew provides it:

```sh
brew install mcp-publisher
mcp-publisher --version
mcp-publisher validate server.json
```

For an exact publisher version or another platform, obtain the matching binary
from the [official releases](https://github.com/modelcontextprotocol/registry/releases),
verify the release's checksum and available signing provenance, and put it on
`PATH`. Keep downloaded binaries outside tracked files. Record the publisher
version and validation result with the reviewed release commit.

`mcp-publisher validate` sends the manifest to the Registry's validation API;
it is not an offline command and does not publish or require GitHub login.
Check that it reports `https://registry.modelcontextprotocol.io`, because a
saved publisher login can select a different Registry. This explicit network
check stays outside ordinary `pnpm check` and CI. A successful validation does
not establish publication or namespace authorization.

### Authorize, publish, and read back

After all preparation above, present the exact release commit, complete
manifest, Registry absence or existing-entry result, online validation and
production evidence to the maintainer. Obtain explicit approval for the
GitHub OAuth/device authorization and for publishing that reviewed manifest.
Approval to merge a feature or product release does not authorize Registry
publication. These steps remain manual for subsequent versions too.

From the selected release checkout, the approved maintainer signs in with the
GitHub account that can publish under `io.github.euyuil/*`:

```sh
mcp-publisher login github --registry https://registry.modelcontextprotocol.io
mcp-publisher publish
```

Complete the device authorization privately. Keep device codes, OAuth tokens,
the publisher's local token file, and signing keys out of Git, public logs, and
issue comments. Publisher `v1.8.1` stores its login in
`~/.config/mcp-publisher/token.json`, outside the checkout; do not copy that file
into the repository. Do not place credentials in command arguments or pipe login
output into persistent logs. GitHub namespace authorization is separate from
anonymous use of the remote MCP server. No domain verification or DNS change
is needed for this workflow.

Publication is complete only after the public API returns both the exact
name/version and the expected latest entry. From the reviewed checkout:

```sh
packetrove_registry_version=$(node -p "JSON.parse(require('fs').readFileSync('server.json', 'utf8')).version")
curl --fail --silent --show-error "https://registry.modelcontextprotocol.io/v0.1/servers/io.github.euyuil%2Fpacketrove/versions/$packetrove_registry_version" -o /tmp/packetrove-registry-version.json
curl --fail --silent --show-error 'https://registry.modelcontextprotocol.io/v0.1/servers/io.github.euyuil%2Fpacketrove/versions/latest' -o /tmp/packetrove-registry-latest.json
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const expected = JSON.parse(readFileSync('server.json', 'utf8'));
for (const path of ['/tmp/packetrove-registry-version.json', '/tmp/packetrove-registry-latest.json']) {
  const entry = JSON.parse(readFileSync(path, 'utf8'));
  for (const key of ['name', 'version', 'title', 'description', 'repository', 'websiteUrl', 'icons', 'remotes']) {
    assert.deepEqual(entry.server[key], expected[key], `${path}: ${key}`);
  }
  assert.equal(entry._meta['io.modelcontextprotocol.registry/official'].status, 'active');
  assert.equal(entry._meta['io.modelcontextprotocol.registry/official'].isLatest, true);
}
console.log(`Verified ${expected.name} ${expected.version} and latest Registry metadata.`);
NODE
```

Record the exact public lookup URL, release commit, publisher version,
publication date, and readback result in the release or tracking issue. Do not
close the Registry issue while first publication or verification is pending.
If publication times out or verification fails, inspect the exact version
before retrying: a successful upload may already be immutable. Re-authenticate
privately if needed; never replace a published version with different metadata.
Use `mcp-publisher logout` when the saved publisher session is no longer needed.
