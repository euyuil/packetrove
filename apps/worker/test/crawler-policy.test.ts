import { env } from 'cloudflare:test';
import { describe, expect, it, vi } from 'vitest';
import { CIDR_COVER_PATH, ErrorResponseSchema } from '@packetrove/contracts';
import { createApp } from '../src/app';

const environments = [
  { api: 'https://api.packetrove.com', website: 'https://packetrove.com', robotsTag: null },
  { api: 'https://api.dev.packetrove.com', website: 'https://dev.packetrove.com', robotsTag: 'noindex' },
  { api: 'https://api.staging.packetrove.com', website: 'https://staging.packetrove.com', robotsTag: 'noindex' },
] as const;

describe.each(environments)('crawler policy at $api', ({ api, website, robotsTag }) => {
  const bindings = { ...env, PUBLIC_API_ORIGIN: api, PUBLIC_WEBSITE_ORIGIN: website };

  it('preserves success, errors, preflight, and lookup privacy while applying the environment policy', async () => {
    const app = createApp();
    const failures = vi.spyOn(console, 'error').mockImplementation(() => {});
    app.get('/controlled-failure', () => { throw new Error('Controlled test failure.'); });
    const cases: Array<{ path: string; status: number; init?: RequestInit; code?: string; noStore?: boolean }> = [
      { path: '/health', status: 200 },
      { path: '/missing', status: 404, code: 'NOT_FOUND' },
      { path: CIDR_COVER_PATH, status: 405, code: 'METHOD_NOT_ALLOWED' },
      { path: CIDR_COVER_PATH, status: 400, code: 'INVALID_JSON', init: {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: '{',
      } },
      { path: CIDR_COVER_PATH, status: 204, init: {
        method: 'OPTIONS', headers: { origin: 'https://client.example', 'access-control-request-method': 'POST' },
      } },
      { path: '/v1/public-ip', status: 503, code: 'CLIENT_IP_UNAVAILABLE', noStore: true },
      { path: '/mcp', status: 403, noStore: true, init: {
        method: 'POST', headers: { host: 'client.example', 'content-type': 'application/json' }, body: '{}',
      } },
      { path: '/controlled-failure', status: 500, code: 'INTERNAL_ERROR' },
    ];
    try {
      for (const { path, status, init, code, noStore } of cases) {
        const response = await app.fetch(new Request(api + path, init), bindings);
        expect(response.status, path).toBe(status);
        expect(response.headers.get('x-robots-tag'), path).toBe(robotsTag);
        if (noStore) expect(response.headers.get('cache-control')).toContain('no-store');
        if (code) expect(ErrorResponseSchema.parse(await response.json()).error.code).toBe(code);
        else await response.body?.cancel();
      }
    } finally { failures.mockRestore(); }
  });

  it('serves GET and HEAD crawler rules only on non-production APIs', async () => {
    const app = createApp();
    for (const method of ['GET', 'HEAD']) {
      const response = await app.fetch(new Request(api + '/robots.txt', { method }), bindings);
      expect(response.status).toBe(robotsTag ? 200 : 404);
      expect(response.headers.get('x-robots-tag')).toBe(robotsTag);
      if (robotsTag) expect(response.headers.get('content-type')).toContain('text/plain');
      const body = await response.text();
      if (method === 'HEAD') expect(body).toBe('');
      else if (robotsTag) expect(body).toBe('User-agent: *\nDisallow: /\n');
      else expect(ErrorResponseSchema.parse(JSON.parse(body)).error.code).toBe('NOT_FOUND');
    }
  });

  it('applies indexing rules through the static asset binding while preserving OpenAPI CORS and revalidation', async () => {
    const response = await env.OPENAPI_ASSETS.fetch(new Request(api + '/openapi.json'));
    expect(response.status).toBe(200);
    expect(response.headers.get('x-robots-tag')).toBe(robotsTag);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('cache-control')).toContain('must-revalidate');
    await response.body?.cancel();
  });
});

it('keeps concurrent policies tied to deployment bindings even when callers supply different hosts', async () => {
  const app = createApp();
  const responses = await Promise.all(environments.map(({ api, website }) => app.fetch(
    new Request('https://api.packetrove.com/health', {
      headers: { host: 'api.dev.packetrove.com', origin: 'https://dev.packetrove.com' },
    }), { ...env, PUBLIC_API_ORIGIN: api, PUBLIC_WEBSITE_ORIGIN: website },
  )));
  expect(responses.map(response => response.headers.get('x-robots-tag'))).toEqual([null, 'noindex', 'noindex']);
  for (const response of responses) expect(await response.json()).toEqual({ status: 'ok' });
});
