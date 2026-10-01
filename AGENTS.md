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

## Local development and commit checks

- Use the Node.js version in .node-version and the pnpm version in package.json.
  Read docs/git-checks.md when preparing a development checkout.
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

When changing setup, update this file, README.md, and docs/git-checks.md together.
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
- Use Conventional Commits. Updates to main deploy to production after automated
  validation, so run checks appropriate to the change before pushing.
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
- After an authorized push to main, verify the GitHub Actions result, including
  deployment and production checks when the workflow publishes the revision.
