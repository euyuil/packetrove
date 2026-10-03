# OpenAI plugin package

Packetrove maintains a portable MCP-only plugin source package in
[`plugins/packetrove`](../../plugins/packetrove). It connects to the existing
anonymous Streamable HTTP server at `https://api.packetrove.com/mcp`.

## Current status

This is an unpublished package draft. Offline validation, a local ZIP builder,
and a manually triggered GitHub Actions artifact workflow are implemented.
The package has not been uploaded to OpenAI, tested as an imported OpenAI plugin,
or reviewed for the public directory.

The package deliberately omits `author.name` and
`extensions.com.openai.interface.developerName` until the maintainer completes
individual verification and confirms the public publishing name. The support
email is `hello@packetrove.com`.

The privacy-policy page is implemented at `/privacy`; verify its public deployment
before adding its listing URL. Support and terms pages are still pending. Their
listing URLs are omitted until the pages are published; the package does not link
to planned pages or claim it is ready for final submission. Review cases, a demo
recording, release notes, domain verification, and a successful OpenAI tool scan
are further submission prerequisites. See the current
[OpenAI submission requirements](https://developers.openai.com/plugins/deploy/submission)
before preparing a submission.

## Source layout

```text
plugins/packetrove/
├── plugin.json
├── mcp.json
├── LICENSE
└── assets/
    └── logo.png
```

`plugin.json` uses the portable Agent Plugins schema. OpenAI presentation fields
are under `extensions.com.openai.interface`. The package name is `packetrove`,
and its display name, service description, and website match the shared
[Packetrove identity](../../packages/contracts/src/identity.ts).

`mcp.json` declares one remote server without authentication headers or local
commands. Tools and their schemas are discovered from the hosted MCP service;
the package does not contain a tool catalog, backend, CLI, dependencies, skills,
lifecycle hooks, or app references. For tool behavior, input limits, and the
public-IP connection boundary, use the existing [MCP guide](mcp.md).

The project owner supplied `assets/logo.png`. The original transparent PNG is
used unchanged for both the logo and composer icon. The package includes a copy
of the root MIT license so its copyright and permission notice travel with the
source package.

## Validate and build locally

After the normal [development setup](../../CONTRIBUTING.md#getting-started), run:

```sh
pnpm plugin:check
pnpm plugin:build
```

`plugin:check` runs without network access or credentials and is included in
`pnpm check`. It validates the portable manifests against the
[pinned Agent Plugins 1.0.0 schemas](../../scripts/schemas/agent-plugins/README.md),
then checks the reviewed MCP-only subset, shared identity and endpoint, unified
product version, exact MIT license, listing text limits, HTTPS URLs, and local
image references. It fully decodes the square PNG, allowing 48–4096 pixels and
at most 5 MiB. The current package intentionally supports PNG only. Text files
are limited to 64 KiB each. Unexpected files, directories, symbolic links,
authentication headers, local commands, skills, hooks, and app references fail
validation.

The checker also creates an in-memory ZIP, reads every entry with strict path
and integrity checks, compares all extracted bytes with the source, and
revalidates the extracted package. Fixed entry order and ZIP timestamps make
repeated builds with the same inputs and toolchain repeatable. The original logo
bytes are preserved.

`plugin:build` requires a clean, committed Git checkout so the recorded source
revision identifies the actual inputs. It writes these three files to the
ignored `dist/openai-plugin/` directory:

```text
packetrove-openai-plugin-<product-version>-<first-12-commit-characters>.zip
SHA256SUMS
build-info.json
```

The inner ZIP contains exactly the four files in the source layout above, with
`plugin.json` and `mcp.json` at its root. Checksums and build information remain
beside it. Build information records the full source commit, version, archive
checksum, per-file sizes and checksums, image dimensions, and missing listing
fields. The written ZIP is checked again before reporting success. Choose
another output directory with `pnpm plugin:build --output-dir <directory>`;
output inside the plugin source directory is rejected.

By default, both commands accept the deliberate publisher-name and policy-URL
omissions and report them as `pendingListingFields`. To require their presence:

```sh
pnpm plugin:check --require-listing
pnpm plugin:build --require-listing
```

These commands currently fail until the five pending fields are filled:
`author.name`, `developerName`, `supportURL`, `privacyPolicyURL`, and
`termsOfServiceURL`; the last four belong to `extensions.com.openai.interface`.
Present fields are validated in either mode. Complete listing fields do not
establish public URL availability, verified ownership, accepted agreements,
review evidence, or OpenAI scan success.

## Build and download a GitHub Actions artifact

The [Build OpenAI plugin ZIP workflow](../../.github/workflows/build-openai-plugin.yml)
runs only through `workflow_dispatch` on `main`. It requires an explicit full
lowercase commit SHA that is already on `main`, contains the build tooling, and
has a successful `Validate project` job in this repository's main CI. It checks
the exact revision and latest run attempt before installing locked build
dependencies. The package version comes from that revision's unified product
metadata; there is no independent version input.

After the workflow is merged into `main`:

1. Open [the workflow in Actions](https://github.com/euyuil/packetrove/actions/workflows/build-openai-plugin.yml).
2. Select **Run workflow**, keep the branch as `main`, and enter the full source
   commit SHA. Leave **Require complete publisher names and listing URLs** off
   for a draft; enable it after those fields are complete.
3. Open the successful run. Its summary records the source revision, version,
   checksum, pending fields, and a download link. The same download is under
   **Artifacts**, named `packetrove-openai-plugin-<version>-<commit-prefix>`.
4. Download and extract the GitHub artifact ZIP. It contains the inner plugin
   ZIP, `SHA256SUMS`, and `build-info.json`. Upload only the inner ZIP to OpenAI
   when submission is authorized. Uploading the outer artifact would give the
   package the wrong root layout.

The equivalent GitHub CLI commands are:

```sh
gh workflow run build-openai-plugin.yml --repo euyuil/packetrove --ref main \
  -f commit=<full-40-character-SHA> -F require_listing=false
gh run list --repo euyuil/packetrove --workflow build-openai-plugin.yml \
  --event workflow_dispatch
gh run download <run-id> --repo euyuil/packetrove --dir <download-directory>
```

From the extracted artifact directory, run `shasum -a 256 -c SHA256SUMS` on macOS
or `sha256sum -c SHA256SUMS` on Linux, then compare the full source commit in
`build-info.json` with the intended revision. Artifacts are retained for 30 days;
keep the ZIP and provenance with the submission record if needed longer.

This workflow uses read-only repository and Actions permissions and needs no new
repository secrets or production credentials. Artifact contents are public
project material. It does not deploy services, attach assets to product releases,
or upload, submit, or publish to OpenAI. Pull requests run the offline package
checks through normal CI; they do not generate downloadable plugin artifacts.

## Maintainer connection smoke checks

For the public service, run the existing production smoke command:

```sh
pnpm smoke https://packetrove.com https://api.packetrove.com
```

It checks anonymous modern and legacy Streamable HTTP discovery, all catalog
tools, documentation-address calculations, invalid inputs, Origin handling, and
public-IP response shape and `no-store` headers. It reports pass/fail without
printing observed IP addresses. The local Workers
[MCP tests](../../apps/worker/test/mcp.test.ts) cover the same contracts during
`pnpm check`. Package tests additionally check that the packaged connection is
exactly the shared production endpoint.

Before submission, test the imported package in the intended OpenAI client using
the current [connection instructions](https://developers.openai.com/plugins/deploy/connect-chatgpt).
Confirm anonymous discovery exposes `cidr-cover`, `cidr-subtract`,
`range-to-cidrs`, and `public-ip`, then run the three manifest starter prompts.
Compare their answers with the [MCP guide examples](mcp.md#use-this-calculator-through-mcp),
including exact additional coverage and decimal-string counts. Try malformed
input and mixed address families and confirm errors are explained without
inventing results. Check public-IP behavior only when needed, keeping the observed
address out of public logs and recordings and explaining the hosted-client
connection boundary. Record the client, date, source revision, and outcome.
Direct MCP smoke checks do not establish successful OpenAI package import or
target-client acceptance.

## Manual submission runbook

Follow the current
[OpenAI submission procedure](https://developers.openai.com/plugins/deploy/submission).
These actions require the owner's separate authorization:

1. Complete individual verification in the owning OpenAI organization/project.
   Confirm the displayed publisher name, then fill `author.name` and
   `extensions.com.openai.interface.developerName`.
2. Publish and check support, privacy, and terms pages, keeping the confirmed
   `hello@packetrove.com` contact. Fill their actual HTTPS listing URLs. Build
   from a reviewed main revision with `require_listing` enabled.
3. Upload the verified inner ZIP, resolve metadata findings, connect the anonymous
   MCP endpoint, complete the portal's domain challenge, and inspect the tool scan.
4. Prepare five positive and three negative cases, a reviewer-accessible demo
   recording, and release notes. Use documentation addresses. Supply information
   in editable review fields; fields managed by a ZIP require a reviewed package
   update. The current validator accepts listing fields only, so adding packaged
   review/publication objects requires extending that reviewed subset.
5. The owner completes required attestations, submits for review, resolves
   feedback, and chooses when to publish the approved version.

Keep private verification and reviewer information outside public artifacts.
Save the source commit and checksum with the submission outcome. All identity,
policy-page, review, domain-verification, and OpenAI scan prerequisites remain
pending unless independently completed and recorded.

## Package version

The plugin uses the same product version as the root `package.json`, the
workspaces, and the MCP Registry manifest. The existing release-please product
release pull request updates `plugin.json` together with those files; plugin
features and fixes contribute to that release. Release validation rejects a
plugin version that differs from the release tag. See the authoritative
[product release policy](../cli-publishing.md#release-policy) for version rules.

ZIP generation and OpenAI submission remain separate maintainer actions. A
product release updates the source manifest without automatically uploading or
publishing a plugin. When submitting changed manifest fields, listing text, or
assets, use a complete replacement ZIP from a reviewed product revision and
record its source commit. A published OpenAI listing can remain on an earlier
product version until the maintainer submits an update.

Compatible backend fixes continue through the normal deployment workflow.
The remote endpoint can contain newer unreleased changes; the package version
identifies its source metadata, not an executable snapshot of that service.

Hosted tool-definition changes follow OpenAI's separate scan and review process.
Keep the server compatible with currently approved definitions until the updated
definitions become available. A successful backend deployment alone does not
establish availability in the directory.

## Format references

- [Package your plugin](https://developers.openai.com/plugins/build/plugins)
- [Upload and submit](https://developers.openai.com/plugins/deploy/submission)
- [Submission errors and final-submission limits](https://developers.openai.com/plugins/deploy/submission-errors)
