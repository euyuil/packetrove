# Homepage tool gallery

## User story

As a new visitor, I want to understand what Packetrove does from a small set of
tool examples, then open the tool I need without first reading installation
instructions or a growing grid of every tool.

## Behavior

The homepage keeps a fixed project introduction followed by a horizontal
gallery built with Mantine Carousel. One complete card is visible at a time.
Named tool buttons above the card allow direct selection; large previous/next
controls and a position indicator sit below it without covering the preview.
The layout stacks each card's description and preview on smaller screens. Tool
navigation remains available separately.

`featuredTools` in `apps/web/src/ToolGallery.tsx` curates references to the shared
catalog. It controls selection and order, without defining tool names, paths,
schemas, or examples again. Adding a catalog tool does not automatically add
another homepage card. Localized prose uses each catalog entry's page key.

Each card contains a title, explanation, a clearly marked example preview, and a
link to the localized tool page. Covering CIDRs show extra coverage; subtraction
shows exact remaining ranges and counts. The public IP preview uses a
documentation address and explicitly asks visitors to open the tool for a real
connection check. No example is a user's observed result.

The gallery has no automatic rotation or random initial selection. Visitors can
drag or swipe the cards, select a tool by name, use labeled previous/next
buttons, or focus the gallery and use Left/Right, Home, and End. Controls stay
synchronized with the selected card, and a localized live status announces the
current item. Offscreen cards cannot receive keyboard focus or appear in the
accessibility tree after the carousel initializes. Button and keyboard transitions
respect the system's reduced-motion preference. All cards and links are prerendered;
native horizontal scrolling keeps them reachable without JavaScript.

## Integration and privacy

Compact introductions link to API, CLI, and MCP guides. Installation commands
and detailed request examples remain in those guides. The homepage still shows
the configured MCP server address. CLI coverage describes its actual operations.

Loading or browsing the gallery makes no tool calls, uploads no inputs, and
writes no browser storage. Previews render catalog examples; they do not invoke
calculation or lookup handlers. Initial server and client renders use the same
order, avoiding hydration changes caused by randomness.

## Verification

Tests cover all ten locales, catalog-derived examples and links, no network or
storage writes, direct selection, bounded button and keyboard navigation,
offscreen focus exclusion, and hydration. Existing navigation and calculation
tests continue to verify opening a tool, browser-local calculation, and retained
drafts. Review desktop
and mobile layouts, dragging, swiping, reduced motion, and the no-JavaScript
fallback in a real browser, and run `pnpm check` before submission.

The interaction follows the keyboard, focus, and announcement guidance in the
[W3C carousel tutorial](https://www.w3.org/WAI/tutorials/carousels/).
