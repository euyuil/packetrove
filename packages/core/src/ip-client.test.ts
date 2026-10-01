import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupPublicIp } from './index';

afterEach(() => vi.unstubAllGlobals());

describe('shared public IP HTTP client', () => {
  it('requests uncached anonymous JSON and validates the result', async () => {
    const fetch = vi.fn(async () => Response.json({ ip: '2001:db8::1', family: 'ipv6' }));
    vi.stubGlobal('fetch', fetch);
    expect(await lookupPublicIp('/api/v1/ip')).toEqual({ ip: '2001:db8::1', family: 'ipv6' });
    expect(fetch).toHaveBeenCalledWith('/api/v1/ip', expect.objectContaining({
      cache: 'no-store', credentials: 'omit', redirect: 'error', headers: { accept: 'application/json' },
      signal: expect.any(AbortSignal),
    }));
  });
  it('preserves a structured unavailable error from the server', async () => {
    vi.stubGlobal('fetch', async () => Response.json({
      error: { code: 'CLIENT_IP_UNAVAILABLE', message: 'Connection metadata is unavailable.' },
    }, { status: 503 }));
    await expect(lookupPublicIp('/api/v1/ip')).rejects.toMatchObject({ code: 'CLIENT_IP_UNAVAILABLE' });
  });
  it.each([
    Response.json({ ip: '2001:db8::1', family: 'ipv4' }),
    new Response('<html>Unavailable</html>'),
  ])('rejects malformed JSON or a mismatched IP family', async response => {
    vi.stubGlobal('fetch', async () => response);
    await expect(lookupPublicIp('/api/v1/ip')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
  it('reports network failures without leaking exception details', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('private network detail'); });
    await expect(lookupPublicIp('/api/v1/ip')).rejects.toMatchObject({
      code: 'NETWORK_ERROR', message: 'Unable to reach the IP lookup service. Check your connection and try again.',
    });
  });
  it('passes caller cancellation through to the network request', async () => {
    const controller = new AbortController();
    const fetch = vi.fn(async (_endpoint: string | URL, options: RequestInit) => {
      expect(options.signal?.aborted).toBe(true);
      throw new DOMException('Cancelled', 'AbortError');
    });
    vi.stubGlobal('fetch', fetch);
    controller.abort();
    await expect(lookupPublicIp('/api/v1/ip', controller.signal)).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
