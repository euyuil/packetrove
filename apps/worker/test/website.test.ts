import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { resources } from '../../web/src/i18n/resources';
import { localizedPath, pagePaths, type Locale } from '../../web/src/i18n/routes';
import { supportedLocales } from '../../web/src/i18n/locales';

const localizedPages = supportedLocales.flatMap(locale => Object.entries(pagePaths).map(([page, path]) => ({
  locale, page: page as keyof typeof pagePaths, path: localizedPath(path, locale),
})));

describe('website in the Workers runtime', () => {
  it.each(localizedPages)('serves localized metadata at $path without running JavaScript', async ({ locale, page, path }) => {
    const response = await exports.default.fetch('http://localhost' + path);
    expect(response.status).toBe(200);
    const html = await response.text();
    const metadata = resources[locale].translation.meta[page];
    expect(html).toContain('<html lang="' + locale + '"');
    expect(html).toContain('<title>' + metadata.title + '</title>');
    expect(html).toContain('<meta name="description" content="' + metadata.description + '" />');
    expect(html).toContain('<meta property="og:title" content="' + metadata.title + '" />');
    expect(html).toContain('<meta name="twitter:title" content="' + metadata.title + '" />');
    expect(html).toContain('<link rel="canonical" href="https://packetrove.com' + path + '" />');
    for (const language of [...supportedLocales, 'x-default'] as const) {
      const alternate: Locale = language === 'x-default' ? 'en' : language;
      expect(html).toContain('<link rel="alternate" hreflang="' + language
        + '" href="https://packetrove.com' + localizedPath(pagePaths[page], alternate) + '" />');
    }
    const script = html.match(/src="(\/assets\/[^\"]+\.js)"/)?.[1];
    expect(script).toBeDefined();
    expect((await exports.default.fetch('http://localhost' + script)).status).toBe(200);
  });
  it('serves the built website and bundled JavaScript', async () => {
    const response = await exports.default.fetch('http://localhost/');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    const script = html.match(/src="(\/assets\/[^\"]+\.js)"/)?.[1];
    expect(script).toBeDefined();
    const javascript = await exports.default.fetch(`http://localhost${script}`);
    expect(javascript.status).toBe(200);
    expect(javascript.headers.get('content-type')).toContain('javascript');
  });
  it.each(localizedPages)('serves direct navigation to $path through static assets', async ({ locale, page, path }) => {
    const response = await exports.default.fetch(`http://localhost${path}`, {
      headers: { 'sec-fetch-mode': 'navigate', accept: 'text/html' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain(`<title>${resources[locale].translation.meta[page].title}</title>`);
    expect(html).toContain(`<meta property="og:url" content="https://packetrove.com${path}" />`);
  });
  it.each(localizedPages.filter(({ page }) => page !== 'home'))(
    'preserves trailing-slash $path links and their query strings', async ({ locale, page, path }) => {
      const response = await exports.default.fetch(`http://localhost${path}/?source=example`, {
        headers: { 'sec-fetch-mode': 'navigate' }, redirect: 'manual',
      });
      expect(response.status).toBe(307);
      const location = new URL(response.headers.get('location')!, 'http://localhost');
      expect(location.pathname).toBe(path);
      expect(location.search).toBe('?source=example');
      const destination = await exports.default.fetch(location.href);
      expect(destination.status).toBe(200);
      expect(await destination.text()).toContain(`<title>${resources[locale].translation.meta[page].title}</title>`);
    },
  );
  it.each(['/missing-page', '/missing-page/', '/cidr/missing-page', '/ip/missing-page', '/zh/missing-page',
    '/zh/cidr/missing-page', '/es/missing-page', '/de/missing-page', '/ja/missing-page',
    '/es/cidr/missing-page', '/de/docs/api/missing-page', '/ja/ip/missing-page',
    '/assets/missing.js', '/assets/missing.css'])('returns a real static 404 for %s', async path => {
    for (const headers of [{}, { 'sec-fetch-mode': 'navigate', accept: 'text/html' }]) {
      const response = await exports.default.fetch(`http://localhost${path}`, { headers });
      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).toContain('text/html');
      const html = await response.text();
      expect(html).toContain('<h1>Page not found</h1>');
      expect(html).toContain('<a href="/">Return to home</a>');
    }
  });
  it('preserves the missing-page status for HEAD without returning its body', async () => {
    const response = await exports.default.fetch('http://localhost/missing-page', { method: 'HEAD' });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
  });
  it.each(['/api/v1/ip', '/api/v1/cidr/cover', '/api/openapi.json', '/mcp', '/health', '/v1/ip', '/openapi.json'])(
    'does not expose an API or MCP endpoint at %s', async path => {
      const response = await exports.default.fetch(`http://localhost${path}`);
      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).toContain('text/html');
      expect(response.headers.get('set-cookie')).toBeNull();
    },
  );
  it.each(['/api/v1/cidr/cover', '/mcp'])('does not process POST requests at %s', async path => {
    const response = await exports.default.fetch(`http://localhost${path}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    });
    expect(response.status).toBe(405);
  });
});
