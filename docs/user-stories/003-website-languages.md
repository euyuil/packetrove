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
- Let the URL determine the language. Provide explicit `English` and
  `简体中文` controls, without browser-language redirects or persistent storage.
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

Keep complete sentences in translations, using named interpolation parameters
for values and `Trans` for inline components. Translate display text while
preserving command examples, endpoint paths, IP addresses, CIDRs, and exact
counts. English entry counts use singular and plural forms; large address
counts are never converted to JavaScript `Number` for display or plural selection.

The calculation core provides structured local issue reasons separately from
its serialized errors. Translate these reasons in the web layer rather than
matching English error messages. `ToolError.toResponse()` continues to return
the existing shared error schema; local presentation details are omitted.

When changing page titles or descriptions, update both translation metadata and
the corresponding HTML entries under `apps/web/`, including `zh/`. The website
runtime tests compare built entries with the resources and verify canonical
and alternate language links. New page entries must also be included in
`apps/web/vite.config.ts`.

Run `pnpm check` before submitting changes. The checks cover language switching,
retained calculator drafts, physical-line validation errors, clipboard status,
IP lookup isolation, exact IPv6 counts, static entry responses, and unchanged
API, MCP, and CLI behavior. Contributor development requires no production
credentials.
