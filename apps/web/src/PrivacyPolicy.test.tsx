import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { App } from './App';
import { render } from './test-utils';
import { supportedLocales } from './i18n/locales';
import { resources } from './i18n/resources';
import { localizedPath, pagePaths } from './i18n/routes';
import { websitePages } from './seo';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
  window.sessionStorage.clear();
});

it.each(supportedLocales)('opens the %s policy from the footer without requesting tool data', locale => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  window.history.replaceState({}, '', localizedPath(pagePaths.home, locale));
  render(<App />);
  const text = resources[locale].translation.privacy;
  fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('link', { name: text.title }));
  expect(window.location.pathname).toBe(localizedPath(pagePaths.privacy, locale));
  const main = screen.getByRole('main', { name: text.title });
  expect(document.activeElement).toBe(main);
  expect(within(main).getByRole('heading', { level: 1, name: text.title })).toBeDefined();
  expect(within(main).getByRole('link', { name: text.cloudflarePolicy }).getAttribute('href'))
    .toBe('https://www.cloudflare.com/privacypolicy/');
  expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: text.title }).getAttribute('aria-current'))
    .toBe('page');
  expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href'))
    .toBe('https://packetrove.com' + localizedPath(pagePaths.privacy, locale));
  expect(fetch).not.toHaveBeenCalled();
});

it.each(websitePages.filter(page => page.page === 'privacy'))('publishes the complete policy in static $pathname HTML', async page => {
  const html = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), '../dist', page.entry), 'utf8');
  const document = new DOMParser().parseFromString(html, 'text/html');
  const text = resources[page.locale].translation.privacy;
  const main = document.querySelector('main')!;
  expect(main.querySelectorAll('h1')).toHaveLength(1);
  expect(main.textContent).toContain(text.introduction);
  for (const section of Object.values(text.sections)) {
    expect(main.textContent).toContain(section.title);
    expect(main.textContent).toContain(section.body);
  }
  expect(main.querySelector('a[href="mailto:hello@packetrove.com"]')).not.toBeNull();
  expect(html).not.toMatch(/\{\{[^{}]*\}\}/);
});
