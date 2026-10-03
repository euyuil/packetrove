import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tools } from '@packetrove/contracts';
import { App } from './App';
import { render } from './test-utils';
import { resources } from './i18n/resources';
import { supportedLocales } from './i18n/locales';
import { localizedPath, pagePaths } from './i18n/routes';
import { websitePages } from './seo';

vi.mock('./ApiReference', () => ({ default: () => <div>Interactive API reference</div> }));

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
  document.documentElement.lang = 'en';
  window.sessionStorage.clear();
});

const sourceCommit = '0123456789abcdef0123456789abcdef01234567';
const cliGuide = `https://github.com/example-owner/packetrove/blob/${sourceCommit}/docs/integrations/cli.md`;

describe('browser navigation and integration documentation', () => {
  it.each(supportedLocales)('separates %s browser tools from localized footer documentation', locale => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    vi.stubEnv('VITE_GITHUB_REPOSITORY', 'example-owner/packetrove');
    vi.stubEnv('VITE_GIT_COMMIT', sourceCommit);
    window.history.replaceState({}, '', localizedPath(pagePaths.cidr, locale));
    render(<App />);
    const text = resources[locale].translation;
    const navigation = screen.getByRole('navigation');
    expect(within(navigation).getAllByRole('link').map(link => link.getAttribute('href')))
      .toEqual([pagePaths.home, ...tools.map(tool => tool.webPath)].map(path => localizedPath(path, locale)));
    expect(within(navigation).queryByRole('link', { name: text.mcp.navigation })).toBeNull();
    expect(within(navigation).queryByRole('link', { name: text.footer.apiDocumentation })).toBeNull();
    const footer = screen.getByRole('contentinfo');
    const integrations = within(footer).getByRole('region', { name: text.footer.integrations });
    expect(within(integrations).getAllByRole('link').map(link => link.getAttribute('href')))
      .toEqual([localizedPath(pagePaths.api, locale), localizedPath(pagePaths.mcp, locale), cliGuide]);
    expect(within(integrations).getByRole('link', { name: text.footer.apiDocumentation })).toBeDefined();
    expect(within(integrations).getByRole('link', { name: text.mcp.navigation })).toBeDefined();
    const cli = within(integrations).getByRole('link', { name: text.footer.cliGuide });
    expect(cli.getAttribute('target')).toBe('_blank');
    expect(cli.getAttribute('rel')).toBe('noopener noreferrer');
    expect(within(footer).getByRole('region', { name: text.footer.project }).querySelectorAll('a')).toHaveLength(4);
    expect(within(footer).getByRole('link', { name: text.privacy.title }).getAttribute('href'))
      .toBe(localizedPath(pagePaths.privacy, locale));
    expect(within(footer).getByRole('link', { name: text.terms.title }).getAttribute('href'))
      .toBe(localizedPath(pagePaths.terms, locale));
    expect(within(footer).getByRole('link', { name: text.support.title }).getAttribute('href'))
      .toBe(localizedPath(pagePaths.support, locale));
    expect(within(footer).getByRole('region', { name: text.footer.contact }).querySelectorAll('a')).toHaveLength(4);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses English title case for destinations and sentence case for actions', () => {
    window.history.replaceState({}, '', pagePaths.home);
    render(<App />);
    const footer = within(screen.getByRole('contentinfo'));
    for (const name of ['Project Resources', 'Integrations', 'Contact & Feedback']) {
      expect(footer.getByRole('heading', { name })).toBeDefined();
    }
    for (const name of ['API Documentation', 'MCP Guide', 'CLI Guide', 'Privacy Policy', 'Support', 'Terms of Service', 'Report a bug', 'Request a feature', 'Send an email', 'Source code: MIT']) {
      expect(footer.getByRole('link', { name })).toBeDefined();
    }
  });

  it.each(['mcp', 'api', 'privacy', 'support', 'terms', 'notFound'] as const)('keeps the mobile menu limited to browser tasks on the %s page', async page => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    window.history.replaceState({}, '', page === 'notFound' ? '/missing' : pagePaths[page]);
    render(<App />);
    const text = resources.en.translation;
    const label = page === 'mcp' ? text.mcp.navigation : page === 'api' ? text.footer.apiDocumentation
      : page === 'privacy' ? text.privacy.title : page === 'support' ? text.support.title
      : page === 'terms' ? text.terms.title : text.common.notFound;
    const trigger = within(screen.getByRole('navigation')).getByRole('button', { name: text.common.navigation + ': ' + label });
    fireEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(within(menu).getAllByRole('menuitem').map(item => item.getAttribute('href')))
      .toEqual([pagePaths.home, ...tools.map(tool => tool.webPath)]);
    const user = userEvent.setup();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('menuitem', { name: text.cidr.title }));
    expect(window.location.pathname).toBe(pagePaths.cidr);
    expect(document.activeElement).toBe(screen.getByRole('main', { name: text.cidr.title }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['api', 'mcp'] as const)('retains native modified-click behavior for the %s footer link', page => {
    window.history.replaceState({}, '', '/zh/cidr-cover');
    render(<App />);
    const text = resources['zh-Hans'].translation;
    const label = page === 'api' ? text.footer.apiDocumentation : text.mcp.navigation;
    const link = within(screen.getByRole('contentinfo')).getByRole('link', { name: label });
    let preventedByApp: boolean | undefined;
    document.addEventListener('click', event => {
      preventedByApp = event.defaultPrevented;
      event.preventDefault();
    }, { once: true });
    fireEvent.click(link, { ctrlKey: true });
    expect(preventedByApp).toBe(false);
    expect(window.location.pathname).toBe('/zh/cidr-cover');
    expect(link.getAttribute('href')).toBe(localizedPath(pagePaths[page], 'zh-Hans'));
  });

  it.each(websitePages)('keeps browser navigation and integration footer links in prerendered $pathname', async page => {
    const directory = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
    const html = await readFile(resolve(directory, page.entry), 'utf8');
    const navigation = /<nav\b[^>]*>[\s\S]*?<\/nav>/.exec(html)?.[0];
    const footer = /<footer\b[^>]*>[\s\S]*?<\/footer>/.exec(html)?.[0];
    expect(navigation).toBeDefined();
    expect(footer).toBeDefined();
    const document = new DOMParser().parseFromString(navigation! + footer!, 'text/html');
    expect(Array.from(document.querySelectorAll('nav a'), link => link.getAttribute('href')))
      .toEqual([pagePaths.home, ...tools.map(tool => tool.webPath)].map(path => localizedPath(path, page.locale)));
    const text = resources[page.locale].translation;
    const integrations = document.querySelector('[aria-labelledby="footer-integrations-heading"]')!;
    expect(integrations).not.toBeNull();
    const links = Array.from(integrations.querySelectorAll('a'));
    expect(links.map(link => link.textContent))
      .toEqual([text.footer.apiDocumentation, text.mcp.navigation, text.footer.cliGuide]);
    expect(links.slice(0, 2).map(link => link.getAttribute('href')))
      .toEqual([localizedPath(pagePaths.api, page.locale), localizedPath(pagePaths.mcp, page.locale)]);
    expect(links[2]!.getAttribute('href')).toMatch(/\/docs\/integrations\/cli\.md$/);
    expect(links[2]!.getAttribute('target')).toBe('_blank');
    expect(links[0]!.getAttribute('aria-current')).toBe(page.page === 'api' ? 'page' : null);
    expect(links[1]!.getAttribute('aria-current')).toBe(page.page === 'mcp' ? 'page' : null);
    for (const heading of [text.footer.project, text.footer.integrations, text.footer.contact]) {
      expect(document.querySelector('footer')!.textContent).toContain(heading);
    }
  });
});
