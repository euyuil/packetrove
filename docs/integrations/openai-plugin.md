# OpenAI plugin package

Packetrove maintains a portable MCP-only plugin source package in
[`plugins/packetrove`](../../plugins/packetrove). It connects to the existing
anonymous Streamable HTTP server at `https://api.packetrove.com/mcp`.

## Current status

This is an unpublished source draft. It has not been uploaded to OpenAI or
reviewed for the public directory. ZIP validation, a local build command, and a
manually triggered artifact workflow are planned as the next delivery.

The package deliberately omits `author.name` and
`extensions.com.openai.interface.developerName` until the maintainer completes
individual verification and confirms the public publishing name. The support
email is `hello@packetrove.com`.

The privacy-policy page is implemented at `/privacy`; verify its public deployment
before adding its listing URL. Support and terms pages are still pending. Their
listing URLs are omitted until the pages are published; the package does not link
to planned pages or claim it is ready for final submission. Review cases, a demo
recording, release notes, domain verification, and a successful OpenAI tool scan are further
submission prerequisites. See the current
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
