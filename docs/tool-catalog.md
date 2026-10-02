# Shared tool catalog

Every Packetrove product tool has a website page, a Web API endpoint, and an
MCP tool. All three use the same schemas, examples, calculation or lookup
semantics, and structured errors. CLI and skill coverage is documented
separately; subtraction is not currently a CLI operation.

`packages/contracts/src/tools.ts` is the authoritative catalog. It records each
tool's identifier, page key, canonical website path, API method and path,
operation identifier, MCP name and metadata, schemas, and shared example
references. Existing exported constants derive their values from the catalog
so existing imports remain compatible.

| Consumer | Catalog use |
| --- | --- |
| Website routes and sitemap | Tool paths combined with the locale registry and non-tool pages |
| Website navigation and homepage | Tool entries and localized titles and descriptions |
| Website API documentation | Endpoint summaries and example requests and results |
| Generated OpenAPI | Paths, methods, schemas, metadata, and examples |
| API and MCP | Catalog-driven registration and the same request-scoped handler map |
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

## Adding or changing a tool

1. Define its request and result schemas and documentation examples in the
   contracts workspace. Preserve exact decimal-string address counts.
2. Add its catalog entry with all three interfaces. Preserve existing public
   identifiers and check website paths against locale names.
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
