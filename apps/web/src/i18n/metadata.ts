import { getPageMetadata } from './page-metadata';
import type { Locale, Page } from './routes';

export function updatePageMetadata(locale: Locale, page: Page, path: string) {
  const metadata = getPageMetadata(locale, page, path);
  document.documentElement.lang = metadata.lang;
  document.title = metadata.title;

  function meta(attribute: 'name' | 'property', key: string, content: string) {
    let element = document.head.querySelector<HTMLMetaElement>('meta[' + attribute + '="' + key + '"]');
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, key);
      document.head.append(element);
    }
    element.content = content;
  }

  for (const entry of metadata.meta) meta(entry.attribute, entry.key, entry.content);

  document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]').forEach(element => element.remove());
  if (page === 'notFound') {
    document.head.querySelector('meta[property="og:url"]')?.remove();
    return;
  }
  for (const entry of metadata.links) {
    const link = document.createElement('link');
    link.rel = entry.rel;
    if (entry.hreflang) link.hreflang = entry.hreflang;
    link.href = entry.href;
    document.head.append(link);
  }
}
