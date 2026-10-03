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

Support, privacy-policy, and terms pages are also pending. Their listing URLs
are omitted until the pages are published; the package does not link to planned
pages or claim it is ready for final submission. Review cases, a demo recording,
release notes, domain verification, and a successful OpenAI tool scan are further
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

The initial package version is `0.1.0`. Maintain this version independently of
the product, CLI, and backend version. Changes to the manifest, listing text, or
assets need an explicit package-version update and a complete replacement ZIP.
Compatible backend fixes use the normal deployment workflow without changing an
unchanged package.

Hosted tool-definition changes follow OpenAI's separate scan and review process.
Keep the server compatible with currently approved definitions until the updated
definitions become available. A successful backend deployment alone does not
establish availability in the directory.

## Format references

- [Package your plugin](https://developers.openai.com/plugins/build/plugins)
- [Upload and submit](https://developers.openai.com/plugins/deploy/submission)
- [Submission errors and final-submission limits](https://developers.openai.com/plugins/deploy/submission-errors)
