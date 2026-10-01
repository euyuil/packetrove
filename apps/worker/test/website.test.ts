import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

describe('website in the Workers runtime', () => {
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
  it.each(['/', '/ip'])('serves direct navigation to %s through static assets', async path => {
    const response = await exports.default.fetch(`http://localhost${path}`, {
      headers: { 'sec-fetch-mode': 'navigate', accept: 'text/html' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toContain(path === '/ip'
      ? '<title>My Public IP — Packetrove</title>' : '<title>Smallest Covering CIDR — Packetrove</title>');
  });
  it('preserves trailing-slash public IP links and their query strings', async () => {
    const response = await exports.default.fetch('http://localhost/ip/?source=example', {
      headers: { 'sec-fetch-mode': 'navigate' }, redirect: 'manual',
    });
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!, 'http://localhost');
    expect(location.pathname).toBe('/ip');
    expect(location.search).toBe('?source=example');
    const destination = await exports.default.fetch(location.href);
    expect(destination.status).toBe(200);
    expect(await destination.text()).toContain('<title>My Public IP — Packetrove</title>');
  });
  it.each(['/missing-page', '/missing-page/', '/ip/missing-page', '/assets/missing.js', '/assets/missing.css'])('returns a real static 404 for %s', async path => {
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
