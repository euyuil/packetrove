# Publishing the CLI to npm

The CLI is prepared for public distribution as `@packetrove/cli`, with the
`packetrove` executable. Its first npm release is pending. The workspace root,
core, contracts, website, and Worker packages remain private. The CLI bundles
its runtime dependencies; users do not need the other workspace packages.

## First release

1. Sign in to your personal npm account, verify its email address, and enable
   two-factor authentication for interactive publishing.
2. Create the `packetrove` npm organization if that name is available. Choose
   the free public-packages plan and ensure your account has permission to
   publish packages under its scope. A personal npm login alone does not grant
   access to `@packetrove`.
3. Have the owner authorize and squash-merge the release preparation pull
   request. Wait for the merged revision's required validation, deployment, and
   production checks. Use that revision from `main` for the release.
4. Before publishing, review tracked files, reachable Git history, workflow
   logs, and uploaded artifacts for private information as required by
   [AGENTS.md](../AGENTS.md). Review the actual package contents, including the
   source map, README, root license, and third-party notices. Report the scope
   and limits of the review.
5. Using the Node.js and pnpm versions pinned by the repository, install locked
   dependencies and validate before creating the package:

   ```sh
   pnpm install --frozen-lockfile
   pnpm check
   pnpm --filter @packetrove/cli pack --pack-destination /tmp/packetrove-artifacts
   npm publish /tmp/packetrove-artifacts/packetrove-cli-0.1.0.tgz --dry-run --json
   ```

6. After explicit authorization for the first npm release, publish that reviewed
   archive from the account's own terminal. Complete npm's browser or 2FA
   prompts:

   ```sh
   npm login --registry=https://registry.npmjs.org/
   npm publish /tmp/packetrove-artifacts/packetrove-cli-0.1.0.tgz --access public --registry=https://registry.npmjs.org/
   ```

   This first interactive release establishes the package and its settings.
   It does not have GitHub Actions provenance. Later releases can use the
   trusted-publisher workflow below. The example archive name assumes version
   `0.1.0`; use the actual reviewed version from `packages/cli/package.json`.

7. Verify the published version from an empty temporary directory, so a local
   workspace executable cannot satisfy the command:

   ```sh
   mkdir -p /tmp/packetrove-npm-verification
   cd /tmp/packetrove-npm-verification
   npm view @packetrove/cli@0.1.0 version --registry=https://registry.npmjs.org/
   npm exec --yes --ignore-scripts --registry=https://registry.npmjs.org/ --package=@packetrove/cli@0.1.0 -- packetrove cidr cover 203.0.113.1 203.0.113.2 203.0.113.6 --json
   ```

   Expect `203.0.113.0/29`, with input, covered, and additional address counts of
   `"3"`, `"8"`, and `"5"`. Use documentation addresses for release checks;
   do not log an actual public IP lookup result. Update the release-pending
   wording in the README and integration guides through a follow-up pull request
   after the publication is verified.

Public scoped packages require `--access public`; the CLI also records this
setting in `publishConfig`. Package name and version combinations cannot be
reused after publication. See npm's [scoped publishing guide](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)
and [publish command](https://docs.npmjs.com/cli/v11/commands/npm-publish/).

## Configure trusted publishing

After the first release, open the package settings on npmjs.com, add a trusted
publisher, and select GitHub Actions. Configure these public repository fields:

| Field | Value |
| --- | --- |
| Organization or user | `euyuil` |
| Repository | `packetrove` |
| Workflow filename | `publish-cli.yml` |
| Environment name | Leave empty; the workflow does not use a GitHub environment |
| Allowed actions | Allow direct publishing with `npm publish` |

Allowing staged publication alone will not permit this workflow's direct
`npm publish` command. npm does not validate the configuration when it is saved;
the first workflow release is the live verification of this setup.

The workflow uses a GitHub-hosted runner, npm CLI 11.5.1 or later, and the
job's `id-token: write` permission. No npm token or private account identifier
is committed or configured as a workflow input. Public releases from this
public repository receive automatic provenance when trusted publishing is
configured successfully. See the [npm trusted-publishing guide](https://docs.npmjs.com/trusted-publishers/).

## Later releases

1. Update `packages/cli/package.json` to a new stable semantic version through a
   pull request. Run appropriate checks and obtain the owner's merge approval.
   The CLI version is independent of website deployments and other workspace
   versions. This workflow publishes stable releases under the `latest` tag.
2. Wait for the merged revision's validation and production workflow, complete
   the public-material and package-content review, and obtain authorization to
   publish that specific npm version.
3. Open **Actions → Publish CLI to npm → Run workflow**, select `main`, and enter
   the exact CLI version. Alternatively, use:

   ```sh
   gh workflow run publish-cli.yml --repo euyuil/packetrove --ref main -f version=0.1.1
   ```

4. Inspect the workflow result. It validates the branch, requested version, and
   npm CLI support, runs `pnpm check`, creates the archive, checks that `main`
   still points to the validated revision, and publishes with OIDC. It then
   installs the exact published version in an isolated directory and verifies
   a CIDR calculation using documentation addresses.

The workflow is manual; merging a pull request or deploying the website does
not trigger an npm release. It neither bumps versions nor changes repository
refs. A superseded main revision, version mismatch, or failed validation stops
publication. If publication succeeds but verification fails, the npm version
may already be public; inspect the registry before retrying. Do not try to
overwrite an existing version. If `main` advances after the final revision
check, the already validated revision may still publish.
