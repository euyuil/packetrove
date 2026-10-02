# Website languages

## User story

As a user of Packetrove, I want to read the website in English or Simplified
Chinese and switch languages without losing my current calculation, so that I
can understand network results and share a link in my preferred language.

## First-phase scope

- Translate the homepage, navigation, CIDR calculator, public IP tool, API
  documentation shell, loading states, clipboard feedback, accessible labels,
  and the application-rendered not-found page.
- Keep existing English URLs. Serve Chinese at `/zh/`, `/zh/cidr`, `/zh/ip`,
  and `/zh/docs/api`, with the locale identifier `zh-Hans`.
- Let the URL determine the language. Provide a header dropdown with `English`
  and `简体中文` entries, without browser-language redirects or persistent storage.
  Show the current language on its button and mark the current menu entry.
  Precede English with a British flag and Simplified Chinese with a Chinese flag.
  Keep flags decorative and language names accessible. Support keyboard opening,
  arrow-key navigation, selection, and Escape to close and return focus.
- Switch the current page in place, preserving calculator input, results, and
  validation errors. Retranslate stored errors and clipboard feedback.
- Keep an ongoing or completed public IP lookup when switching languages.
  Only opening the tool or explicitly refreshing it initiates a lookup.
- Keep CIDR calculations local. Do not upload or persist calculator input or
  IP results as part of language selection.
- Format displayed counts for the selected language using `Intl.NumberFormat`.
  Parse decimal-string address counts as `BigInt` to retain exact IPv6 values.
- Include translated titles, descriptions, and social metadata in static HTML
  entries. Use self-referencing canonical URLs and reciprocal `en`, `zh-Hans`,
  and `x-default` links. Update metadata during in-page navigation.
- Prerender the eight localized pages at build time, including their headings,
  explanations, links, and examples. Hydrate the same React components in the
  browser without losing page state during navigation or language changes.
- Generate `sitemap.xml` from the canonical page list and reference it in
  `robots.txt`. Do not include aliases, missing pages, or API origins.
- Keep API endpoint summaries and curl examples in the prerendered HTML. Load
  the interactive reference only on the client. Prerendering makes no network
  requests and does not populate calculator input or public IP results.
- Keep unknown routes as HTTP 404 responses. The shared static fallback is in
  English; the application renders its Chinese text for `/zh/` paths.

The interactive API reference and specification, linked integration guides,
CLI, MCP descriptions, and repository documentation remain in English in this
phase. API fields, error codes, serialized messages, and address counts retain
their existing contracts. Browser-language suggestions and additional locales
are future work.

## Implementation and contribution

The web application uses `i18next` and `react-i18next`. Bundled translation
resources are in `apps/web/src/i18n/resources.ts`. English defines the key
structure; the Chinese resource must satisfy the same structure. Selector-based
translation calls are checked by TypeScript through `i18next.d.ts`. English is
the fallback language. No translation backend or language-detection dependency
is enabled.

`apps/web/src/LanguageSelector.tsx` maps supported locales to their native names
and flags and renders the entries with Mantine `Menu`. Tabler Icons supplies the
chevron and selection check; `country-flag-icons` supplies the British and Chinese
SVG flags. Both dependencies use the MIT license, with notices in
`apps/web/public/third-party-notices.txt`. Icons are bundled locally and do not
require an external image service.

When adding a locale, add its translations, route mapping, static HTML entries,
metadata and alternate links, and language selector entry together. The menu
renders the configured entries without adding another header button. Preserve
the existing page, query string, and fragment in every language link.

Keep complete sentences in translations, using named interpolation parameters
for values and `Trans` for inline components. Translate display text while
preserving command examples, endpoint paths, IP addresses, CIDRs, and exact
counts. English entry counts use singular and plural forms; large address
counts are never converted to JavaScript `Number` for display or plural selection.

The calculation core provides structured local issue reasons separately from
its serialized errors. Translate these reasons in the web layer rather than
matching English error messages. `ToolError.toResponse()` continues to return
the existing shared error schema; local presentation details are omitted.

When changing page titles or descriptions, update translation metadata in
`apps/web/src/i18n/resources.ts`. `page-metadata.ts` supplies the same metadata to
the Vite HTML transform and browser navigation. Keep the `<!--page-metadata-->`
and empty root placeholders in the HTML entries; `scripts/build.ts` fills them
from the metadata and React render. New page entries must also be included in
`apps/web/vite.config.ts` and the route map in `apps/web/src/i18n/routes.ts`.
The route map and bundled locales determine the sitemap entries.

Run `pnpm check` before submitting changes. The checks cover language switching,
retained calculator drafts, physical-line validation errors, clipboard status,
IP lookup isolation, exact IPv6 counts, prerendered content, hydration, sitemap
and robots responses, static entry responses, and unchanged API, MCP, and CLI
behavior. Contributor development requires no production
credentials.
