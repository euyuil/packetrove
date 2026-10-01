# Local Git checks

Packetrove provides repository-local Git hooks for credential scanning and
Conventional Commit headers. These checks run locally before a commit is
created. GitHub Actions continues to validate and deploy the application; it
does not install Gitleaks or run these local checks.

## Setup

Install the stable Homebrew release of Gitleaks once on macOS:

```sh
brew install gitleaks
```

From the repository root, install dependencies as usual:

```sh
pnpm install
```

The root `prepare` script automatically enables the hooks for this clone. An
existing global Gitleaks installation is reused. If Gitleaks is missing, setup
prints an installation reminder and still enables the hooks; dependency
installation and local development remain available, while commits fail with an
actionable message until Gitleaks is installed.

Node.js, Git, and Gitleaks must be available on `PATH` when committing, including
from a graphical Git client. Other operating systems can use a Gitleaks binary
from the [official installation instructions](https://github.com/gitleaks/gitleaks#installing).

Setup writes `core.hooksPath = .githooks` to this repository's Git configuration.
It does not change global Git settings or automatically replace existing custom
hooks. Repeated installs are safe. Custom hooks or an unsuccessful automatic
setup produce a warning without stopping dependency installation; review the
configuration before committing.

Automatic setup skips continuous integration (`CI` set to a value other than
empty, `0`, or `false`), production (`NODE_ENV=production` or
`npm_config_production=true`), and source archives without their own `.git`
metadata. It does not inspect or configure a containing repository. Git itself
does not activate these hooks when cloning; the subsequent `pnpm install` does.

If lifecycle scripts were disabled, or automatic setup needs troubleshooting,
run the explicit setup command after installing Gitleaks:

```sh
pnpm hooks:install
```

Explicit setup reports configuration conflicts or missing Gitleaks as errors.
It is available for manual repair; fresh clones normally need only `pnpm install`.

Gitleaks is a globally installed tool, with no repository-local download or
version pin. Commit checks do not download anything or require network access.
Update it when needed with `brew upgrade gitleaks`, then run
`pnpm test:git-checks` to verify the integration with the installed version.

## Checks

The `pre-commit` hook invokes Gitleaks on staged additions and changes. It scans
the version in Git's index, including partially staged files, rather than the
entire working tree or existing history. It uses the default Gitleaks rules and
disables inline `gitleaks:allow` comments. No custom patterns containing private
account identifiers are stored in the repository.

The `commit-msg` hook ignores Git editor comments when checking the first line
and scans the complete message file for credentials, including comments.
It accepts this header structure:

```text
type(scope)!: description
```

The scope and `!` are optional. Examples:

```text
feat(api): add a network tool
fix: normalize IPv6 input
docs: explain local setup
refactor(core)!: change the result schema
```

Additional types are allowed. Body paragraphs and footers are optional. This
checker validates header syntax; it does not decide whether a type describes the
change correctly or validate release semantics.

Successful scans are quiet except for the staged-check confirmation. Findings
are fully redacted in scanner output. Missing Gitleaks, scanner errors, detected
credentials, and invalid headers stop the commit. Do not bypass a failed check;
resolve it and retry. For a suspected false positive, review the staged content
and Gitleaks rule before changing any exclusions.

Useful commands:

```sh
pnpm secrets:check
pnpm commits:check
node scripts/check-commits.mjs --range origin/main..HEAD
pnpm test:git-checks
```

`secrets:check` scans the currently staged diff. `commits:check` checks headers
in reachable local history; the range form checks only the specified revisions.
These commands do not replace tests relevant to a behavior change.

## Limits

Local hooks can be skipped, disabled, or unavailable on another machine. GitHub
web edits also bypass them. They are a development safeguard, not server-side
enforcement. There is currently no credential scanner in GitHub Actions.

Pattern matching can miss credentials and does not identify every private
account name, infrastructure detail, or user input. Agents must also follow the
change-specific review requirements in [AGENTS.md](../AGENTS.md). A rejected
commit message is not displayed by the checker. If a real credential has already
been published, revoke or rotate it before arranging any history cleanup.
