# Contributing

Use the [bug report](https://github.com/euyuil/packetrove/issues/new?template=bug-report.yml)
or [feature request](https://github.com/euyuil/packetrove/issues/new?template=feature-request.yml)
form to share feedback. The website footer links directly to these forms without
attaching calculator inputs or IP results.

For substantial changes, discuss the scope in a GitHub issue. For bugs, include
reproduction steps, expected and actual results, and your environment. Use
documentation IP addresses and keep credentials and private network data out
of reports and commits.

## Getting started

Use the Node.js version in [.node-version](.node-version) and the pnpm version
declared by `packageManager` in [package.json](package.json). Local installation,
development, builds, and tests need no Cloudflare account or production credentials.

From your repository checkout:

```sh
pnpm install
```

Installation automatically enables repository-local Git hooks. Install Gitleaks
globally before committing and verify `git config --local --get core.hooksPath`
returns `.githooks`. Missing Gitleaks allows development but blocks commits;
existing custom hooks require review before setup. See [local Git checks](docs/git-checks.md)
for installation, setup repair, and the reviewed dependency build scripts.

## Run locally

Start the website with hot reload:

```sh
pnpm dev:web
```

The web script uses Vite's module runner to load the configuration and shared
TypeScript workspace imports. Pass Vite command-line options through the root
command, for example `pnpm dev:web --port 5180 --strictPort`.

Open `http://127.0.0.1:5173`. CIDR calculations and IP range conversion work
with the web development server alone. For public IP lookup, API calls, and
MCP development, use another terminal:

```sh
pnpm dev:api
```

This command builds the website assets and starts the API and MCP at
`http://localhost:8787`. The web development server sends IP lookup requests
directly to that local API without cookies. Cloudflare supplies trusted
connection metadata in production; local public IP lookup returns
`CLIENT_IP_UNAVAILABLE` without it. Tests supply documentation addresses.

Production website builds use `https://api.packetrove.com`. See
[self-hosting configuration](docs/deployment.md#browser-state-and-self-hosting)
for changing API and website origins. To build or install the CLI from source,
follow the [CLI guide](docs/integrations/cli.md#install-from-source).

## Development conventions and checks

The website uses React, Vite, and Mantine. Prefer Mantine components and layout
props, with shared visual settings in [theme.ts](apps/web/src/theme.ts). Custom
CSS handles the page background and wrapping long network values. Read the
[website language guide](docs/user-stories/003-website-languages.md) when changing
translations, routes, prerendering, or page metadata, and the
[AI tool discovery story](docs/user-stories/004-ai-tool-discovery.md) when changing
tool explanations or agent examples.

The [shared tool catalog](packages/contracts/src/tools.ts) is the source of truth
for tool identities, paths, schemas, MCP metadata, CLI availability, and examples.
Declare one canonical tool name; website paths, API paths, OpenAPI operation
identifiers, MCP names, and enabled CLI commands are derived from it. Keep tool
entry points flat and record website compatibility paths in the catalog.
Every product
tool requires website, Web API, and MCP coverage together. See
[how to add or change a tool](docs/tool-catalog.md) for the required consumers
and parity checks.

The API specification is generated from shared schemas. When changing its
source, regenerate and commit the specification:

```sh
pnpm spec:generate
```

See the [API contract](docs/api/README.md) for schema and reference details.
Development, build, and deployment commands automatically prepare the API's
static `/openapi.json` asset.

The website's MCP guide and the repository's English
[MCP integration guide](docs/integrations/mcp.md) share localized text and client
commands maintained in [mcp-guide.ts](apps/web/src/mcp-guide.ts) and the shared
language resources. Tool names, paths, and examples come from the catalog.
After changing this content or the catalog, regenerate the
repository guide:

```sh
pnpm docs:mcp:generate
```

`pnpm docs:mcp:check` rejects stale or manually edited output and runs as part
of `pnpm build` and `pnpm check`.

The remote-only MCP Registry manifest in [server.json](server.json) is generated
from the shared server identity, endpoint, and product version. After changing
that source, run `pnpm registry:generate`. `pnpm registry:check` checks the
supported manifest fields and rejects drift without network access; it also
runs during `pnpm build` and `pnpm check`. The separate official publisher
validation requires network access. See the
[manual Registry publication procedure](docs/cli-publishing.md#publish-to-the-official-mcp-registry)
for release prerequisites, authorization, and readback verification.

Run checks appropriate to your change. Pure documentation changes usually need
`git diff --check`; behavior changes need relevant tests and the full check:

```sh
pnpm check
```

This command type-checks the workspaces and scripts, validates the generated API
specification and MCP guide, builds the application and CLI, performs deployment
dry runs for both Workers, and runs the tests. It publishes nothing. See
[continuous integration](docs/continuous-integration.md#validation) for coverage.

## Pull requests

Branch from the latest `origin/main`. Use Conventional Commits and a Conventional
Commit pull request title.

All changes use a pull request targeting `main`, describing the change, checks,
and limitations. [Continuous integration](docs/continuous-integration.md) requires
`Validate project` to pass and the branch to be up to date. The maintainer
authorizes squash merging; merged changes deploy automatically.
