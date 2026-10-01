# Contributing

For substantial changes, discuss the scope in a GitHub issue. For bugs, include
reproduction steps, expected and actual results, and your environment. Use
documentation IP addresses and keep credentials and private network data out
of reports and commits.

Follow the [README development instructions](README.md#development) for the
pinned toolchain and setup; local development needs no production credentials.
`pnpm install` automatically enables Git hooks. Install Gitleaks globally before
committing; see [local Git checks](docs/git-checks.md).

Branch from the latest `origin/main`. Use Conventional Commits and a Conventional
Commit pull request title. Run checks appropriate to your change: usually
`git diff --check` for documentation, relevant tests and `pnpm check` for behavior.

All changes use a pull request targeting `main`, describing the change, checks,
and limitations. [Continuous integration](docs/continuous-integration.md) requires
`Validate project` to pass and the branch to be up to date. The maintainer
authorizes squash merging; merged changes deploy automatically.
