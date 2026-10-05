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

The website implements localized support, terms, and privacy pages at `/support`,
`/terms`, and `/privacy`. Their canonical HTTPS URLs are included in the source
manifest. Verify that the reviewed revision has deployed and all three public
pages are accessible before uploading or using those URLs in a submission.
Source validation does not establish public availability or publisher verification.
The source manifest includes five positive and three negative review cases.
These are prompts and expected behavior, not evidence of OpenAI client acceptance.
Executing those cases in the intended clients, a demo recording, release notes,
domain verification, and a successful OpenAI tool scan are further submission
prerequisites. See the current
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
are under `extensions.com.openai.interface`, and review cases are under the
sibling `extensions.com.openai.review.test_cases` object. The package name is
`packetrove`, and its display name, service description, and website match the shared
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
image references. When review cases are declared, this repository's supported
subset requires complete lists of exactly five positive and three negative
cases. Every case requires supported nonempty `description` and `prompt` text;
positive cases also require `tools_triggered` and `expected_behavior`.
Descriptions are limited to 4000 characters. Tool names must match the shared
catalog, with multiple names separated by commas. Negative cases may omit tool
names or expected behavior; the source cases include expected behavior to make
clarification and fallback outcomes explicit. Attachments, demo URLs, publication
metadata, reviewer credentials, and other unreviewed fields are outside the
current supported subset. It fully decodes the square PNG, allowing 48–4096 pixels
and at most 5 MiB. The current package intentionally supports PNG only. Text files
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

By default, both commands accept the deliberate publisher-name omissions and
report them as `pendingListingFields`. To require complete listing fields:

```sh
pnpm plugin:check --require-listing
pnpm plugin:build --require-listing
```

These commands currently fail until the two pending publisher fields are filled:
`author.name` and `extensions.com.openai.interface.developerName`.
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

## Optional feedback and hosted-tool review

The optional MCP support operation `submit-feedback` is disabled by default.
Its schema, privacy boundary, consent instruction, write annotations, and
non-idempotent delivery behavior are documented in the
[feedback story](../user-stories/009-agent-feedback.md) and
[MCP guide](mcp.md#optional-agent-feedback). It adds no product entry point.

Before exposing this operation to a published OpenAI plugin, review the deployed
tool definition through OpenAI's hosted-tool scan/review process; publishing a
new ZIP alone does not approve a changed remote tool. The source package is
still an unpublished draft, and this implementation does not claim directory
approval. Preserve compatibility for existing calculations and lookups.

In the intended client, verify that a user-supplied/approved report can be sent
on request, newly composed content is shown for authorization, and unrelated
conversations or ordinary errors produce no feedback call. Use only synthetic
examples. Verify that sensitive raw context is not attached and that timeouts,
cancellation, and uncertain delivery do not trigger an automatic resend.
Server-side SDK tests cannot establish model consent behavior. Perform writing
acceptance and private cleanup using the
[deployment procedure](../deployment.md#optional-agent-feedback); keep private
report/store/log evidence out of the public plugin artifact.

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

## Review cases and execution records

Maintain the English review prompts and expected behavior in
[`plugin.json`](../../plugins/packetrove/plugin.json), under
`extensions.com.openai.review.test_cases`. The positive list covers IPv4 covering
CIDRs with additional coverage, exact subtraction for an AllowedIPs draft,
inclusive range conversion, exact IPv6 counts, and the public-IP connection
boundary. The negative list covers mixed address families, reversed endpoints,
and an unsupported firewall change. The list order identifies cases as P1–P5
and N1–N3 in execution records.

The cases travel inside the eventual plugin ZIP. OpenAI imports them as read-only
review information; change the source and upload a reviewed replacement ZIP to
update them. Review information belongs alongside `interface`, not inside it.
OpenAI accepts partial draft lists on upload; the repository validator deliberately
requires complete lists whenever this object is supplied. See the authoritative
[case fields and import behavior](https://developers.openai.com/plugins/deploy/submission#configure-onboarding-review-and-publication).

Run each case in a new conversation with Packetrove enabled in the intended
OpenAI client. Positive cases must select the expected MCP tool and match its
observable result; a manually calculated answer alone does not pass. The first
two negative cases may clarify before calling a tool or correctly explain the
specified structured error after a call. The unsupported firewall action must
not be reported as completed. For P5, check the response shape privately and
report the observed address family and connection boundary without displaying
the actual IP. Redact that IP from recordings, including expanded tool output.

Keep execution evidence separate from the package. For each run, record the
client and available version, UTC date, full source revision, package checksum
when available, and each case's identifier, actual tool calls and arguments,
observed result, pass/fail outcome, and conversation or redacted recording link.
Use the documentation inputs from the cases and exclude private network inputs
and actual lookup IPs. Do not mark a case as passed until it has been executed in
the recorded client. Offline manifest checks and local calculation checks do not
establish client acceptance; OpenAI client execution of these source cases is
pending.

## Manual submission runbook

Follow the current
[OpenAI submission procedure](https://developers.openai.com/plugins/deploy/submission).
These actions require the owner's separate authorization:

1. Complete individual verification in the owning OpenAI organization/project.
   Confirm the displayed publisher name, then fill `author.name` and
   `extensions.com.openai.interface.developerName`.
2. Check the deployed support, privacy, and terms pages, their canonical listing
   URLs, publisher information, and the confirmed `hello@packetrove.com` contact.
   Review the terms and correspondence policy before approving their publication.
   Build from a reviewed main revision with `require_listing` enabled.
3. Upload the verified inner ZIP, resolve metadata findings, connect the anonymous
   MCP endpoint, complete the portal's domain challenge, and inspect the tool scan.
4. Execute the five positive and three negative manifest cases and retain
   separate execution evidence. Prepare a reviewer-accessible demo recording and
   release notes. Imported cases are managed by the ZIP and require a reviewed
   replacement package to change. Supply the demo URL and release notes in the
   editable portal fields; packaging those fields requires extending the
   validator's reviewed subset first.
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
