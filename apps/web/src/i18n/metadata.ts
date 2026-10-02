import { resources } from './resources';
import { supportedLocales } from './locales';
import { localizedPath, type Locale, type Page } from './routes';

const websiteOrigin = 'https://packetrove.com';

export function updatePageMetadata(locale: Locale, page: Page, path: string) {
  const translations = resources[locale].translation;
  const metadata = translations.meta[page];
  document.documentElement.lang = locale;
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

  meta('name', 'description', metadata.description);
  meta('property', 'og:title', metadata.title);
  meta('property', 'og:description', metadata.description);
  meta('name', 'twitter:title', metadata.title);
  meta('name', 'twitter:description', metadata.description);
  meta('property', 'og:image:alt', translations.meta.imageAlt);
  meta('name', 'twitter:image:alt', translations.meta.imageAlt);

  document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]').forEach(element => element.remove());
  if (page === 'notFound') {
    document.head.querySelector('meta[property="og:url"]')?.remove();
    return;
  }
  const url = websiteOrigin + localizedPath(path, locale);
  meta('property', 'og:type', 'website');
  meta('property', 'og:site_name', 'Packetrove');
  meta('property', 'og:image', websiteOrigin + '/packetrove-social-preview-1280x640.png');
  meta('name', 'twitter:card', 'summary_large_image');
  meta('name', 'twitter:image', websiteOrigin + '/packetrove-social-preview-1280x640.png');
  meta('property', 'og:url', url);
  for (const [language, href] of [
    ['', url], ...supportedLocales.map(language => [language, websiteOrigin + localizedPath(path, language)]),
    ['x-default', websiteOrigin + localizedPath(path, 'en')],
  ]) {
    const link = document.createElement('link');
    link.rel = language ? 'alternate' : 'canonical';
    if (language) link.hreflang = language;
    link.href = href!;
    document.head.append(link);
  }
}
