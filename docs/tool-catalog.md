# Shared tool catalog

Every Packetrove product tool has a website page, a Web API endpoint, and an
MCP tool. All three use the same schemas, examples, calculation or lookup
semantics, and structured errors. CLI coverage is documented
separately; subtraction, IP range conversion, and certificate checks are not
currently CLI operations.

`packages/contracts/src/tools.ts` is the authoritative catalog. It records each
tool's identifier, page key, canonical website path, API method and path,
operation identifier, MCP metadata, CLI availability, website compatibility
paths, removed interface names, schemas, and shared example references.
Existing exported constants derive their values from the catalog
so existing imports remain compatible.

## Support operations

`operationCatalog` classifies entries as `product` or `support` and owns their
canonical identities, schemas, examples, and MCP metadata. `tools` and
`toolCatalog` project product entries for website, API, OpenAPI, and CLI.
`mcpOperations` includes both kinds; `supportOperations` projects support.
Identifiers remain unique across both kinds.

Optional `submit-feedback` has an independent write executor and private
storage contract. It has no website page, API endpoint, CLI command, or result
resource link. Disabled installations omit it from discovery. Product tools
keep their shared handlers and parity checks. The MCP guide explains conditional
availability; the [feedback story](user-stories/009-agent-feedback.md) defines
consent, delivery, and privacy acceptance.

## One public name per tool

Declare a tool's canonical name once as its `id`. The catalog derives its
website path as `/<id>`, API path as `/v1/<id>`, OpenAPI `operationId` and MCP
name as `<id>`, and an enabled CLI command as `packetrove <id>`. Tool entry
points are flat; only website locale prefixes and the API version prefix are
added. Documentation and platform endpoints have their own paths.

Use descriptive lowercase words separated by hyphens, at most 64 characters,
with at least four characters before the first hyphen. Check names against
registered language tags and the website locale registry. Internal page keys,
translation keys, TypeScript functions, and schemas retain their own conventions.
Catalog definitions cannot override derived interface names.

The `cli` declaration records implemented coverage. Enabled entries drive CLI
discovery, usage, and an exhaustive handler map; disabled entries expose no
command. Subtraction, IP range conversion, and certificate checks remain
unavailable in the CLI.
Naming changes do not expand the CLI's calculation scope.

## Migration to flat names

| Tool | Canonical name | Previous website path | Removed API path | Removed MCP name | Removed CLI command |
| --- | --- | --- | --- | --- | --- |
| Smallest covering CIDR | `cidr-cover` | `/cidr` | `/v1/cidr/cover` | `smallest_covering_cidr` | `packetrove cidr cover` |
| CIDR subtraction | `cidr-subtract` | `/cidr/subtract` | `/v1/cidr/subtract` | `subtract_cidrs` | No previous CLI operation |
| Current public IP | `public-ip` | `/ip` | `/v1/ip` | `get_public_ip` | `packetrove ip` |

Old website paths and their trailing-slash and `.html` forms return permanent
301 redirects to the canonical path in the same locale, preserving query
strings. Compatibility paths are declared in the catalog and excluded from
canonical metadata and the sitemap.

Removed API paths return the structured `NOT_FOUND` error without a redirect.
Removed MCP names are absent from discovery and rejected on calls. Removed CLI
commands return a structured `INVALID_INPUT` error with `--json`. These
interfaces have no compatibility aliases. Update saved API requests, MCP calls,
CLI scripts, and OpenAPI operation references; the new operation identifiers are
the canonical tool names. Request and result fields and calculation semantics
are unchanged. Previously published npm versions keep their original commands;
use a release containing this migration or build from source as described in the
[CLI guide](integrations/cli.md).

## Removal of the repository-provided skill

The repository-provided `packetrove-cidr-cover` skill is removed from this source
revision. Its workflow and maintenance value need a separate design decision
before a future skill is introduced. This is a scope decision, without a claim
about measured usage. Website, Web API, MCP, and CLI operations retain their
existing calculations and contracts.

The former `skills/packetrove-cidr-cover/SKILL.md` and
`docs/integrations/skill.md` GitHub paths no longer resolve on `main` after this
change is merged. The removed guide instructed users to copy the skill directory
and provide an existing CLI or MCP connection. Use the
[CLI guide](integrations/cli.md) for local covering-CIDR calculations, or the
[MCP guide](integrations/mcp.md) to connect an agent to the remote tools. CLI
calculations run offline; remote MCP calculations send inputs to the server.

This removal does not update or delete skill files previously copied into an
agent client. Historical Git revisions and releases retain the files they
included; third-party listings are not changed.

## Catalog consumers

| Consumer | Catalog use |
| --- | --- |
| Website routes and sitemap | Tool paths combined with the locale registry and non-tool pages |
| Website navigation and homepage | Tool entries and localized titles and descriptions |
| Website API documentation | Endpoint summaries and example requests and results |
| Generated OpenAPI | Paths, methods, schemas, response formats, status descriptions, and examples |
| API and MCP | Product registration and shared handlers; enabled MCP support uses its own write executor |
| CLI | Enabled catalog entries, derived commands and usage, and exhaustive handler coverage |
| MCP guide and tool pages | Catalog-derived examples rendered by `ToolMcpSection` and the generated repository guide |
| Tests and production smoke checks | Actual endpoint, discovery, and documentation coverage against the catalog |

`websitePages` combines the catalog's page paths with the locale registry.
`apps/web/scripts/page-entries.ts` supplies virtual Vite HTML entries from the
single `apps/web/index.html` template, setting each page's language and metadata.
Development serves the same entries for direct and localized routes; production
builds preserve the static output paths and prerender every page. Do not copy
HTML files when adding a tool or locale. Entry collisions fail explicitly.
The separate `404.html` remains the static error fallback.

The homepage gallery curates references to catalog entries in `featuredTools`
inside `apps/web/src/ToolGallery.tsx`. It uses the catalog's shared examples for
previews and has a stable initial order. New tools enter interface discovery
and navigation through the catalog; homepage inclusion is a separate selection.
See the [homepage user story](user-stories/005-home-tool-gallery.md).

Localized prose remains in `apps/web/src/i18n/translations`, indexed by the catalog's page keys. The catalog contains no React
components or browser state. Tool-specific views can choose an appropriate
presentation while consuming shared facts and examples.

Each tool's `api.response` declares its successful JSON description, optional
headers, and optional plain-text formatter. OpenAPI derives text examples from
that formatter and the shared results; the Worker uses the same formatter and
headers, including on error responses. `api.errors` supplies domain status
descriptions, while the generator adds common transport failures. JSON-only GET
tools need no special generator branch. API tags also come from tool metadata.

Tool-owned modules in `apps/web/src/tools` provide static preview components and
localized API/MCP example guidance. Register them in the exhaustive maps in
`ToolPreview.tsx` and `tool-documentation.ts`. The pure documentation map does
not load preview components. Keep prose in translation resources and derive
interpolation values from the catalog's examples and shared limits. Previews
must not import complete calculation pages or initiate live lookups. Shared
gallery and documentation components traverse these declarations without
branches for individual tools.

Tool pages share `ToolPageHeader` for catalog-indexed titles and descriptions,
and `ToolPanel` for labelled input and result sections. Pass the tool's localized
processing notice to the header and its fields or result content to the panel.
`ToolExamples` and `ToolExampleCard` provide the shared example layout; keep
example inputs and results sourced from the catalog. Calculation, lookup,
validation, draft, and result state belong to each tool's view. Each calculation
page declares its draft initializer and uses `useToolDraft`; `ToolDraftProvider`
retains drafts only within the current `App` instance. Switching tools or
languages preserves drafts, results, and errors without storage or recalculation.
A reload or a new application instance starts fresh. Register a dynamic loader for the page component
in the exhaustive map in `apps/web/src/ToolPageView.tsx`; the application shell
does not declare tool-specific state.

`page-resources.ts` prepares the requested page and its locale before rendering.
Tool page loaders are exhaustive, and cached component identities stay stable
across language changes. `i18n/locale-resources.ts` loads English fallback and
the selected locale; the application installs translations into its own i18next
instance. A browser-language suggestion prepares only its suggested locale
after hydration. Both resource consumers use the literal dynamic imports in
`i18n/translation-loaders.ts`. Complete `i18n/resources.ts` imports are reserved for build
scripts and tests, never the browser entry graph.

Navigation retains the current page while resources load. Only the latest
successful navigation commits its URL, language, and metadata. Failed loads
show localized retry controls without discarding drafts; failed history events
restore the committed URL and retry by replacing that entry. Prerendering awaits
the same preparation before rendering complete static content. Initial load
failures keep that content readable, using retry text embedded in the HTML.
The production manifest check enforces deferred page and locale modules, and
loading tests cover races, history, failures, retries, and retained drafts.

The shared `InputIssue` contract accepts tool-defined `field`, `list`, and
`path` locations. `inputIssuePath` resolves explicit paths before legacy
locations, including an empty path for the whole request. Each tool view maps
only recognized locations to its own inputs; unknown or deeper paths remain
general errors. `ToolError` accepts a tool-owned detail type for local error
reasons and required translation parameters. These details never enter the
public response. Keep domain reason unions and their translation resolvers
with the domain modules, rather than extending the shared error class or a
central tool switch. Existing tools preserve their public issue shapes.

The Worker handler map in `apps/worker/src/tools.ts` derives each result type
from that tool's catalog output schema and requires exhaustive coverage. Handlers
accept unknown input and return a synchronous result or a Promise of that result.
`createToolExecutor` provides the awaited execution boundary used by both API and
MCP; it does not replace each domain's existing input validation. The browser's
local CIDR calculations and the CLI use the synchronous core directly. Certificate
checks use the asynchronous `@packetrove/core/certificate-bundle` subpath in the
browser and Worker, without loading the certificate runtime on other tool pages.
Non-Error handler rejections become a fixed internal Error without converting
their payload to text, so API and MCP preserve their structured error responses.

`tool-context.ts` snapshots only edge connection addresses and an AbortSignal
for each invocation. It does not forward arbitrary headers, authorization data,
or the raw Request to handlers. Missing connection metadata does not prevent
local calculations; only the public-IP handler validates those addresses. MCP
creates the context inside the tool callback, using its current HTTP request
and its per-call SDK signal. HTTP and call cancellation are combined without
sharing cancellation controllers or storing client context globally.

Handlers must pass the signal to asynchronous I/O and clean up their work.
Execution checks cancellation before starting and after either completion or
rejection, so cancelled calls cannot return late successes. An internal fixed
error hides arbitrary abort reasons; when a response remains possible, API uses
the existing generic INTERNAL_ERROR with HTTP 500 and MCP uses the existing
sanitized tool error. Expected cancellation is not logged. This does not
interrupt already-running synchronous CPU work, impose a global timeout, or
retry automatically. Certificate checks pass the signal and stop between
parsing/crypto operations; an already-running Web Crypto operation completes
before cancellation is observed. Their scope is maintained in the
[certificate story](user-stories/008-certificate-bundle.md).

Stateless legacy MCP creates a new server for each POST. The legacy SDK's
separate cancellation notification cannot locate another POST's running call;
cancelling only that client's local wait may leave the server operation running.
HTTP request abort and the SDK callback signal are supported, but end-to-end
cancellation by every legacy client is not guaranteed. Tests separately verify
modern HTTP cancellation, direct legacy HTTP abort, and isolated per-call SDK
cancellation on a shared server, waiting for handler cleanup in each case.
Test dependencies are supplied through executor and application instances,
without mutable global hooks or extra catalog entries.

The website MCP guide and `docs/integrations/mcp.md` consume the shared content
model in `apps/web/src/mcp-guide.ts`. It combines catalog entries and examples
with localized prose and client commands. Generate the English repository
guide with `pnpm docs:mcp:generate`; do not edit that output manually.
`pnpm docs:mcp:check` rejects drift during builds and the full project check.

Service identity is separate from tool discovery. `packages/contracts/src/identity.ts`
owns the Packetrove server name, display title, description, canonical website,
and icon metadata. The MCP server combines these with `PACKETROVE_VERSION` from
the contracts package's release manifest. The website and maintained MCP guide
reuse this identity; individual tool identities remain in the tool catalog.
Clients choose which optional service fields to display, so protocol acceptance
alone does not establish visual presentation.
The generated technical guide records dated manual client observations;
maintain those English verification notes in `scripts/mcp-guide-markdown.ts`.

Each entry's `mcp.resultLinkDescription` also supplies the optional successful
result link. `defineTool` derives its URI from the shared public website origin
and canonical tool identifier, with the catalog title and `text/html` metadata.
Keep this destination independent of inputs, results, connection metadata, and
request language; the default is the English tool page. The server and generated
guide consume the same link. See the [MCP guide](integrations/mcp.md) for result
decoding and the [discovery story](user-stories/004-ai-tool-discovery.md#result-link-compatibility-observations)
for observed compatibility and presentation limits.

## Adding or changing a tool

1. Define its request and result schemas and documentation examples in the
   contracts workspace. Preserve exact decimal-string address counts.
2. Add its catalog entry with one canonical name and all three interfaces.
   Derive public names, record actual CLI availability, and check names against
   locale prefixes and registered language tags. Declare any authorized website
   compatibility paths separately from removed API, MCP, and CLI names.
3. Implement the shared calculation or lookup. Add the server handler to the
   exhaustive `ToolPage` map in `apps/worker/src/tools.ts`, and the website view
   to the exhaustive map in `apps/web/src/ToolPageView.tsx`. Reuse the shared page header,
   panels, and example components. Use only current-request connection metadata
   for lookups.
4. Add the title, homepage description and link, API summary, and MCP guidance
   for every supported locale. Descriptions must match the actual semantics
   and explain local versus remote input processing.
5. Update the user story and integration guidance at their maintained sources.
   Change shared MCP guide content and translations rather than generated
   Markdown. Homepage selection may reference catalog identifiers without
   copying definitions or examples.
6. Run `pnpm spec:generate`, `pnpm docs:mcp:generate`, and `pnpm check`. Verify
   actual API responses, MCP discovery and calls, localized prerendered content,
   and example correctness.

Documentation and homepage previews use documentation address ranges. They
must not make live lookups or upload user inputs. Remote API and MCP calls are
explicit uses of a tool; browser-local calculations remain local.
