# Website languages

## User story

As a user of Packetrove, I want to read the website in English, Chinese,
Spanish, German, Japanese, French, Portuguese, Russian, Korean, or Italian and
switch languages without losing my current calculation, so that I can understand
network results and share a link in my preferred language.

## Website scope

- Translate the homepage, navigation, every catalog tool page, API
  documentation shell, MCP connection guide, tool questions and MCP examples,
  loading states, clipboard feedback, accessible labels,
  and the application-rendered not-found page.
- English pages have no language prefix. Use `/zh` for Chinese (`zh-Hans`),
  `/es` for Spanish (`es`), `/de` for German (`de`), `/ja` for Japanese (`ja`),
  `/fr` for French (`fr`), `/pt` for Portuguese (`pt-BR`), `/ru` for Russian (`ru`),
  `/ko` for Korean (`ko`), and `/it` for Italian (`it`).
  Each prefix has a homepage, every tool page from the
  [shared catalog](../tool-catalog.md), `/docs/api`, and `/docs/mcp`.
  Reserve short language codes and language-tag names for locale prefixes;
  choose descriptive tool URL names according to `AGENTS.md`. Legacy tool paths
  follow the catalog's [name migration](../tool-catalog.md#migration-to-flat-names),
  redirecting permanently within the same locale and preserving query strings.
  Aliases are not canonical pages.
- Let the URL determine the language. Provide a header dropdown with `English`,
  `Deutsch`, `Español`, `Français`, `Italiano`, `Português`, `Русский`,
  `中文`, `日本語`, and `한국어` entries in that fixed order, without
  browser-language redirects or a persistently stored language preference.
  Keep English first, group Chinese, Japanese, and Korean in that order, and
  retain the same order when switching languages.
  Show the current language on its button and mark the current menu entry.
  Precede each language with its configured flag: British, German, Spanish,
  French, Italian, Portuguese, Russian, Chinese, Japanese, or South Korean.
  Chinese and Portuguese use generic menu names. Their default text remains
  Simplified Chinese and Brazilian Portuguese, with matching `zh-Hans` and
  `pt-BR` page metadata and number formatting. Flags are decorative visual cues.
  Keep flags decorative and language names accessible. Support keyboard opening,
  arrow-key navigation, selection, and Escape to close and return focus.
- After hydration, match the browser's preferred languages in order against
  supported languages and writing systems, falling back to `navigator.language`
  when the preferred-language list is empty. Regional English and Portuguese
  variants share the existing generic language entries. Traditional Chinese
  does not match the current Simplified Chinese resource.
  When the first supported preference differs from the URL's language, show a
  dismissible floating suggestion anchored to the header language selector,
  written in the suggested language. Keep its width within the viewport without
  increasing the header height or moving the navigation and page content.
  Keep the page language and URL until the user follows its switch link,
  preserving the page, query string, fragment, and tool state.
  Hide the suggestion while the language menu is open without moving focus or
  preventing interaction with the rest of the page.
- Dismissing the suggestion or explicitly selecting a language records only an
  handled flag in `sessionStorage`. Subsequent navigation, history traversal,
  and reloads in the current tab do not repeat the suggestion. A new independent
  tab evaluates its own browser preferences; duplicated or restored tabs may
  retain the flag. When session storage is blocked, retain the flag in memory
  for the currently loaded application. Do not store browser preferences,
  calculator input, IP results, or a language override.
- Switch the current page in place, preserving calculator input, results, and
  validation errors. Retranslate stored errors and clipboard feedback.
- Group API documentation, the MCP guide, and the CLI guide in the shared footer's
  Integrations section on every page, separately from project resources and
  contact links. API and MCP links use the current page's locale; the CLI link
  opens the existing repository guide at the deployed source revision and
  identifies its English language in non-English interfaces. Same-tab website
  navigation preserves calculator drafts, results, and errors; modified clicks
  retain native browser behavior. Mark the current API or MCP page's footer link
  with `aria-current="page"`.
- After navigating to a different page in the same tab, including browser back
  and forward, focus the named main content region without drawing an outline
  around the entire region. Keep it outside the sequential tab order and preserve
  browser scroll behavior. Tab continues to the first interactive control in the
  region; buttons, links, and inputs retain their own visible keyboard focus
  indicators. Initial rendering and hydration, same-page language or URL suffix
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
  The homepage title presents Packetrove as network tools for humans and agents,
  using the localized project tagline. Homepage, API, and MCP descriptions
  explain the product purpose, intended audience, and interface workflows.
  Do not enumerate individual tools, tool counts, or a growing capability list
  in these descriptions. Adding a tool must not require expanding this prose.
  The shared catalog and tool pages carry the inventory and operation details.
  API and MCP guide titles identify their interfaces; individual tool titles
  identify the specific operation.
- Prerender every registered page in every supported locale at build time,
  including headings, explanations, links, and examples. Hydrate the same React components in the
  browser without losing page state during navigation or language changes.
- Generate `sitemap.xml` from the canonical page list and reference it in
  `robots.txt`. Do not include aliases, missing pages, or API origins.
- Keep API endpoint summaries and curl examples in the prerendered HTML. Load
  the interactive reference only on the client, before those summaries and
  examples. Group them in a localized Mantine accordion that is collapsed by
  default and keeps its contents mounted in the initial HTML. Prerendering makes
  no network requests and does not populate calculator input or public IP results.
- Keep unknown routes as HTTP 404 responses. The shared static fallback is in
  English; application-rendered not-found pages use the selected locale.

The interactive API reference and specification, repository integration guides,
CLI, MCP descriptions, and repository documentation remain in English in this
phase. API fields, error codes, serialized messages, and address counts retain
their existing contracts. Further locales are future work.

## Shared page presentation

On narrow screens, replace the wrapped navigation button rows with a menu
showing the current page and complete localized destination names. Its entries
include only Home and browser tools from the shared tool catalog, with integration
guides available in the footer. They retain native links and same-tab draft
preservation. Escape returns focus to the menu button; selecting a different
page focuses its main region, while reselecting the current page returns focus
to the button.

English primary-navigation labels, footer section headings, and footer destination
names use title case. Footer actions and explanatory text use sentence case.
Preserve acronyms and product names, and follow each other locale's writing
conventions. Store each role's intended wording in translation resources; the
footer's `API Documentation` label is separate from the page heading's
`API documentation` text.

On wide screens, place the footer's brand name and short description beside the
project resources, integrations, and contact sections. Give the brand more width
than an individual link section and keep the three link sections equally wide.
On tablets and narrower windows, place the brand above the link sections. Their
grid adapts to the navigation area's available width: three columns when space
allows, two on phones, and one on the narrowest screens or with larger text.
Keep each heading with its links and allow localized text to wrap. Footer links
have a minimum 44-pixel click height on narrow screens.

Use the shared theme for readable secondary text on white cards and the page
background. Buttons keep visible default backgrounds or borders. On narrow
screens and coarse-pointer devices, button and menu-item targets are at least
44 pixels tall. Long names, IPv6 addresses, and exact counts wrap without
horizontal page scrolling.

Tool examples, questions, and MCP details use collapsed Mantine accordions on
tool pages. The MCP connection guide uses the same collapsed accordions for
each tool's documentation, with independent click and keyboard controls.
Preserve all existing content in prerendered HTML and retain localized headings
and links; expanding a panel does not fetch or create its documentation. Input
limits, calculation explanations, review guidance, and extra-coverage warnings
on tool pages stay visible. The MCP guide's connection instructions, server
identity, result and error explanations, SDK example, and deployment guidance
stay visible.

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

`i18n/browser-language.ts` matches browser language tags with `Intl.Locale`.
`useLanguageSuggestion.ts` reads preferences only after hydration and handles
the tab's reminder flag; `LanguageSelector.tsx` displays the suggestion with
Mantine `Popover`. No detection request or additional dependency is needed.

When adding a locale, add its registry entry, complete translations and metadata,
and flag import together. Static HTML entries are generated from the shared
template and the registered page paths; no per-language HTML copies are needed. The menu
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
the virtual Vite HTML entries and browser navigation. Keep the `<!--page-metadata-->`
and empty root placeholders in the single `apps/web/index.html` template;
`scripts/page-entries.ts` supplies language and metadata, and `scripts/build.ts`
fills the React root in production. `websitePages` derives the Vite inputs and
sitemap entries from the locale registry and page paths. The production smoke
check validates every registered localized entry, including the MCP guide and
tool questions and examples. Complete all new page content for locales merged
into `main` before merging the feature that introduces it.

Run `pnpm check` before submitting changes. The checks cover language switching,
retained calculator drafts, physical-line validation errors, clipboard status,
IP lookup isolation, exact IPv6 counts, prerendered content, hydration, sitemap
and robots responses, static entry responses, and unchanged API, MCP, and CLI
behavior. Contributor development requires no production credentials.
