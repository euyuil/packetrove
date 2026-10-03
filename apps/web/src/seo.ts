import { supportedLocales } from './i18n/locales';
import { legacyPagePaths, localizedPath, pagePaths } from './i18n/routes';
import { getPageMetadata, WEBSITE_ORIGIN } from './i18n/page-metadata';
import { resources } from './i18n/resources';

export const websitePages = supportedLocales.flatMap(locale =>
  Object.entries(pagePaths).map(([page, path]) => {
    const pathname = localizedPath(path, locale);
    return { locale, page: page as keyof typeof pagePaths, path, pathname,
      entry: pathname.endsWith('/') ? pathname.slice(1) + 'index.html' : pathname.slice(1) + '.html' };
  }));

export const websiteRedirects = supportedLocales.flatMap(locale =>
  Object.entries(legacyPagePaths).flatMap(([from, to]) =>
    ['', '/', '.html'].map(suffix => ({
      from: localizedPath(from, locale) + suffix, to: localizedPath(to, locale),
    }))));

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

export function renderPageMetadata(pathname: string) {
  const page = websitePages.find(candidate => candidate.pathname === pathname);
  if (!page) throw new Error('Unknown static page: ' + pathname);
  const metadata = getPageMetadata(page.locale, page.page, page.path, resources[page.locale].translation);
  return [
    '<title>' + escapeHtml(metadata.title) + '</title>',
    ...metadata.meta.map(entry => '<meta ' + entry.attribute + '="' + entry.key
      + '" content="' + escapeHtml(entry.content) + '" />'),
    ...metadata.links.map(entry => '<link rel="' + entry.rel + '"'
      + (entry.hreflang ? ' hreflang="' + entry.hreflang + '"' : '')
      + ' href="' + escapeHtml(entry.href) + '" />'),
  ].join('\n    ');
}

export function renderSitemap() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + websitePages.map(page => '  <url><loc>' + escapeHtml(WEBSITE_ORIGIN + page.pathname) + '</loc></url>').join('\n')
    + '\n</urlset>\n';
}

export const robotsText = 'User-agent: *\nAllow: /\n\nSitemap: ' + WEBSITE_ORIGIN + '/sitemap.xml\n';
