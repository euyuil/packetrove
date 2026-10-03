import { describe, expect, it } from 'vitest';
import { locales, resolveLocale, supportedLocales } from './locales';
import { legacyPagePaths, localizedPath, pagePaths, resolveRoute } from './routes';
import { tools } from '@packetrove/contracts';

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

  it.each(supportedLocales)('resolves every legacy tool link to its canonical page within %s', locale => {
    for (const [from, to] of Object.entries(legacyPagePaths)) {
      const page = tools.find(tool => tool.webPath === to)!.page;
      for (const suffix of ['', '/', '.html']) {
        expect(resolveRoute(localizedPath(from, locale) + suffix)).toEqual({ locale, page, path: to });
      }
      expect(resolveRoute(localizedPath(from + '/missing-page', locale)))
        .toEqual({ locale, page: 'notFound', path: from + '/missing-page' });
    }
  });

  it('keeps canonical tool names outside the short language-code namespace', () => {
    for (const { webPath: path, legacyWebPaths } of tools) {
      const segment = path.split('/')[1]!;
      expect(path.split('/')).toHaveLength(2);
      expect(segment).toMatch(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
      expect(segment.split('-')[0]!.length).toBeGreaterThanOrEqual(4);
      for (const { prefix } of Object.values(locales)) {
        expect('/' + segment).not.toBe(prefix.toLowerCase());
        for (const previous of legacyWebPaths) expect(previous.split('/')[1]).not.toBe(prefix.slice(1));
      }
    }
  });

  it.each(['/esoteric', '/deutsch', '/japan', '/zhang', '/french', '/portugal',
    '/russian', '/korea', '/italy', '/nl/', '/es-ES/cidr-cover'])(
    'does not treat %s as a supported locale prefix', pathname => {
      expect(resolveRoute(pathname)).toEqual({ locale: 'en', page: 'notFound', path: pathname.replace(/\/+$/, '') });
    },
  );

  it('falls back to English for an unknown or missing resolved language', () => {
    for (const language of [undefined, 'nl', 'pt-PT', 'constructor', 'toString']) expect(resolveLocale(language)).toBe('en');
    for (const locale of supportedLocales) expect(resolveLocale(locale)).toBe(locale);
  });
});
