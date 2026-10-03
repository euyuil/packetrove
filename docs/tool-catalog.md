# Shared tool catalog

Every Packetrove product tool has a website page, a Web API endpoint, and an
MCP tool. All three use the same schemas, examples, calculation or lookup
semantics, and structured errors. CLI and skill coverage is documented
separately; subtraction and IP range conversion are not currently CLI operations.

`packages/contracts/src/tools.ts` is the authoritative catalog. It records each
tool's identifier, page key, canonical website path, API method and path,
operation identifier, MCP metadata, CLI availability, website compatibility
paths, removed interface names, schemas, and shared example references.
Existing exported constants derive their values from the catalog
so existing imports remain compatible.

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
command. Subtraction and IP range conversion remain unavailable in the CLI. Naming changes do not
expand the CLI or skill's calculation scope.

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

## Catalog consumers

| Consumer | Catalog use |
| --- | --- |
| Website routes and sitemap | Tool paths combined with the locale registry and non-tool pages |
| Website navigation and homepage | Tool entries and localized titles and descriptions |
| Website API documentation | Endpoint summaries and example requests and results |
| Generated OpenAPI | Paths, methods, schemas, metadata, and examples |
| API and MCP | Catalog-driven registration and the same request-scoped handler map |
| CLI | Enabled catalog entries, derived commands and usage, and exhaustive handler coverage |
| MCP guide and tool pages | Catalog-derived examples rendered by `ToolMcpSection` and the generated repository guide |
| Tests and production smoke checks | Actual endpoint, discovery, and documentation coverage against the catalog |

The homepage gallery curates references to catalog entries in `featuredTools`
inside `apps/web/src/ToolGallery.tsx`. It uses the catalog's shared examples for
previews and has a stable initial order. New tools enter interface discovery
and navigation through the catalog; homepage inclusion is a separate selection.
See the [homepage user story](user-stories/005-home-tool-gallery.md).

Localized prose remains in `apps/web/src/i18n/resources.ts` and the language
files, indexed by the catalog's page keys. The catalog contains no React
components or browser state. Tool-specific views can choose an appropriate
presentation while consuming shared facts and examples.

Tool pages share `ToolPageHeader` for catalog-indexed titles and descriptions,
and `ToolPanel` for labelled input and result sections. Pass the tool's localized
processing notice to the header and its fields or result content to the panel.
`ToolExamples` and `ToolExampleCard` provide the shared example layout; keep
example inputs and results sourced from the catalog. Calculation, lookup,
validation, draft, and result state belong to each tool's view.

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
   to the exhaustive map in `apps/web/src/App.tsx`. Reuse the shared page header,
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
