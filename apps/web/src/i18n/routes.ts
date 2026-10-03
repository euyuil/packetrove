import { legacyToolPagePaths, PRIVACY_POLICY_PATH, SUPPORT_PATH, TERMS_OF_SERVICE_PATH, toolPagePaths } from '@packetrove/contracts';
import { locales, supportedLocales, type Locale } from './locales';
export type { Locale } from './locales';
export type Page = keyof typeof pagePaths | 'notFound';

export const pagePaths = { home: '/', ...toolPagePaths, api: '/docs/api', mcp: '/docs/mcp',
  privacy: PRIVACY_POLICY_PATH, support: SUPPORT_PATH, terms: TERMS_OF_SERVICE_PATH } as const;
export const legacyPagePaths = legacyToolPagePaths;

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
  const cleanPath = path === '/index.html' ? '/' : path.replace(/\.html$/, '');
  const canonical = Object.hasOwn(legacyPagePaths, cleanPath) ? legacyPagePaths[cleanPath]! : cleanPath;
  const page = (Object.entries(pagePaths).find(([, value]) => value === canonical)?.[0] || 'notFound') as Page;
  return { locale, page, path: page === 'notFound' ? path : canonical };
}
