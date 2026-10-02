import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { Application, IDENTIFIER_PREFIX } from './Application';
import { websitePages } from './seo';

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
  expect(document.title).toBe(title);
  expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.head.querySelectorAll('link[rel="alternate"][hreflang]')).toHaveLength(3);
  expect(recoverableError).not.toHaveBeenCalled();
  expect(consoleError).not.toHaveBeenCalled();
  return container;
}

async function chooseLanguage(name: 'English' | '简体中文') {
  fireEvent.click(screen.getByRole('button', { name: /^(Language|语言):/ }));
  fireEvent.click(await screen.findByRole('menuitem', { name }));
  await waitFor(() => { expect(document.querySelector('[role="menu"]')).toBeNull(); });
}

describe('hydration of production HTML', () => {
  it.each(websitePages)('hydrates $pathname without replacing the heading or requesting unrelated data', async page => {
    const fetch = vi.fn(async () => Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    vi.stubGlobal('fetch', fetch);
    await hydrate(page.pathname);
    if (page.page === 'ip') {
      expect(await screen.findByText('203.0.113.1')).toBeDefined();
      expect(fetch).toHaveBeenCalledWith('https://api.packetrove.com/v1/ip', expect.objectContaining({
        credentials: 'omit', cache: 'no-store',
      }));
    } else {
      expect(fetch).not.toHaveBeenCalled();
    }
    if (page.page === 'api') expect(await screen.findByText('Interactive API reference')).toBeDefined();
  });

  it('calculates locally after hydration and preserves exact counts and drafts through navigation and language changes', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    await hydrate('/cidr', '?source=example#tool');
    const input = screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '::/0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
    await chooseLanguage('简体中文');
    expect(screen.getByLabelText('IP 地址或 CIDR 网段')).toBe(input);
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe('/zh/cidr?source=example#tool');
    expect(screen.getAllByText('340,282,366,920,938,463,463,374,607,431,768,211,456')).toHaveLength(2);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://packetrove.com/zh/cidr');
    fireEvent.click(screen.getByRole('link', { name: '首页' }));
    fireEvent.click(screen.getByRole('link', { name: '最小覆盖 CIDR' }));
    expect((screen.getByLabelText('IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('::/0');
    expect(screen.getByText('精确覆盖：此 CIDR 没有增加额外地址。')).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
  });

  it('keeps the lookup started after hydration when changing language', async () => {
    const pending: Array<{ resolve: (response: Response) => void; signal: AbortSignal }> = [];
    const fetch = vi.fn((_url: string, options: RequestInit) => new Promise<Response>(resolve => {
      pending.push({ resolve, signal: options.signal! });
    }));
    vi.stubGlobal('fetch', fetch);
    await hydrate('/ip');
    const requestCount = fetch.mock.calls.length;
    const request = pending.at(-1)!;
    expect(requestCount).toBeGreaterThan(0);
    await chooseLanguage('简体中文');
    expect(request.signal.aborted).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(requestCount);
    request.resolve(Response.json({ ip: '2001:db8::1', family: 'ipv6' }));
    expect(await screen.findByText('2001:db8::1')).toBeDefined();
    await chooseLanguage('English');
    expect(screen.getByText('2001:db8::1')).toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(requestCount);
  });
});
