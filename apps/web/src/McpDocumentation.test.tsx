import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CidrCoverRequestSchema, CidrCoverResultSchema, CidrSubtractRequestSchema, CidrSubtractResultSchema,
  PublicIpRequestSchema, PublicIpResultSchema, MAX_SUBTRACTION_OUTPUTS, tools as catalogTools,
  RangeToCidrsRequestSchema, RangeToCidrsResultSchema, PACKETROVE_IDENTITY, PACKETROVE_VERSION, toolCatalog,
} from '@packetrove/contracts';
import { rangeToCidrs, smallestCoveringCidr, subtractCidrs } from '@packetrove/core';
import { App } from './App';
import { render } from './test-utils';
import { websitePages } from './seo';
import { locales, supportedLocales } from './i18n/locales';
import { localizedPath, pagePaths } from './i18n/routes';
import { en, resources } from './i18n/resources';
import { createI18n } from './i18n';
import { getMcpGuide } from './mcp-guide';
import { languageSuggestionStorageKey } from './useLanguageSuggestion';

vi.mock('./ApiReference', () => ({ default: () => <div>Interactive API reference</div> }));

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
  document.documentElement.lang = 'en';
});

describe('MCP examples in production HTML', () => {
  it('publishes the same English prose, client commands, and SDK example in the website and repository guide', async () => {
    const sourceDirectory = dirname(fileURLToPath(import.meta.url));
    const markdown = await readFile(resolve(sourceDirectory, '../../../docs/integrations/mcp.md'), 'utf8');
    const html = await readFile(resolve(sourceDirectory, '../dist/docs/mcp.html'), 'utf8');
    const document = new DOMParser().parseFromString(html, 'text/html');
    const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
    const plainMarkdown = normalize(markdown.replace(/`/g, ''));
    for (const paragraph of document.querySelectorAll('main p')) {
      expect(plainMarkdown, paragraph.textContent!).toContain(normalize(paragraph.textContent!));
    }
    const guide = getMcpGuide('en', 'https://api.packetrove.com/mcp');
    expect(markdown).toContain('# ' + document.querySelector('main h1')!.textContent);
    for (const client of guide.clients) {
      expect(markdown).toContain('```sh\n' + client.command + '\n```');
      expect(Array.from(document.querySelectorAll('main pre'), node => node.textContent)).toContain(client.command);
      expect(client.command).not.toMatch(/^\+/m);
    }
    expect(document.querySelector('[data-mcp-sdk-example]')!.textContent).toBe(guide.sdk.code);
    expect(markdown).toContain('```js\n' + guide.sdk.code + '\n```');
    const identity = JSON.stringify({ ...PACKETROVE_IDENTITY, version: PACKETROVE_VERSION }, null, 2);
    expect(document.querySelector('[data-mcp-server-identity]')!.textContent).toBe(identity);
    expect(markdown).toContain('```json\n' + identity + '\n```');
    expect(markdown).not.toMatch(/\{\{|<\/?code>/);
  });

  it.each(websitePages.filter(page => page.page === 'mcp' || catalogTools.some(tool => tool.page === page.page)))(
    'publishes executable arguments and contract-valid results at $pathname', async page => {
      const html = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), '../dist', page.entry), 'utf8');
      const document = new DOMParser().parseFromString(html, 'text/html');
      if (page.page === 'mcp') {
        expect(document.querySelector('[data-mcp-server-identity]')!.textContent)
          .toBe(JSON.stringify({ ...PACKETROVE_IDENTITY, version: PACKETROVE_VERSION }, null, 2));
        expect(document.querySelector('#mcp-identity-heading')?.textContent)
          .toBe(resources[page.locale].translation.mcp.identityTitle);
        expect(document.querySelector('main')!.textContent).toContain(resources[page.locale].translation.mcp.identityPresentation);
      }
      const tools = document.querySelectorAll('[data-mcp-tool]');
      const expected = catalogTools.filter(tool => page.page === 'mcp' || page.page === tool.page);
      expect(Array.from(tools, section => section.getAttribute('data-mcp-tool')))
        .toEqual(expected.map(tool => tool.mcp.name));
      for (const section of tools) {
        const name = section.getAttribute('data-mcp-tool');
        const definition = catalogTools.find(tool => tool.mcp.name === name)!;
        const guidance = resources[page.locale].translation.discovery[definition.page];
        const control = section.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
        expect(control.textContent).toBe(guidance.mcpTitle);
        expect(control.getAttribute('aria-expanded')).toBe('false');
        expect(section.querySelector('h2')!.contains(control)).toBe(true);
        const panel = document.getElementById(control.getAttribute('aria-controls')!)!;
        expect(panel.getAttribute('aria-labelledby')).toBe(control.id);
        expect(panel.style.display).toBe('none');
        const resultGuidance = guidance.result
          .replaceAll('{{maximumOutputs}}', new Intl.NumberFormat(page.locale).format(MAX_SUBTRACTION_OUTPUTS));
        expect(section.textContent).toContain(resultGuidance);
        expect(section.textContent).toContain(guidance.boundary);
        expect(section.textContent).not.toMatch(/\{\{[^{}]*\}\}/);
        const args = JSON.parse(section.querySelector('[data-mcp-example="arguments"]')!.textContent!);
        const result = JSON.parse(section.querySelector('[data-mcp-example="result"]')!.textContent!);
        const resourceLink = JSON.parse(section.querySelector('[data-mcp-example="resource-link"]')!.textContent!);
        expect(resourceLink).toEqual(definition.mcp.resultLink);
        if (name === toolCatalog.cidr.mcp.name) {
          const request = CidrCoverRequestSchema.parse(args);
          expect(CidrCoverResultSchema.parse(result)).toEqual(smallestCoveringCidr(request));
          expect(args).toEqual(toolCatalog.cidr.example.request);
          expect(result).toEqual(toolCatalog.cidr.example.result);
        } else if (name === toolCatalog.subtract.mcp.name) {
          expect(CidrSubtractResultSchema.parse(result)).toEqual(subtractCidrs(CidrSubtractRequestSchema.parse(args)));
          expect(args).toEqual(toolCatalog.subtract.example.request);
          expect(result).toEqual(toolCatalog.subtract.example.result);
        } else if (name === toolCatalog.range.mcp.name) {
          expect(RangeToCidrsResultSchema.parse(result)).toEqual(rangeToCidrs(RangeToCidrsRequestSchema.parse(args)));
          expect(args).toEqual(toolCatalog.range.example.request);
          expect(result).toEqual(toolCatalog.range.example.result);
        } else {
          expect(name).toBe(toolCatalog.ip.mcp.name);
          expect(PublicIpRequestSchema.parse(args)).toEqual({});
          expect(PublicIpResultSchema.parse(result)).toEqual(toolCatalog.ip.example.result);
        }
      }
      if (page.page === 'mcp') {
        expect(document.querySelector('main')!.textContent).toContain(resources[page.locale].translation.mcp.resultLinks
          .replace(/<\/?code>/g, ''));
      }
    },
  );
});

describe('localized MCP tool disclosures', () => {
  it.each(supportedLocales)('keeps the %s tool documentation mounted while opening and closing independent panels', async locale => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    window.history.replaceState({}, '', localizedPath(pagePaths.mcp, locale));
    render(<App />);
    const user = userEvent.setup();
    const text = resources[locale].translation;
    const main = screen.getByRole('main', { name: text.mcp.title });
    const controls = catalogTools.map(tool => within(main).getByRole('button', {
      name: text.discovery[tool.page].mcpTitle,
    }));
    const panels = controls.map(control => document.getElementById(control.getAttribute('aria-controls')!)!);
    const examples = panels.map(panel => panel.querySelector('[data-mcp-example="arguments"]'));
    for (const [index, tool] of catalogTools.entries()) {
      expect(controls[index]!.getAttribute('aria-expanded')).toBe('false');
      expect(examples[index]).not.toBeNull();
      expect(within(panels[index]!).queryByRole('link', { name: text.discovery[tool.page].openTool })).toBeNull();
    }
    for (const [index, tool] of catalogTools.entries()) {
      await user.click(controls[index]!);
      expect(controls[index]!.getAttribute('aria-expanded')).toBe('true');
      expect((await within(panels[index]!).findByRole('link', { name: text.discovery[tool.page].openTool })).getAttribute('href'))
        .toBe(localizedPath(pagePaths[tool.page], locale));
      expect(panels[index]!.querySelector('[data-mcp-example="arguments"]')).toBe(examples[index]);
    }
    expect(controls.every(control => control.getAttribute('aria-expanded') === 'true')).toBe(true);
    for (const [index, tool] of catalogTools.entries()) {
      controls[index]!.focus();
      await user.keyboard('{Enter}');
      expect(document.activeElement).toBe(controls[index]);
      expect(controls[index]!.getAttribute('aria-expanded')).toBe('false');
      await waitFor(() => {
        expect(within(panels[index]!).queryByRole('link', { name: text.discovery[tool.page].openTool })).toBeNull();
      });
      expect(panels[index]!.querySelector('[data-mcp-example="arguments"]')).toBe(examples[index]);
      await user.keyboard(' ');
      expect(controls[index]!.getAttribute('aria-expanded')).toBe('true');
      expect(await within(panels[index]!).findByRole('link', { name: text.discovery[tool.page].openTool })).toBeDefined();
    }
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('localized MCP guide navigation', () => {
  it.each(supportedLocales)('opens the %s guide and API reference from the shared footer while preserving a calculator error', async locale => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    vi.stubEnv('VITE_GITHUB_REPOSITORY', 'example-owner/packetrove');
    vi.stubEnv('VITE_GIT_COMMIT', '0123456789abcdef0123456789abcdef01234567');
    const text = resources[locale].translation;
    window.history.replaceState({}, '', localizedPath(pagePaths.cidr, locale));
    render(<App />);
    fireEvent.change(screen.getByLabelText(text.cidr.inputLabel), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: text.cidr.calculate }));
    const guideLink = within(screen.getByRole('contentinfo')).getByRole('link', { name: text.mcp.navigation });
    expect(guideLink.getAttribute('href')).toBe(localizedPath(pagePaths.mcp, locale));
    fireEvent.click(guideLink);
    expect(guideLink.getAttribute('aria-current')).toBe('page');
    const main = screen.getByRole('main', { name: text.mcp.title });
    expect(document.activeElement).toBe(main);
    expect(within(main).getByRole('link', { name: text.common.source }).getAttribute('href'))
      .toBe('https://github.com/example-owner/packetrove/tree/0123456789abcdef0123456789abcdef01234567');
    const apiLink = within(main).getByRole('link', { name: text.home.apiGuide });
    expect(apiLink.getAttribute('href')).toBe(localizedPath(pagePaths.api, locale));
    fireEvent.click(apiLink);
    expect(await screen.findByText('Interactive API reference')).toBeDefined();
    expect(document.activeElement).toBe(screen.getByRole('main', { name: text.api.title }));
    fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: text.cidr.title }));
    expect((screen.getByLabelText(text.cidr.inputLabel) as HTMLTextAreaElement).value).toBe('bad');
    expect(screen.getByRole('alert')).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(supportedLocales)('keeps both subtraction lists and the exact result when visiting the %s guide', async locale => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    window.history.replaceState({}, '', localizedPath(pagePaths.subtract, locale));
    render(<App />);
    const text = resources[locale].translation;
    fireEvent.change(screen.getByLabelText(text.subtract.includeLabel), { target: { value: '203.0.113.0/24' } });
    fireEvent.change(screen.getByLabelText(text.subtract.excludeLabel), { target: { value: '203.0.113.64/26' } });
    fireEvent.click(screen.getByRole('button', { name: text.subtract.calculate }));
    expect(screen.getByText(text.discovery.subtract.questions.access.answer)).toBeDefined();
    expect(document.querySelector('[data-mcp-tool]')?.getAttribute('data-mcp-tool')).toBe(toolCatalog.subtract.mcp.name);
    fireEvent.click(screen.getByRole('button', { name: text.discovery.subtract.mcpTitle }));
    fireEvent.click(await screen.findByRole('link', { name: text.home.mcpGuide }));
    expect(window.location.pathname).toBe(localizedPath(pagePaths.mcp, locale));
    fireEvent.click(screen.getByRole('link', { name: text.subtract.title }));
    expect((screen.getByLabelText(text.subtract.includeLabel) as HTMLTextAreaElement).value).toBe('203.0.113.0/24');
    expect((screen.getByLabelText(text.subtract.excludeLabel) as HTMLTextAreaElement).value).toBe('203.0.113.64/26');
    expect((screen.getByLabelText(text.subtract.output) as HTMLTextAreaElement).value)
      .toBe('203.0.113.0/26\n203.0.113.128/25');
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
  });

  it.each(supportedLocales)('links the %s homepage and API reference to the same-language guide without fetching', async locale => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    window.history.replaceState({}, '', localizedPath('/', locale));
    render(<App />);
    const text = resources[locale].translation;
    const guide = screen.getByRole('link', { name: text.home.mcpGuide });
    expect(guide.getAttribute('href')).toBe(localizedPath(pagePaths.mcp, locale));
    fireEvent.click(guide);
    expect(screen.getByRole('heading', { level: 1, name: text.mcp.title })).toBeDefined();
    expect(document.activeElement).toBe(screen.getByRole('main', { name: text.mcp.title }));
    expect(document.title).toBe(text.meta.mcp.title);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://packetrove.com' + localizedPath(pagePaths.mcp, locale));
    expect(screen.getByRole('main').textContent).toContain('https://api.packetrove.com/mcp');
    expect(screen.getByRole('main').textContent).toContain('tools/list');
    fireEvent.click(screen.getByRole('link', { name: text.common.home }));
    fireEvent.click(screen.getByRole('link', { name: text.home.apiGuide }));
    expect(await screen.findByText('Interactive API reference')).toBeDefined();
    const apiGuide = screen.getByRole('link', { name: text.home.mcpGuide });
    expect(apiGuide.getAttribute('href')).toBe(localizedPath(pagePaths.mcp, locale));
    fireEvent.click(apiGuide);
    expect(screen.getByRole('heading', { level: 1, name: text.mcp.title })).toBeDefined();
    expect(document.activeElement).toBe(screen.getByRole('main', { name: text.mcp.title }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(supportedLocales.flatMap(locale => ['::/0', 'bad'].map(input => ({ locale, input }))))(
    'keeps the calculator draft $input through the guide and a language change to $locale', async ({ locale, input }) => {
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      const storage = vi.spyOn(Storage.prototype, 'setItem');
      window.history.replaceState({}, '', '/cidr-cover');
      render(<App />);
      fireEvent.change(screen.getByLabelText(en.cidr.inputLabel), { target: { value: input } });
      fireEvent.click(screen.getByRole('button', { name: en.cidr.calculate }));
      fireEvent.click(screen.getByRole('button', { name: en.discovery.cidr.mcpTitle }));
      fireEvent.click(await screen.findByRole('link', { name: en.home.mcpGuide }));
      expect(window.location.pathname).toBe(pagePaths.mcp);
      fireEvent.click(screen.getByRole('button', { name: en.common.language + ': ' + locales.en.name }));
      fireEvent.click(screen.getByRole('menuitem', { name: locales[locale].name }));
      const text = resources[locale].translation;
      expect(window.location.pathname).toBe(localizedPath(pagePaths.mcp, locale));
      const section = screen.getByRole('region', { name: text.discovery.cidr.mcpTitle });
      fireEvent.click(within(section).getByRole('button', { name: text.discovery.cidr.mcpTitle }));
      fireEvent.click(await within(section).findByRole('link', { name: text.discovery.cidr.openTool }));
      expect(window.location.pathname).toBe(localizedPath(pagePaths.cidr, locale));
      expect((screen.getByLabelText(text.cidr.inputLabel) as HTMLTextAreaElement).value).toBe(input);
      if (input === 'bad') {
        const issue = within(screen.getByRole('alert')).getByRole('listitem');
        expect(issue.textContent).toBe(createI18n(locale).t($ => $.cidr.line, {
          line: '1', message: text.errors.invalidAddress,
        }));
      } else {
        const count = new Intl.NumberFormat(locale).format(340_282_366_920_938_463_463_374_607_431_768_211_456n);
        expect(screen.getAllByText(count, { normalizer: text => text })).toHaveLength(2);
        expect(screen.getByText(text.cidr.exact)).toBeDefined();
      }
      expect(fetch).not.toHaveBeenCalled();
      expect(storage).toHaveBeenCalledExactlyOnceWith(languageSuggestionStorageKey, '1');
      expect(storage.mock.contexts).toEqual([window.sessionStorage]);
    },
  );
});
