import { describe, expect, it } from 'vitest';
import { locales, resolveLocale, supportedLocales } from './locales';
import { localizedPath, pagePaths, resolveRoute } from './routes';

describe('localized website routes', () => {
  it.each(supportedLocales)('resolves canonical paths and HTML aliases for %s', locale => {
    const prefix = locales[locale].prefix;
    expect(localizedPath('/', locale)).toBe(prefix + '/');
    for (const [page, path] of Object.entries(pagePaths)) {
      const canonical = localizedPath(path, locale);
      const htmlAlias = path === '/' ? prefix + '/index.html' : canonical + '.html';
      for (const alias of [canonical, canonical + '/', htmlAlias]) {
        expect(resolveRoute(alias)).toEqual({ locale, page, path });
      }
    }
    if (prefix) expect(resolveRoute(prefix)).toEqual({ locale, page: 'home', path: '/' });
  });

  it.each(supportedLocales)('preserves unknown paths within %s', locale => {
    expect(resolveRoute(localizedPath('/missing-page/', locale)))
      .toEqual({ locale, page: 'notFound', path: '/missing-page' });
  });

  it.each(['/esoteric', '/deutsch', '/japan', '/zhang', '/french', '/portugal', '/it/', '/es-ES/cidr'])(
    'does not treat %s as a supported locale prefix', pathname => {
      expect(resolveRoute(pathname)).toEqual({ locale: 'en', page: 'notFound', path: pathname.replace(/\/+$/, '') });
    },
  );

  it('falls back to English for an unknown or missing resolved language', () => {
    for (const language of [undefined, 'it', 'pt-PT', 'constructor', 'toString']) expect(resolveLocale(language)).toBe('en');
    for (const locale of supportedLocales) expect(resolveLocale(locale)).toBe(locale);
  });
});
