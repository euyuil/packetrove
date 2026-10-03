# Repository instructions

## Communication

- Use full names, descriptive terms, or names agreed with the user. Do not invent
  abbreviations or assume the user has the agent's context.
- For large tasks divided into subtasks, report changed subtask states in a table
  at the end of the next update. Include a subtask identifier, a description, and
  a status with an emoji.
- At the end of updates, mention any required user actions and potentially
  surprising findings when applicable.

## Working practices

- Prefer command-line tools and APIs. Use browser automation only when the user
  explicitly requests it or the task cannot reasonably be completed without it.
- Keep changes scoped to the user's request. Add dependencies, integrations,
  and tooling only when they are needed for the agreed work.
- Describe planned functionality as planned. Do not present unimplemented
  capabilities as available.
- Keep optional repository features disabled unless they are needed for work
  the user has requested.
- Build web interfaces with Mantine components and the shared theme. Prefer
  component props and layout components before adding custom CSS.
- Give buttons a visible background or border in their default state. Use
  Mantine Button variants such as `filled`, `light`, `outline`, or `default`.
  Avoid `subtle` and equivalent text-only button styles; users must be able to
  recognize buttons without hovering over them.
- Accept common pasted forms in multi-value text inputs. When individual values
  cannot contain commas or whitespace, accept commas, spaces, tabs, line breaks,
  and mixtures of these as separators; ignore empty entries. Share parsing rules
  across related tools and keep localized help, user stories, entry counts, and
  error locations accurate. If values can contain separators, use an unambiguous
  parser appropriate to that format.

## Tool catalog and interface coverage

- Every product tool must have a website page, a Web API endpoint, and an MCP
  tool in the same delivery. A tool is incomplete until all three interfaces
  share the same calculation or lookup implementation, contracts, examples,
  and error semantics. CLI and skill coverage must describe their actual scope.
- Maintain `packages/contracts/src/tools.ts` as the single source of truth for
  tool identities, website paths, API methods and paths, MCP names and metadata,
  CLI availability, legacy website redirects, schemas, and example references.
  Interface handlers must cover every catalog
  entry; do not maintain independent lists of tools in the website or server.
- Generate tool navigation, homepage gallery content, localized tool paths,
  CLI commands and help, API documentation, and MCP discovery and examples from
  the catalog. Keep
  localized prose in the translation resources, indexed by the catalog's page
  keys. Presentation components may specialize a preview without duplicating
  tool identities, paths, or example inputs and results.
- Homepage selection and ordering may reference catalog entries by their
  identifiers. Use shared documentation examples for previews; do not perform
  live lookups or send user inputs merely to render a gallery or documentation.
- Adding or changing a tool requires parity checks across website, API, MCP,
  generated OpenAPI, translations, documentation, and production smoke checks.

## README and documentation

- Keep the root README focused on first-time users and contributors: a short
  project description, primary capabilities, one representative working example,
  interface links, minimal local startup, and help, contribution, and license links.
- Keep capability descriptions brief. Preserve information needed to choose a
  workflow, including interface availability, installation status, privacy
  boundaries, and significant calculation or connection limitations.
- Update the README when a change affects primary capabilities, public entry
  points, installation, quick-start steps, or those essential limitations.
  Record detailed implementation changes, acceptance criteria, and release
  history in their corresponding documents rather than accumulating README sections.
- Put detailed usage and interface examples in the API and integration guides,
  behavior and acceptance requirements in user stories, complete development
  instructions in CONTRIBUTING.md and docs/git-checks.md, and deployment and
  publishing procedures in their existing guides.
- Give each detailed explanation one primary maintenance location and link to
  it from other documents. Reuse existing guides before adding new documents;
  remove redundant descriptions when their authoritative documentation exists.
- When moving or removing content, update incoming links, heading anchors, and
  references to the old documentation responsibility. Keep toolchain versions
  sourced from .node-version and package.json rather than duplicating version pins.

## Consistent tool names and flat public interfaces

- Declare each tool's unique canonical public name once, as its `id` in
  `packages/contracts/src/tools.ts`. Use descriptive lowercase words separated
  by hyphens, with at most 64 characters. Internal functions, schemas, page keys,
  and translation keys may follow their language conventions.
- Derive every public interface name from that identifier: website `/<id>`,
  API `/v1/<id>`, OpenAPI `operationId` `<id>`, MCP tool `<id>`, and, when
  implemented, CLI command `packetrove <id>`. Do not independently declare or
  override these names in catalog entries, handlers, help text, or generators.
- Keep tool entry points flat. Do not introduce category paths such as
  `/cidr/subtract` or CLI command groups such as `packetrove cidr cover`.
  API version prefixes and website locale prefixes remain supported; a localized
  tool path is `/<locale>/<id>`. Documentation and platform endpoints retain
  their separate paths.
- Record actual CLI availability in the catalog. Generate CLI discovery and
  command names from enabled entries, with exhaustive handler coverage. Naming
  consistency does not authorize adding an unavailable CLI or skill operation.
- Enforce identifier equality, flat paths, uniqueness, CLI coverage, and locale
  prefix avoidance in automated checks. New tools follow these rules immediately.

- English website pages have no language prefix, so the first path segment of
  every canonical tool URL shares a namespace with locale prefixes.
- Reserve one-, two-, and three-letter names for languages, including codes for
  languages not currently supported. Do not use tool names such as `/ip`, `/en`,
  or `/fil`. The first hyphen-separated part of a tool's first path segment must
  contain at least four characters.
- Do not use language-tag names such as `/zh-CN`, `/zh-Hans`, `/en-US`, or
  `/es-419`, regardless of case. Check longer names against registered language
  tags and the locale registry in `apps/web/src/i18n/locales.ts`; length alone
  is not a guarantee against a collision.
- API, MCP, and CLI use only canonical names; do not add legacy aliases unless
  explicitly requested. Response fields such as `ip` retain their shared
  contract names. Tool renames do not change calculation or lookup semantics.
- When renaming a website URL, update navigation, localized static entries,
  canonical and alternate links, the sitemap, tests, and documentation together.
  Record old website URLs only as explicit catalog compatibility aliases with
  permanent redirects generated for every supported locale;
  exclude them from canonical links and the sitemap. Remove a conflicting alias
  before introducing a locale prefix that would claim it.

## Pull request workflow

- Make all repository changes on a dedicated branch based on the latest
  `origin/main`. Push that branch and open a pull request targeting `main`.
  This applies to documentation, small fixes, and automated changes as well.
- Never push directly to `main`. Its active repository ruleset requires a pull
  request, blocks force pushes and deletion, and has no bypass actors, including
  repository administrators.
- Do not bypass, weaken, or disable the protection rules unless the owner
  explicitly authorizes that configuration change.
- Run checks appropriate to the change before requesting a merge, and report
  their results and any limitations in the pull request. Use a Conventional
  Commit title so it can also serve as a squash merge commit title.
- Merge a pull request only when the owner explicitly authorizes that pull
  request and all applicable repository requirements are satisfied. Permission
  to open or update a pull request is not permission to merge it.
- Use squash merging for every pull request. Squash and merge is the only
  permitted method in both the repository settings and the `main` ruleset;
  regular merge commits and rebase merging are disabled. Squash merge commit
  titles default to the pull request title.
- For an authorized GitHub CLI merge, pass `--squash` explicitly. In GitHub's web
  interface, use Squash and merge.
- The ruleset requires zero approving reviews so a sole maintainer can merge
  through a pull request. The `Validate project` check from GitHub Actions must
  pass before merging, and the pull request must be up to date with `main`.
  Wait for the required check on the latest revision; an earlier successful run
  does not satisfy the requirement.
- GitHub Actions validates pull requests targeting `main` with `pnpm check`.
  Production deployment and live checks run only after `main` is updated or
  through a manual workflow run on `main`.

## Local development and commit checks

- Use the Node.js version in .node-version and the pnpm version in package.json.
  Read docs/git-checks.md when preparing a development checkout.
- Keep dependency build scripts limited to reviewed `allowBuilds` entries in
  pnpm-workspace.yaml. Scalar's vue-demi adapter selection script is approved;
  review new scripts before enabling them.
- Gitleaks is installed globally. Check `gitleaks version` and reuse the existing
  installation across clones. On a Mac without Gitleaks, the installation command
  is `brew install gitleaks`. Do not download it on each commit.
- Run `pnpm install` for a fresh clone. Its prepare script automatically enables
  the repository-local hooks. Inspect `git config --local --get core.hooksPath`;
  this repository uses .githooks. Repeated installs are safe. Preserve existing
  custom hooks and resolve setup warnings before committing. If lifecycle scripts
  were disabled or setup needs repair, use `pnpm hooks:install`.
- Automatic setup skips continuous integration, production installs, and source
  archives without their own Git metadata. Missing Gitleaks allows dependency
  installation and local development, but blocks commits until it is installed.
- The hooks scan staged changes and commit messages for credentials and validate
  Conventional Commit headers. Resolve failed checks before committing; do not
  bypass them or expose credentials in output. Run `pnpm test:git-checks` when
  changing the hooks, their scripts, or the installed Gitleaks version.
- GitHub Actions currently validates and deploys the application without running
  Gitleaks. Credential scanning in continuous integration is deferred by the
  owner; do not add it as part of unrelated work.

When changing setup, update this file, README.md, CONTRIBUTING.md, and
docs/git-checks.md together.
Verify a fresh clone, missing Gitleaks, preserved custom hooks, and the skipped
continuous integration path.

## Open source practices

Packetrove is an open source project. Treat repository files,
Git history, GitHub Actions logs, and uploaded artifacts as public material.

- Keep credentials, private account identifiers, private infrastructure details,
  and user-supplied network data out of tracked files and commit messages. Store
  deployment credentials and private account identifiers in GitHub Actions
  Secrets, and avoid printing or transforming their values in workflow logs.
- Use documentation address ranges and neutral example hostnames in examples
  and tests. The public project name, production domain, repository URL, and
  contributor identities approved by the owner may appear in project material.
- Before making the repository public or publishing a release, review tracked
  files, reachable Git history, workflow logs, and uploaded artifacts for private
  information. Describe the scope and limits of any cleanup accurately.
- Keep the selected license consistent across the root LICENSE file, package
  metadata, API metadata, and documentation. Review the licenses and provenance
  of new dependencies and copied code, and preserve required third-party notices.
  Do not claim the project is licensed before a license has been selected.
- Local installation, builds, and tests must work without production credentials.
  Document the configuration contributors need to run and deploy their own copy.
- Use Conventional Commits. Pull requests merged into `main` deploy to production
  after automated validation, so run checks appropriate to the change before
  requesting a merge.
- Changes to repository visibility or licensing, published-history rewrites,
  force pushes, and deletion of workflow records must be within the owner's
  explicit authorization. Preserve local recovery data unless its removal is
  also authorized.

## Review by change type

Apply the checks relevant to the requested change. Read the corresponding user
story, API contract, or integration guide when its behavior is affected.

- Before editing, inspect the working tree, branch, and upstream main revision.
  Synchronize with main while preserving existing local work.
- For calculation changes, verify full input-range coverage, the largest valid
  prefix length, canonical addresses, overlap handling, and exact IPv6 counts.
  Keep the explanation of additional allowlist or blocklist coverage accurate.
- For interface changes, keep the Web API, MCP, CLI, and skill aligned with the
  shared contracts. Preserve structured errors, decimal-string address counts,
  and machine-readable CLI output. Regenerate OpenAPI from its source.
- For IP lookup changes, verify the trusted connection metadata, per-call MCP
  context, concurrent-client isolation, and no-store responses including errors.
  Never infer a user's device IP from a hosted client's exit address or print
  real lookup addresses in application or production-check logs.
- For web changes, preserve browser-local calculation where the operation can
  run locally. Review new network requests and logging for accidental disclosure
  of user inputs.
- For configuration or deployment changes, inspect credential handling and
  workflow output. Keep private identifiers out of tracked examples and check
  rules; use neutral examples and GitHub Secrets where appropriate.
- For dependency, packaging, or infrastructure changes, review necessity,
  licenses, bundled third-party notices, and additional services or costs.
- For behavior or documentation changes, compare the implementation, examples,
  and user story. Describe capabilities according to their verified status and
  consider compatibility with existing callers.
- Before committing, review the staged diff and run checks appropriate to the
  change. Pure documentation edits usually need a diff check; behavior changes
  need relevant tests. Enable the repository-local hooks described in
  docs/git-checks.md and resolve failed checks before retrying a commit. Report
  what was verified and any remaining limitations.
- After an authorized pull request merge into `main`, verify the GitHub Actions
  result, including deployment and production checks when the workflow publishes
  the revision.
