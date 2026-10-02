export type Locale = 'en' | 'zh-Hans';
export type Page = 'home' | 'cidr' | 'ip' | 'api' | 'notFound';

export const pagePaths = { home: '/', cidr: '/cidr', ip: '/ip', api: '/docs/api' } as const;

export function localizedPath(path: string, locale: Locale) {
  return locale === 'en' ? path : path === '/' ? '/zh/' : '/zh' + path;
}

export function resolveRoute(pathname: string): { locale: Locale; page: Page; path: string } {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const locale = normalized === '/zh' || normalized.startsWith('/zh/') ? 'zh-Hans' : 'en';
  const path = (locale === 'zh-Hans' ? normalized.slice(3) : normalized) || '/';
  const canonical = path === '/index.html' ? '/' : path.replace(/\.html$/, '');
  const page = (Object.entries(pagePaths).find(([, value]) => value === canonical)?.[0] || 'notFound') as Page;
  return { locale, page, path: page === 'notFound' ? path : canonical };
}
