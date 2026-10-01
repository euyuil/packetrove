import { exports } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import { CIDR_COVER_EXAMPLES, CIDR_COVER_PATH, ErrorResponseSchema, MAX_REQUEST_BYTES } from '@packetrove/contracts';
import { createOpenApiDocument } from '@packetrove/contracts/openapi';
import { smallestCoveringCidr } from '@packetrove/core';
import { createApp } from '../src/app';

function post(body: string, headers: Record<string, string> = { 'content-type': 'application/json' }) {
  return exports.default.fetch(`http://localhost${CIDR_COVER_PATH}`, { method: 'POST', headers, body });
}

describe('API in the Workers runtime', () => {
  it.each(CIDR_COVER_EXAMPLES)('serves $name', async ({ request, result }) => {
    const response = await post(JSON.stringify(request));
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(await response.json()).toEqual(result);
  });
  it('returns the same shared-core result as the browser for equivalent dotted-tail IPv6 inputs', async () => {
    const request = { inputs: ['::192.0.2.1', '::c000:201'] };
    const result = smallestCoveringCidr(request);
    expect(result).toMatchObject({
      cidr: '::c000:201/128', inputAddressCount: '1', coveredAddressCount: '1', additionalAddressCount: '0',
    });
    const response = await post(JSON.stringify(request));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
  });
  it.each([
    ['{', 'INVALID_JSON'],
    [JSON.stringify({ inputs: [] }), 'INVALID_INPUT'],
    [JSON.stringify({ inputs: ['invalid'] }), 'INVALID_INPUT'],
    [JSON.stringify({ inputs: ['::1', '203.0.113.1'] }), 'MIXED_ADDRESS_FAMILIES'],
    [JSON.stringify({ inputs: new Array(1001).fill('::1') }), 'INVALID_INPUT'],
  ])('rejects bad requests with %s', async (body, code) => {
    const response = await post(body);
    expect(response.status).toBe(400);
    const error = ErrorResponseSchema.parse(await response.json());
    expect(error.error.code).toBe(code);
  });
  it('accepts the entry limit and normalizes host bits', async () => {
    const response = await post(JSON.stringify({ inputs: new Array(1000).fill('203.0.113.7/24') }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ cidr: '203.0.113.0/24', inputAddressCount: '256' });
  });
  it('rejects unsupported media types', async () => {
    const response = await post('{}', { 'content-type': 'text/plain' });
    expect(response.status).toBe(415);
    expect(await response.json()).toMatchObject({ error: { code: 'UNSUPPORTED_MEDIA_TYPE' } });
  });
  it('rejects an oversized body', async () => {
    const response = await post(' '.repeat(MAX_REQUEST_BYTES + 1));
    expect(response.status).toBe(413);
  });
  it('enforces actual streamed bytes, without trusting content-length', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_REQUEST_BYTES));
        controller.enqueue(new Uint8Array(1));
        controller.close();
      },
    });
    const request = new Request(`http://localhost${CIDR_COVER_PATH}`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '1' }, body: stream,
    });
    const response = await createApp().fetch(request);
    expect(response.status).toBe(413);
  });
  it('allows a body exactly at the byte limit', async () => {
    const json = JSON.stringify({ inputs: ['::1'] });
    const response = await post(json + ' '.repeat(MAX_REQUEST_BYTES - json.length));
    expect(response.status).toBe(200);
  });
  it('returns indexed entry errors', async () => {
    const response = await post(JSON.stringify({ inputs: ['::1', 'bad'] }));
    expect(await response.json()).toMatchObject({ error: { issues: [{ index: 1 }] } });
  });
  it('serves health and the exact generated specification', async () => {
    expect(await (await exports.default.fetch('http://localhost/health')).json()).toEqual({ status: 'ok' });
    expect(await (await exports.default.fetch('http://localhost/api/openapi.json')).json()).toEqual(createOpenApiDocument());
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
  it('supports API preflight', async () => {
    const response = await exports.default.fetch(`http://localhost${CIDR_COVER_PATH}`, {
      method: 'OPTIONS', headers: { origin: 'https://client.example', 'access-control-request-method': 'POST' },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });
  it('returns JSON for unknown routes and unsupported methods', async () => {
    for (const headers of [{}, { 'sec-fetch-mode': 'navigate', accept: 'text/html' }]) {
      const unknown = await exports.default.fetch('http://localhost/api/unknown', { headers });
      expect(unknown.status).toBe(404);
      expect(unknown.headers.get('content-type')).toContain('application/json');
      expect(ErrorResponseSchema.parse(await unknown.json()).error.code).toBe('NOT_FOUND');
    }
    const response = await exports.default.fetch(`http://localhost${CIDR_COVER_PATH}`);
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });
  it('does not expose exception details on unexpected errors', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const app = createApp();
      app.get('/test-error', () => { throw new Error('private exception detail'); });
      const response = await app.request('http://localhost/test-error');
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
    } finally {
      spy.mockRestore();
    }
  });
});
