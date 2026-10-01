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

## Open source practices

Packetrove is being prepared for open source release. Treat repository files,
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
