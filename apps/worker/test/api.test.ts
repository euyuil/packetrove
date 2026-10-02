import { exports } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import {
  CIDR_COVER_EXAMPLES, CIDR_COVER_PATH, CIDR_SUBTRACT_EXAMPLES, CIDR_SUBTRACT_PATH,
  CidrSubtractResultSchema, ErrorResponseSchema, MAX_REQUEST_BYTES, tools,
} from '@packetrove/contracts';
import { createOpenApiDocument } from '@packetrove/contracts/openapi';
import { smallestCoveringCidr, subtractCidrs } from '@packetrove/core';
import { createApp } from '../src/app';

function post(body: string, headers: Record<string, string> = { 'content-type': 'application/json' }) {
  return exports.default.fetch(`http://localhost${CIDR_COVER_PATH}`, { method: 'POST', headers, body });
}

describe('API in the Workers runtime', () => {
  it.each(tools)('serves every catalog entry: $id', async tool => {
    const response = await exports.default.fetch(`http://localhost${tool.api.path}`, {
      method: tool.api.method.toUpperCase(),
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.1' },
      ...(tool.api.method === 'post' ? { body: JSON.stringify(tool.example.request) } : {}),
    });
    expect(response.status).toBe(200);
    expect(tool.outputSchema.parse(await response.json())).toEqual(tool.example.result);
    expect(Object.keys(createOpenApiDocument().paths!)).toContain(tool.api.path);
  });
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
  it('returns all invalid entry indices in one shared error response', async () => {
    const response = await post(JSON.stringify({ inputs: ['203.0.113.1', 'bad', '203.0.113.2', '::/129'] }));
    expect(response.status).toBe(400);
    const error = ErrorResponseSchema.parse(await response.json()).error;
    expect(error.code).toBe('INVALID_INPUT');
    expect(error.message).toBe('Expected valid IP addresses or CIDRs.');
    expect(error.issues?.map(issue => issue.index)).toEqual([1, 3]);
    expect(error.issues?.every(issue => issue.message.length > 0)).toBe(true);
  });
  it('serves health and the exact generated specification', async () => {
    expect(await (await exports.default.fetch('http://localhost/health')).json()).toEqual({ status: 'ok' });
    expect(await (await exports.default.fetch('http://localhost/openapi.json')).json()).toEqual(createOpenApiDocument());
  });
  it('serves the specification with anonymous CORS, a content ETag, and no application cookies', async () => {
    const response = await exports.default.fetch('http://localhost/openapi.json', {
      headers: { origin: 'https://client.example' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    const etag = response.headers.get('etag');
    expect(etag).toBeTruthy();
    const unchanged = await exports.default.fetch('http://localhost/openapi.json', {
      headers: { 'if-none-match': etag! },
    });
    expect(unchanged.status).toBe(304);
    expect(await unchanged.text()).toBe('');
    const head = await exports.default.fetch('http://localhost/openapi.json', { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(head.headers.get('etag')).toBe(etag);
    expect(await head.text()).toBe('');
  });
  it('allows browser access to every documented endpoint and preserves structured specification method errors', async () => {
    const health = await exports.default.fetch('http://localhost/health', { headers: { origin: 'https://client.example' } });
    expect(health.headers.get('access-control-allow-origin')).toBe('*');
    const preflight = await exports.default.fetch('http://localhost/openapi.json', {
      method: 'OPTIONS', headers: { origin: 'https://client.example', 'access-control-request-method': 'GET' },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('*');
    const unsupported = await exports.default.fetch('http://localhost/openapi.json', { method: 'POST' });
    expect(unsupported.status).toBe(405);
    expect(unsupported.headers.get('allow')).toBe('GET, HEAD');
    expect(ErrorResponseSchema.parse(await unsupported.json()).error.code).toBe('METHOD_NOT_ALLOWED');
  });
  it.each(['/', '/cidr', '/ip', '/public-ip', '/docs/api', '/assets/main.js', '/_headers', '/api/v1/ip', '/api/v1/public-ip', '/api/openapi.json', '/v1/ip'])('does not serve website assets or old API paths at %s', async path => {
    const response = await exports.default.fetch(`http://localhost${path}`, {
      headers: { 'sec-fetch-mode': 'navigate', accept: 'text/html' },
    });
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(ErrorResponseSchema.parse(await response.json()).error.code).toBe('NOT_FOUND');
  });
  it('supports API preflight', async () => {
    const response = await exports.default.fetch(`http://localhost${CIDR_COVER_PATH}`, {
      method: 'OPTIONS', headers: { origin: 'https://client.example', 'access-control-request-method': 'POST' },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });
  it('returns JSON for unknown routes and unsupported methods', async () => {
    for (const headers of [{}, { 'sec-fetch-mode': 'navigate', accept: 'text/html' }]) {
      const unknown = await exports.default.fetch('http://localhost/v1/unknown', { headers });
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

function subtractPost(value: unknown) {
  return exports.default.fetch(`http://localhost${CIDR_SUBTRACT_PATH}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value),
  });
}

describe('CIDR subtraction over API', () => {
  it.each(CIDR_SUBTRACT_EXAMPLES)('returns the shared exact $name result', async ({ request, result }) => {
    const response = await subtractPost(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(CidrSubtractResultSchema.parse(await response.json())).toEqual(result);
    expect(result).toEqual(subtractCidrs(request));
  });
  it.each([
    { include: ['::/0'], exclude: [] },
    { include: ['203.0.113.7/24', '203.0.113.0/25'], exclude: ['203.0.113.64/26', '203.0.113.64/27'] },
    { include: ['203.0.113.0/24'], exclude: ['203.0.113.0/24'] },
    { include: new Array(500).fill('::/128'), exclude: new Array(500).fill('::1/128') },
  ])('preserves exact counts, overlap handling, and empty results', async request => {
    const response = await subtractPost(request);
    expect(response.status).toBe(200);
    expect(CidrSubtractResultSchema.parse(await response.json())).toEqual(subtractCidrs(request));
  });
  it('identifies the list and entry for every invalid address', async () => {
    const response = await subtractPost({ include: ['bad'], exclude: ['::/129'] });
    expect(response.status).toBe(400);
    expect(ErrorResponseSchema.parse(await response.json()).error).toMatchObject({
      code: 'INVALID_INPUT', issues: [{ list: 'include', index: 0 }, { list: 'exclude', index: 0 }],
    });
  });
  it.each([
    [{ include: [], exclude: [] }, 'INVALID_INPUT'],
    [{ include: ['::/0'], exclude: ['203.0.113.1'] }, 'MIXED_ADDRESS_FAMILIES'],
    [{ include: new Array(501).fill('::1'), exclude: new Array(500).fill('::2') }, 'INVALID_INPUT'],
    [{ include: ['::1'], exclude: [], extra: true }, 'INVALID_INPUT'],
  ])('rejects malformed or excessive input', async (request, code) => {
    const response = await subtractPost(request);
    expect(response.status).toBe(400);
    expect(ErrorResponseSchema.parse(await response.json()).error.code).toBe(code);
  });
  it('rejects excessive output without a partial list', async () => {
    const response = await subtractPost({
      include: Array.from({ length: 126 }, (_, i) => `2001:db8:${(i * 2).toString(16)}::/48`),
      exclude: Array.from({ length: 126 }, (_, i) => `2001:db8:${(i * 2).toString(16)}::1/128`),
    });
    expect(response.status).toBe(400);
    const result = await response.json();
    expect(ErrorResponseSchema.parse(result).error.code).toBe('INVALID_INPUT');
    expect(result).not.toHaveProperty('cidrs');
  });
  it.each([
    { body: '{', type: 'application/json', status: 400, code: 'INVALID_JSON' },
    { body: '{}', type: 'text/plain', status: 415, code: 'UNSUPPORTED_MEDIA_TYPE' },
    { body: ' '.repeat(MAX_REQUEST_BYTES + 1), type: 'application/json', status: 413, code: 'PAYLOAD_TOO_LARGE' },
  ])('enforces the shared HTTP boundary: $code', async ({ body, type, status, code }) => {
    const response = await exports.default.fetch(`http://localhost${CIDR_SUBTRACT_PATH}`, {
      method: 'POST', headers: { 'content-type': type }, body,
    });
    expect(response.status).toBe(status);
    expect(ErrorResponseSchema.parse(await response.json()).error.code).toBe(code);
  });
  it('supports anonymous preflight and structured method errors', async () => {
    const preflight = await exports.default.fetch(`http://localhost${CIDR_SUBTRACT_PATH}`, {
      method: 'OPTIONS', headers: { origin: 'https://client.example', 'access-control-request-method': 'POST' },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('*');
    const response = await exports.default.fetch(`http://localhost${CIDR_SUBTRACT_PATH}`);
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    expect(ErrorResponseSchema.parse(await response.json()).error.code).toBe('METHOD_NOT_ALLOWED');
  });
});
