import { afterEach, expect, it, vi } from 'vitest';
import * as metadata from './i18n/page-metadata';
import { renderPageMetadata, renderRobotsText, renderSitemap, websitePages, websiteRedirects } from './seo';
import { tools } from '@packetrove/contracts';
import { supportedLocales } from './i18n/locales';

afterEach(() => { vi.restoreAllMocks(); });

it('retains production crawling and the sitemap reference', () => {
  expect(renderRobotsText('https://packetrove.com'))
    .toBe('User-agent: *\nAllow: /\n\nSitemap: https://packetrove.com/sitemap.xml\n');
  expect(renderSitemap('https://packetrove.com')).toContain('<loc>https://packetrove.com/</loc>');
});

it('preserves translated punctuation as text without letting it create HTML elements or attributes', () => {
  const text = `CIDR & "IP" 中文 '</title><script>example</script>`;
  const original = metadata.getPageMetadata('en', 'cidr', '/cidr-cover');
  vi.spyOn(metadata, 'getPageMetadata').mockReturnValue({ ...original,
    title: text, meta: original.meta.map(entry => ({ ...entry, content: text })),
  });
  const document = new DOMParser().parseFromString('<!doctype html><html><head>'
    + renderPageMetadata('/cidr-cover') + '</head></html>', 'text/html');
  expect(document.title).toBe(text);
  expect(document.querySelectorAll('title')).toHaveLength(1);
  expect(document.querySelectorAll('script')).toHaveLength(0);
  for (const entry of original.meta) {
    const element = document.querySelector('meta[' + entry.attribute + '="' + entry.key + '"]');
    expect(element?.getAttribute('content')).toBe(text);
    expect(element?.attributes).toHaveLength(2);
  }
});

it('publishes only canonical tool pages while generating every localized legacy redirect', () => {
  const sitemap = renderSitemap();
  for (const tool of tools) {
    expect(websitePages.filter(page => page.page === tool.page)).toHaveLength(supportedLocales.length);
    for (const previous of tool.legacyWebPaths) {
      expect(websitePages.map(page => page.path)).not.toContain(previous);
      expect(sitemap).not.toContain(previous + '</loc>');
      expect(websiteRedirects.filter(redirect => redirect.from === previous)).toHaveLength(1);
    }
    expect(websiteRedirects.filter(redirect => redirect.to.endsWith(tool.webPath)))
      .toHaveLength(tool.legacyWebPaths.length * supportedLocales.length * 3);
  }
});
