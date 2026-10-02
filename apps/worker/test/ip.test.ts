import { exports } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import { ErrorResponseSchema, PUBLIC_IP_PATH, PublicIpResultSchema } from '@packetrove/contracts';

function lookup(headers: Record<string, string> = {}, method = 'GET') {
  return exports.default.fetch(`http://localhost${PUBLIC_IP_PATH}`, { headers, method });
}

describe('current public IP in the Workers runtime', () => {
  it.each([
    { ip: '203.0.113.1', family: 'ipv4' },
    { ip: '2001:db8::1', family: 'ipv6' },
    { ip: '::ffff:203.0.113.1', family: 'ipv6' },
  ])('observes the current connection: $ip', async result => {
    const response = await lookup({ 'cf-connecting-ip': result.ip });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(PublicIpResultSchema.parse(await response.json())).toEqual(result);
  });

  it.each([
    { headers: { 'cf-connecting-ip': '203.0.113.1' }, ip: '203.0.113.1' },
    { headers: { 'cf-connecting-ip': '2001:db8::1' }, ip: '2001:db8::1' },
    { headers: { 'cf-connecting-ip': '240.0.0.1', 'cf-connecting-ipv6': '2001:db8::7' }, ip: '2001:db8::7' },
  ])('returns a newline-terminated plain-text address when requested: $ip', async ({ headers, ip }) => {
    const response = await lookup({ ...headers, accept: 'text/plain' });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=UTF-8');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('vary')).toBe('Accept');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(await response.text()).toBe(`${ip}\n`);
  });

  it.each([
    { accept: '*/*', type: 'application/json' },
    { accept: 'text/html', type: 'application/json' },
    { accept: 'text/plain;q=0', type: 'application/json' },
    { accept: 'text/plain;q=0.5, application/json;q=1', type: 'application/json' },
    { accept: 'application/json;q=0.5, text/plain;q=1', type: 'text/plain' },
    { accept: 'text/*', type: 'text/plain' },
  ])('selects a supported response for Accept: $accept', async ({ accept, type }) => {
    const response = await lookup({ 'cf-connecting-ip': '203.0.113.1', accept });
    expect(response.headers.get('content-type')).toContain(type);
    expect(type === 'text/plain' ? await response.text() : await response.json())
      .toEqual(type === 'text/plain' ? '203.0.113.1\n' : { ip: '203.0.113.1', family: 'ipv4' });
  });

  it.each([
    { headers: {}, method: 'GET', status: 503, code: 'CLIENT_IP_UNAVAILABLE' },
    { headers: { 'cf-connecting-ip': 'invalid' }, method: 'GET', status: 503, code: 'CLIENT_IP_UNAVAILABLE' },
    { headers: {}, method: 'POST', status: 405, code: 'METHOD_NOT_ALLOWED' },
  ])('keeps plain-text request errors structured and uncached: $code', async ({ headers, method, status, code }) => {
    const response = await lookup({ ...headers, accept: 'text/plain' }, method);
    expect(response.status).toBe(status);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(ErrorResponseSchema.parse(await response.json()).error.code).toBe(code);
  });

  it('ignores caller-supplied forwarded addresses and query parameters', async () => {
    const response = await exports.default.fetch(`http://localhost${PUBLIC_IP_PATH}?ip=198.51.100.10`, {
      headers: {
        'cf-connecting-ip': '203.0.113.1', 'x-forwarded-for': '198.51.100.10',
        'x-real-ip': '198.51.100.11', 'cf-connecting-ipv6': '2001:db8::99',
      },
    });
    expect(await response.json()).toEqual({ ip: '203.0.113.1', family: 'ipv4' });
  });

  it('recovers real IPv6 when Pseudo IPv4 overwrites the connection header', async () => {
    const response = await lookup({ 'cf-connecting-ip': '240.0.0.1', 'cf-connecting-ipv6': '2001:db8::7' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ip: '2001:db8::7', family: 'ipv6' });
  });

  it.each([
    {},
    { 'x-forwarded-for': '203.0.113.1', 'x-real-ip': '203.0.113.1' },
    { 'cf-connecting-ip': 'invalid' },
    { 'cf-connecting-ip': '203.0.113.1, 203.0.113.2' },
    { 'cf-connecting-ip': '203.000.113.1' },
    { 'cf-connecting-ip': '203.0.113.1/32' },
    { 'cf-connecting-ip': 'fe80::1%eth0' },
    { 'cf-connecting-ip': '240.0.0.1' },
    { 'cf-connecting-ip': '240.0.0.1', 'cf-connecting-ipv6': '203.0.113.1' },
  ])('reports unavailable connection metadata without guessing: %j', async headers => {
    const response = await lookup(headers);
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(ErrorResponseSchema.parse(await response.json()).error.code).toBe('CLIENT_IP_UNAVAILABLE');
  });

  it('keeps concurrent client results separate and observes subsequent changes', async () => {
    const addresses = ['203.0.113.1', '203.0.113.2', '2001:db8::1'];
    const results = await Promise.all(addresses.map(async ip => {
      const response = await lookup({ 'cf-connecting-ip': ip });
      return PublicIpResultSchema.parse(await response.json()).ip;
    }));
    expect(results).toEqual(addresses);
    expect((await (await lookup({ 'cf-connecting-ip': '203.0.113.3' })).json() as { ip: string }).ip)
      .toBe('203.0.113.3');
  });

  it('isolates concurrent clients using different response formats', async () => {
    const [plain, json] = await Promise.all([
      lookup({ 'cf-connecting-ip': '203.0.113.1', accept: 'text/plain' }),
      lookup({ 'cf-connecting-ip': '2001:db8::1', accept: 'application/json' }),
    ]);
    expect(await plain.text()).toBe('203.0.113.1\n');
    expect(await json.json()).toEqual({ ip: '2001:db8::1', family: 'ipv6' });
  });

  it('supports HEAD and rejects unsupported methods without caching the error', async () => {
    const response = await lookup({ 'cf-connecting-ip': '203.0.113.1' }, 'HEAD');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const plain = await lookup({ 'cf-connecting-ip': '203.0.113.1', accept: 'text/plain' }, 'HEAD');
    expect(plain.status).toBe(200);
    expect(plain.headers.get('content-type')).toContain('text/plain');
    expect(await plain.text()).toBe('');
    const unsupported = await lookup({}, 'POST');
    expect(unsupported.status).toBe(405);
    expect(unsupported.headers.get('allow')).toBe('GET, HEAD');
    expect(unsupported.headers.get('cache-control')).toBe('no-store');
  });

  it('does not log successful lookups or unavailable metadata', async () => {
    const log = vi.spyOn(console, 'log');
    const error = vi.spyOn(console, 'error');
    try {
      await lookup({ 'cf-connecting-ip': '203.0.113.1' });
      await lookup({ 'cf-connecting-ip': '203.0.113.1', accept: 'text/plain' });
      await lookup();
      await lookup({ accept: 'text/plain' });
      expect(log).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    } finally { log.mockRestore(); error.mockRestore(); }
  });
});
