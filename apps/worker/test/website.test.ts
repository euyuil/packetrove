import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { resources } from '../../web/src/i18n/resources';
import { localizedPath, pagePaths, resolveRoute, type Locale } from '../../web/src/i18n/routes';
import { escapeHtml, websitePages, websiteRedirects } from '../../web/src/seo';
import { supportedLocales } from '../../web/src/i18n/locales';
import { tools as catalogTools, isToolPage, toolCatalog } from '@packetrove/contracts';

describe('website in the Workers runtime', () => {
  it.each(websitePages)('serves localized content and metadata at $pathname without running JavaScript', async ({ locale, page, pathname }) => {
    const response = await exports.default.fetch('http://localhost' + pathname);
    expect(response.status).toBe(200);
    const html = await response.text();
    const metadata = resources[locale].translation.meta[page];
    expect(html).toContain('<html lang="' + locale + '"');
    expect(html).toContain('<title>' + metadata.title + '</title>');
    expect(html).toContain('<meta name="description" content="' + metadata.description + '" />');
    expect(html).toContain('<meta property="og:title" content="' + metadata.title + '" />');
    expect(html).toContain('<meta name="twitter:title" content="' + metadata.title + '" />');
    expect(html).toContain('<link rel="canonical" href="https://packetrove.com' + pathname + '" />');
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/<link rel="canonical"/g)).toHaveLength(1);
    expect(html).toContain('data-prerendered-path="' + pathname + '"');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    const text = resources[locale].translation;
    const heading = page === 'home' ? text.common.tagline : text[page].title;
    expect(html).toMatch(new RegExp('<h1[^>]*>' + heading + '</h1>'));
    expect(html).toContain('<main');
    expect(html).toContain('href="' + localizedPath('/cidr-cover', locale) + '"');
    expect(html).toContain('href="' + localizedPath('/cidr-subtract', locale) + '"');
    expect(html).toContain('href="' + localizedPath('/public-ip', locale) + '"');
    expect(html).toContain('href="' + localizedPath(toolCatalog.range.webPath, locale) + '"');
    const navigation = /<nav\b[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? '';
    expect(Array.from(navigation.matchAll(/href="([^"]+)"/g), match => match[1]))
      .toEqual([pagePaths.home, ...catalogTools.map(tool => tool.webPath)].map(path => localizedPath(path, locale)));
    const footer = /<footer\b[^>]*>([\s\S]*?)<\/footer>/.exec(html)?.[1] ?? '';
    for (const [path, label] of [[pagePaths.api, text.footer.apiDocumentation], [pagePaths.mcp, text.mcp.navigation]] as const) {
      expect(footer).toContain('href="' + localizedPath(path, locale) + '"');
      expect(footer).toContain(escapeHtml(label));
    }
    expect(footer).toContain('/docs/integrations/cli.md');
    expect(footer).toContain(escapeHtml(text.footer.cliGuide));
    for (const heading of [text.footer.project, text.footer.integrations, text.footer.contact]) {
      expect(footer).toContain(escapeHtml(heading));
    }
    if (page === 'home') {
      expect(html).toContain(text.home.cidrDescription);
      expect(html).toContain(text.home.subtractDescription);
      expect(html.match(/data-tool-id="/g)?.length ?? 0).toBeLessThanOrEqual(3);
      expect(html).not.toContain('data-tool-id="' + toolCatalog.ip.id + '"');
      expect(html).toContain(escapeHtml(text.home.rangeDescription));
    } else if (page === 'cidr') {
      expect(html).toContain(text.cidr.explanation);
      expect(html).toContain(text.cidr.examplesTitle);
      expect(html).toContain('2001:db8::/63');
      expect(html).toContain(new Intl.NumberFormat(locale).format(36_893_488_147_419_103_232n));
      expect(html).toContain('<textarea');
      expect(html).not.toMatch(/<textarea[^>]*>[^<]+<\/textarea>/);
    } else if (page === 'subtract') {
      expect(html).toContain(text.subtract.explanation);
      expect(html).toContain(text.subtract.review);
      expect(html).toContain(text.subtract.examplesTitle);
      expect(html).toContain('203.0.113.128/25');
      expect(html).toContain('2001:db8::8/125');
      expect(html.match(/<textarea\b/g)).toHaveLength(2);
      expect(html).not.toMatch(/<textarea[^>]*>[^<]+<\/textarea>/);
    } else if (page === 'range') {
      expect(html).toContain(escapeHtml(text.range.explanation));
      expect(html).toContain(escapeHtml(text.range.startHelp));
      expect(html).toContain(escapeHtml(text.range.endHelp));
      expect(html).toContain(escapeHtml(text.range.examplesTitle));
      expect(html).toContain('203.0.113.11/32');
      expect(html).toContain('2001:db8::10/125');
      expect(html).not.toContain('<textarea');
      expect(html.match(/<input[^>]+value=""/g)).toHaveLength(2);
    } else if (page === 'ip') {
      expect(html).toContain(text.ip.explanation);
      expect(html).toContain(text.ip.checking);
      expect(html).not.toContain('class="network-value"');
    } else if (page === 'api') {
      expect(html).toContain(text.api.cidrSummary);
      expect(html).toContain(text.api.ipSummary);
      expect(html).toContain('203.0.113.1');
      expect(html).not.toContain('class="api-reference"');
    } else {
      expect(html).toContain(escapeHtml(text.mcp.explanation));
      expect(html).toContain('claude mcp add --transport http --scope user packetrove');
      expect(html).toContain('codex mcp add packetrove');
      expect(html).toContain('structuredContent');
      expect(html).toContain('CLIENT_IP_UNAVAILABLE');
      expect(html).toContain('href="' + localizedPath(pagePaths.api, locale) + '"');
      expect(html).toContain('data-mcp-sdk-example');
      expect(html).toContain('client.listTools()');
      expect(html).toContain('client.callTool(');
    }
    if (isToolPage(page)) {
      for (const question of Object.values(text.discovery[page].questions)) {
        expect(html).toContain(escapeHtml(question.question));
        expect(html).toContain(escapeHtml(question.answer));
      }
    }
    if (page !== 'mcp') {
      expect(html).toContain('href="' + localizedPath(pagePaths.mcp, locale) + '"');
    }
    for (const tool of catalogTools.filter(tool => page === 'mcp' || page === tool.page)) {
      const example = tool.example;
      expect(html).toContain('data-mcp-tool="' + tool.mcp.name + '"');
      expect(html).toContain(escapeHtml(JSON.stringify(example.request, null, 2)));
      expect(html).toContain(escapeHtml(JSON.stringify(example.result, null, 2)));
      expect(html).toContain(escapeHtml(text.discovery[tool.page].boundary));
    }
    for (const language of [...supportedLocales, 'x-default'] as const) {
      const alternate: Locale = language === 'x-default' ? 'en' : language;
      expect(html).toContain('<link rel="alternate" hreflang="' + language
        + '" href="https://packetrove.com' + localizedPath(pagePaths[page], alternate) + '" />');
    }
    const script = html.match(/src="(\/assets\/[^\"]+\.js)"/)?.[1];
    expect(script).toBeDefined();
    expect((await exports.default.fetch('http://localhost' + script)).status).toBe(200);
    const logo = html.match(/<img src="([^\"]+)"/)?.[1];
    expect(logo).toBeDefined();
    expect((await exports.default.fetch('http://localhost' + logo)).status).toBe(200);
  });
  it('publishes a sitemap of only the registered canonical pages and an allow-all robots policy', async () => {
    const sitemap = await exports.default.fetch('http://localhost/sitemap.xml');
    expect(sitemap.status).toBe(200);
    expect(sitemap.headers.get('content-type')).toContain('xml');
    const xml = await sitemap.text();
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]);
    expect(urls).toHaveLength(websitePages.length);
    expect(urls).toEqual(supportedLocales.flatMap(locale => Object.values(pagePaths)
      .map(path => 'https://packetrove.com' + localizedPath(path, locale))));
    expect(xml).not.toMatch(/\.html|api\.packetrove|<lastmod>/);
    const robots = await exports.default.fetch('http://localhost/robots.txt');
    expect(robots.status).toBe(200);
    expect(robots.headers.get('content-type')).toContain('text/plain');
    expect(await robots.text()).toBe('User-agent: *\nAllow: /\n\nSitemap: https://packetrove.com/sitemap.xml\n');
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
  it.each(websitePages)('serves direct navigation to $pathname through static assets', async ({ pathname, locale, page }) => {
    const response = await exports.default.fetch(`http://localhost${pathname}`, {
      headers: { 'sec-fetch-mode': 'navigate', accept: 'text/html' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain(`<title>${resources[locale].translation.meta[page].title}</title>`);
    expect(html).toContain(`<meta property="og:url" content="https://packetrove.com${pathname}" />`);
  });
  it.each(websitePages.filter(page => page.page !== 'home').map(page => page.pathname))(
    'preserves trailing-slash %s links and their query strings', async path => {
      const response = await exports.default.fetch(`http://localhost${path}/?source=example`, {
        headers: { 'sec-fetch-mode': 'navigate' }, redirect: 'manual',
      });
      expect(response.status).toBe(307);
      const location = new URL(response.headers.get('location')!, 'http://localhost');
      expect(location.pathname).toBe(path);
      expect(location.search).toBe('?source=example');
      const destination = await exports.default.fetch(location.href);
      expect(destination.status).toBe(200);
      const { locale, page } = resolveRoute(path);
      expect(await destination.text()).toContain(`<title>${resources[locale].translation.meta[page].title}</title>`);
    },
  );
  it.each(websiteRedirects)('redirects legacy $from to $to while preserving queries', async ({ from: source, to: destinationPath }) => {
    for (const method of ['GET', 'HEAD']) {
      const response = await exports.default.fetch(`http://localhost${source}?source=example&source=second`, {
        method, redirect: 'manual', headers: { 'sec-fetch-mode': 'navigate', accept: 'text/html' },
      });
      expect(response.status).toBe(301);
      const location = new URL(response.headers.get('location')!, 'http://localhost');
      expect(location.pathname).toBe(destinationPath);
      expect(location.search).toBe('?source=example&source=second');
      const destination = await exports.default.fetch(location.href);
      expect(destination.status).toBe(200);
      expect(await destination.text()).toContain('href="https://packetrove.com' + destinationPath + '"');
    }
  });
  it.each(supportedLocales)('returns 404 for unmatched legacy public IP descendants within %s', async locale => {
    const response = await exports.default.fetch('http://localhost' + localizedPath('/ip/missing-page', locale));
    expect(response.status).toBe(404);
  });
  it.each(['/missing-page', '/missing-page/', '/cidr-cover/missing-page', '/public-ip/missing-page', '/zh/missing-page',
    '/zh/cidr-cover/missing-page', '/es/missing-page', '/de/missing-page', '/ja/missing-page',
    '/es/cidr-cover/missing-page', '/de/docs/api/missing-page', '/ja/public-ip/missing-page', '/docs/mcp/missing-page',
    '/fr/missing-page', '/pt/missing-page', '/fr/docs/api/missing-page', '/pt/cidr-cover/missing-page',
    '/ru/missing-page', '/ko/missing-page', '/it/missing-page',
    '/ru/docs/api/missing-page', '/ko/public-ip/missing-page', '/it/cidr-cover/missing-page',
    '/assets/missing.js', '/assets/missing.css', '/_redirects'])('returns a real static 404 for %s', async path => {
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
  it.each(['/api/v1/ip', '/api/v1/public-ip', '/api/v1/cidr-cover', '/api/openapi.json', '/mcp', '/health', '/v1/ip', '/v1/public-ip', '/openapi.json'])(
    'does not expose an API or MCP endpoint at %s', async path => {
      const response = await exports.default.fetch(`http://localhost${path}`);
      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).toContain('text/html');
      expect(response.headers.get('set-cookie')).toBeNull();
    },
  );
  it.each(['/api/v1/cidr-cover', '/mcp'])('does not process POST requests at %s', async path => {
    const response = await exports.default.fetch(`http://localhost${path}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    });
    expect(response.status).toBe(405);
  });
});
