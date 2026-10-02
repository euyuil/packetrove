# Website languages

## User story

As a user of Packetrove, I want to read the website in English, Chinese,
Spanish, German, Japanese, French, Portuguese, Russian, Korean, or Italian and
switch languages without losing my current calculation, so that I can understand
network results and share a link in my preferred language.

## Website scope

- Translate the homepage, navigation, CIDR calculator, public IP tool, API
  documentation shell, MCP connection guide, tool questions and MCP examples,
  loading states, clipboard feedback, accessible labels,
  and the application-rendered not-found page.
- English pages have no language prefix. Use `/zh` for Chinese (`zh-Hans`),
  `/es` for Spanish (`es`), `/de` for German (`de`), `/ja` for Japanese (`ja`),
  `/fr` for French (`fr`), `/pt` for Portuguese (`pt-BR`), `/ru` for Russian (`ru`),
  `/ko` for Korean (`ko`), and `/it` for Italian (`it`).
  Each prefix has a homepage, `/cidr`, `/cidr/subtract`, `/public-ip`, `/docs/api`, and `/docs/mcp` page.
  Reserve short language codes and language-tag names for locale prefixes;
  choose descriptive tool URL names according to `AGENTS.md`. Legacy `/ip`,
  `/ip/`, and `/ip.html` links redirect permanently to `/public-ip` in each
  supported locale, preserving query strings. Aliases are not canonical pages.
- Let the URL determine the language. Provide a header dropdown with `English`,
  `中文`, `Español`, `Deutsch`, `日本語`, `Français`, `Português`, `Русский`,
  `한국어`, and `Italiano` entries, without browser-language redirects or
  persistent storage.
  Show the current language on its button and mark the current menu entry.
  Precede each language with its configured flag: British, Chinese, Spanish,
  German, Japanese, French, Portuguese, Russian, South Korean, or Italian.
  Chinese and Portuguese use generic menu names. Their default text remains
  Simplified Chinese and Brazilian Portuguese, with matching `zh-Hans` and
  `pt-BR` page metadata and number formatting. Flags are decorative visual cues.
  Keep flags decorative and language names accessible. Support keyboard opening,
  arrow-key navigation, selection, and Escape to close and return focus.
- Switch the current page in place, preserving calculator input, results, and
  validation errors. Retranslate stored errors and clipboard feedback.
- After navigating to a different page in the same tab, including browser back
  and forward, focus the named main content region with the shared Mantine focus
  outline. Keep it outside the sequential tab order and preserve browser scroll
  behavior. Initial rendering and hydration, same-page language or URL suffix
  changes, input editing, and IP lookup updates do not move focus to this region.
- Keep an ongoing or completed public IP lookup when switching languages.
  Only opening the tool or explicitly refreshing it initiates a lookup.
- Keep CIDR calculations local. Do not upload or persist calculator input or
  IP results as part of language selection.
- Format displayed counts for the selected language using `Intl.NumberFormat`.
  Parse decimal-string address counts as `BigInt` to retain exact IPv6 values.
- Include translated titles, descriptions, and social metadata in static HTML
  entries. Use self-referencing canonical URLs and reciprocal links for all
  registered locales, plus `x-default` pointing to English. Update metadata during in-page
  navigation.
- Prerender every registered page in every supported locale at build time,
  including headings, explanations, links, and examples. Hydrate the same React components in the
  browser without losing page state during navigation or language changes.
- Generate `sitemap.xml` from the canonical page list and reference it in
  `robots.txt`. Do not include aliases, missing pages, or API origins.
- Keep API endpoint summaries and curl examples in the prerendered HTML. Load
  the interactive reference only on the client. Prerendering makes no network
  requests and does not populate calculator input or public IP results.
- Keep unknown routes as HTTP 404 responses. The shared static fallback is in
  English; application-rendered not-found pages use the selected locale.

The interactive API reference and specification, repository integration guides,
CLI, MCP descriptions, and repository documentation remain in English in this
phase. API fields, error codes, serialized messages, and address counts retain
their existing contracts. Browser-language suggestions and further locales
are future work.

## Implementation and contribution

The web application uses `i18next` and `react-i18next`. Bundled translation
resources are in `apps/web/src/i18n/resources.ts` and its `translations/` folder.
English defines the key structure; every other resource must satisfy the same
structure. Selector-based translation calls are checked by TypeScript through
`i18next.d.ts`. English is the fallback language. No translation backend or
language-detection dependency is enabled.

`apps/web/src/i18n/locales.ts` defines each locale's native name, URL prefix, and
flag. Routing, supported translation languages, alternate links, Vite inputs,
the sitemap, and the language menu use this registry. `LanguageSelector.tsx`
renders the entries with Mantine `Menu`. Tabler Icons supplies the chevron and
selection check; `country-flag-icons` supplies the ten SVG flags. Both
dependencies use the MIT license, with notices in
`apps/web/public/third-party-notices.txt`. Icons are bundled locally and do not
require an external image service.

When adding a locale, add its registry entry, complete translations and metadata,
static HTML entries, and flag import together. The menu
renders the configured entries without adding another header button. Preserve
the existing page, query string, and fragment in every language link.
Refresh the links when opening the menu and when following or opening a link's
context menu, including after the interactive API reference updates the URL.
Keep modified clicks and other native link actions available.

Keep complete sentences in translations, using named interpolation parameters
for values and `Trans` for inline components. Translate display text while
preserving command examples, endpoint paths, IP addresses, CIDRs, and exact
counts. English entry counts use singular and plural forms; large address
counts are never converted to JavaScript `Number` for display or plural selection.
Spanish, French, Brazilian Portuguese, and Italian also define the CLDR `many` entry-count
form. French and Brazilian Portuguese use the singular form for zero entries;
Japanese and Korean use the same counter for singular and plural entries.
Russian includes `one`, `few`, `many`, and `other` entry-count forms, with teen
numbers and compound endings determining the appropriate form. French uses
narrow non-breaking spaces for digit grouping; Russian uses non-breaking spaces;
Brazilian Portuguese and Italian use dots; Korean uses commas.
Preserve interpolation names and inline code tokens in every translation.

The calculation core provides structured local issue reasons separately from
its serialized errors. Translate these reasons in the web layer rather than
matching English error messages. `ToolError.toResponse()` continues to return
the existing shared error schema; local presentation details are omitted.

When changing page titles or descriptions, update translation metadata in
`apps/web/src/i18n/resources.ts`. `page-metadata.ts` supplies the same metadata to
the Vite HTML transform and browser navigation. Keep the `<!--page-metadata-->`
and empty root placeholders in the HTML entries; `scripts/build.ts` fills them
from the metadata and React render. `websitePages` derives the Vite inputs and
sitemap entries from the locale registry and page paths. The production smoke
check validates every registered localized entry, including the MCP guide and
tool questions and examples. Complete all new page content for locales merged
into `main` before merging the feature that introduces it.

Run `pnpm check` before submitting changes. The checks cover language switching,
retained calculator drafts, physical-line validation errors, clipboard status,
IP lookup isolation, exact IPv6 counts, prerendered content, hydration, sitemap
and robots responses, static entry responses, and unchanged API, MCP, and CLI
behavior. Contributor development requires no production credentials.
