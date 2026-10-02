import { locales, supportedLocales, type Locale } from './locales';
export type { Locale } from './locales';
export type Page = 'home' | 'cidr' | 'ip' | 'api' | 'notFound';

export const pagePaths = { home: '/', cidr: '/cidr', ip: '/ip', api: '/docs/api' } as const;

export function localizedPath(path: string, locale: Locale) {
  const prefix = locales[locale].prefix;
  if (!prefix) return path;
  return path === '/' ? prefix + '/' : prefix + path;
}

export function resolveRoute(pathname: string): { locale: Locale; page: Page; path: string } {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const locale = supportedLocales.find(language => {
    const prefix = locales[language].prefix;
    return prefix && (normalized === prefix || normalized.startsWith(prefix + '/'));
  }) ?? 'en';
  const path = normalized.slice(locales[locale].prefix.length) || '/';
  const canonical = path === '/index.html' ? '/' : path.replace(/\.html$/, '');
  const page = (Object.entries(pagePaths).find(([, value]) => value === canonical)?.[0] || 'notFound') as Page;
  return { locale, page, path: page === 'notFound' ? path : canonical };
}
