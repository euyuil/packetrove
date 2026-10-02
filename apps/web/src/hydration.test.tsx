import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { Application, IDENTIFIER_PREFIX } from './Application';
import { websitePages } from './seo';
import { locales, supportedLocales, type Locale } from './i18n/locales';
import { localizedPath, resolveRoute } from './i18n/routes';
import { resources } from './i18n/resources';
import { languageSuggestionStorageKey } from './useLanguageSuggestion';

vi.mock('./ApiReference', () => ({ default: () => <div>Interactive API reference</div> }));
vi.mock('./assets/packetrove-logo-160x160.png', async () => {
  // Use the production asset URL so the client can hydrate the actual built HTML.
  const { readFile } = await import('node:fs/promises');
  const { dirname, resolve } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const html = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), '../dist/index.html'), 'utf8');
  return { default: html.match(/<img src="([^\"]+)"/)![1] };
});

const originalHead = document.head.innerHTML;
let root: Root | undefined;
afterEach(async () => {
  await act(async () => { root?.unmount(); });
  root = undefined;
  document.body.innerHTML = '';
  document.head.innerHTML = originalHead;
  document.documentElement.lang = 'en';
  window.history.replaceState({}, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function hydrate(pathname: string, suffix = '') {
  // JSDOM has no layout; give the floating language menu a visible viewport and anchor.
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(20, 20, 100, 40));
  const page = websitePages.find(page => page.pathname === pathname)!;
  const html = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), '../dist', page.entry), 'utf8');
  const documentHtml = new DOMParser().parseFromString(html, 'text/html');
  document.head.innerHTML = documentHtml.head.innerHTML;
  document.body.innerHTML = documentHtml.body.innerHTML;
  document.documentElement.lang = page.locale;
  window.history.replaceState({}, '', pathname + suffix);
  const container = document.getElementById('root')!;
  const focusedLink = container.querySelector<HTMLAnchorElement>('header a')!;
  focusedLink.focus();
  const heading = container.querySelector('h1');
  const title = document.title;
  const recoverableError = vi.fn();
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  await act(async () => {
    root = hydrateRoot(container, <Application pathname={container.dataset.prerenderedPath!} />, {
      identifierPrefix: IDENTIFIER_PREFIX, onRecoverableError: recoverableError,
    });
  });
  expect(container.querySelector('h1')).toBe(heading);
  expect(document.activeElement).toBe(focusedLink);
  expect(document.title).toBe(title);
  expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.head.querySelectorAll('link[rel="alternate"][hreflang]')).toHaveLength(supportedLocales.length + 1);
  expect(recoverableError).not.toHaveBeenCalled();
  expect(consoleError).not.toHaveBeenCalled();
  return container;
}

async function chooseLanguage(locale: Locale) {
  const current = resolveRoute(window.location.pathname).locale;
  fireEvent.click(screen.getByRole('button', {
    name: resources[current].translation.common.language + ': ' + locales[current].name,
  }));
  fireEvent.click(await screen.findByRole('menuitem', { name: locales[locale].name }));
  await waitFor(() => { expect(document.querySelector('[role="menu"]')).toBeNull(); });
}

describe('hydration of production HTML', () => {
  it('offers the browser language after hydrating English HTML without redirecting or moving focus', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['zh-CN', 'en-US']);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const html = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), '../dist/index.html'), 'utf8');
    const copy = resources['zh-Hans'].translation.languageSuggestion;
    expect(html).not.toContain(copy.title);
    await hydrate('/');
    expect(await screen.findByRole('region', { name: copy.title })).toBeDefined();
    expect(window.location.pathname).toBe('/');
    expect(document.documentElement.lang).toBe('en');
    expect(window.sessionStorage.length).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(websitePages)('hydrates $pathname without replacing the heading or requesting unrelated data', async page => {
    const fetch = vi.fn(async () => Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    vi.stubGlobal('fetch', fetch);
    await hydrate(page.pathname);
    if (page.page === 'ip') {
      expect(await screen.findByText('203.0.113.1')).toBeDefined();
      expect(fetch).toHaveBeenCalledWith('https://api.packetrove.com/v1/public-ip', expect.objectContaining({
        credentials: 'omit', cache: 'no-store',
      }));
    } else {
      expect(fetch).not.toHaveBeenCalled();
    }
    if (page.page === 'api') expect(await screen.findByText('Interactive API reference')).toBeDefined();
  });

  it.each(supportedLocales.filter(locale => locale !== 'en'))('preserves exact counts and drafts after hydration when switching to %s', async locale => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    await hydrate('/cidr', '?source=example#tool');
    const input = screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '::/0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
    await chooseLanguage(locale);
    const translation = resources[locale].translation;
    expect(screen.getByLabelText(translation.cidr.inputLabel)).toBe(input);
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe(localizedPath('/cidr', locale) + '?source=example#tool');
    const count = new Intl.NumberFormat(locale).format(340_282_366_920_938_463_463_374_607_431_768_211_456n);
    expect(screen.getAllByText(count, { normalizer: text => text })).toHaveLength(2);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://packetrove.com' + localizedPath('/cidr', locale));
    fireEvent.click(screen.getByRole('link', { name: translation.common.home }));
    fireEvent.click(screen.getByRole('link', { name: translation.cidr.title }));
    expect((screen.getByLabelText(translation.cidr.inputLabel) as HTMLTextAreaElement).value).toBe('::/0');
    expect(screen.getByText(translation.cidr.exact)).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).toHaveBeenCalledExactlyOnceWith(languageSuggestionStorageKey, '1');
    expect(storage.mock.contexts).toEqual([window.sessionStorage]);
  });

  it('subtracts locally after hydration and preserves both lists through language and page changes', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await hydrate('/cidr/subtract');
    const include = screen.getByLabelText('Included IP addresses or CIDRs');
    const exclude = screen.getByLabelText('Excluded IP addresses or CIDRs');
    fireEvent.change(include, { target: { value: '203.0.113.0/24' } });
    fireEvent.change(exclude, { target: { value: '203.0.113.64/26' } });
    fireEvent.click(screen.getByRole('button', { name: 'Subtract CIDRs' }));
    await chooseLanguage('zh-Hans');
    expect(screen.getByLabelText('包含的 IP 地址或 CIDR 网段')).toBe(include);
    expect(screen.getByLabelText('排除的 IP 地址或 CIDR 网段')).toBe(exclude);
    expect((screen.getByLabelText('剩余 CIDR 列表') as HTMLTextAreaElement).value)
      .toBe('203.0.113.0/26\n203.0.113.128/25');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '复制（逗号分隔）' })); });
    expect(writeText).toHaveBeenCalledExactlyOnceWith('203.0.113.0/26, 203.0.113.128/25');
    fireEvent.click(screen.getByRole('link', { name: '首页' }));
    fireEvent.click(screen.getByRole('link', { name: 'CIDR 相减' }));
    expect((screen.getByLabelText('包含的 IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('203.0.113.0/24');
    expect((screen.getByLabelText('排除的 IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('203.0.113.64/26');
    expect((screen.getByLabelText('剩余 CIDR 列表') as HTMLTextAreaElement).value)
      .toBe('203.0.113.0/26\n203.0.113.128/25');
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).toHaveBeenCalledExactlyOnceWith(languageSuggestionStorageKey, '1');
    expect(storage.mock.contexts).toEqual([window.sessionStorage]);
  });

  it.each(supportedLocales.filter(locale => locale !== 'en'))('keeps the lookup started after hydration when switching to %s', async locale => {
    const pending: Array<{ resolve: (response: Response) => void; signal: AbortSignal }> = [];
    const fetch = vi.fn((_url: string, options: RequestInit) => new Promise<Response>(resolve => {
      pending.push({ resolve, signal: options.signal! });
    }));
    vi.stubGlobal('fetch', fetch);
    await hydrate('/public-ip');
    const requestCount = fetch.mock.calls.length;
    const request = pending.at(-1)!;
    expect(requestCount).toBeGreaterThan(0);
    await chooseLanguage(locale);
    expect(request.signal.aborted).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(requestCount);
    request.resolve(Response.json({ ip: '2001:db8::1', family: 'ipv6' }));
    expect(await screen.findByText('2001:db8::1')).toBeDefined();
    await chooseLanguage('en');
    expect(screen.getByText('2001:db8::1')).toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(requestCount);
  });

  it.each(['pushState', 'replaceState'] as const)('keeps client reference navigation after hydration with %s', async method => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await hydrate('/docs/api', '?source=initial#previous');
    act(() => {
      window.history[method](null, '', '/docs/api?source=selected#tag/Current-public-IP/get/v1/public-ip');
    });
    await chooseLanguage('zh-Hans');
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe('/zh/docs/api?source=selected#tag/Current-public-IP/get/v1/public-ip');
    expect(fetch).not.toHaveBeenCalled();
  });
});
