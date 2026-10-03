import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { describe, expect, it } from 'vitest';
import { pageEntryMap, renderPageEntry } from '../scripts/page-entries';
import { websitePages } from './seo';
import { getPageMetadata } from './i18n/page-metadata';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('generated website entries', () => {
  it('uses one template for every catalog and locale page and rejects output collisions', async () => {
    const template = await readFile(resolve(root, 'index.html'), 'utf8');
    for (const page of websitePages) {
      const document = new DOMParser().parseFromString(renderPageEntry(template, page), 'text/html');
      expect(document.documentElement.lang).toBe(page.locale);
      expect(document.title).toBe(getPageMetadata(page.locale, page.page, page.path).title);
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://packetrove.com' + page.pathname);
      expect(document.querySelectorAll('title')).toHaveLength(1);
      if (page.entry !== 'index.html') await expect(readFile(resolve(root, page.entry))).rejects.toMatchObject({ code: 'ENOENT' });
    }
    expect(pageEntryMap(websitePages).size).toBe(websitePages.length);
    expect(() => pageEntryMap([...websitePages, { ...websitePages[0]!, pathname: '/index', entry: 'index.html' }])).toThrow('Duplicate page entry: index.html');
    expect(() => pageEntryMap([{ ...websitePages[0]!, entry: '404.html' }])).toThrow('Page entry is reserved: 404.html');
  });
  it('serves direct development routes with localized metadata and closes its listening port', async () => {
    const server = await createServer({ root, configLoader: 'runner', logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0, watch: null } });
    let origin = '';
    try {
      await server.listen();
      const address = server.httpServer!.address();
      if (!address || typeof address === 'string') throw new Error('The test server has no TCP address.');
      origin = 'http://127.0.0.1:' + address.port;
      for (const [path, pathname] of [
        ['/', '/'], ['/cidr-cover', '/cidr-cover'], ['/zh', '/zh/'], ['/zh/', '/zh/'],
        ['/zh/range-to-cidrs', '/zh/range-to-cidrs'], ['/pt/public-ip.html?example=1', '/pt/public-ip'],
        ['/de/docs/mcp/', '/de/docs/mcp'], ['/zh/cidr', '/zh/cidr-cover'],
      ]) {
        const response = await fetch(origin + path);
        expect(response.status).toBe(200);
        const html = await response.text();
        const document = new DOMParser().parseFromString(html, 'text/html');
        const page = websitePages.find(page => page.pathname === pathname)!;
        expect(document.documentElement.lang).toBe(page.locale);
        expect(document.title).toBe(getPageMetadata(page.locale, page.page, page.path).title);
        expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://packetrove.com' + pathname);
        expect(html).toContain('/@vite/client');
        expect(html).toContain('@react-refresh');
      }
      const head = await fetch(origin + '/ja/cidr-subtract', { method: 'HEAD' });
      expect(head.status).toBe(200);
      expect(await head.text()).toBe('');
      const script = await fetch(origin + '/src/main.tsx', { headers: { Accept: 'text/javascript' } });
      expect(script.status).toBe(200);
      expect(script.headers.get('Content-Type')).toContain('javascript');
      const moduleRequest = await fetch(origin + '/range-to-cidrs', { headers: {
        Accept: 'text/javascript', 'Sec-Fetch-Dest': 'script',
      } });
      expect(moduleRequest.status).toBe(404);
    } finally {
      await server.close();
    }
    await expect(fetch(origin)).rejects.toThrow();
  }, 30_000);
});
