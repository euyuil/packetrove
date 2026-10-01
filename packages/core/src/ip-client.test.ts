import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupPublicIp } from './index';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('shared public IP HTTP client', () => {
  it.each([
    { ip: '203.0.113.1', family: 'ipv4' },
    { ip: '2001:db8::1', family: 'ipv6' },
  ])('requests uncached anonymous JSON and validates $family', async result => {
    const fetch = vi.fn(async () => Response.json(result));
    vi.stubGlobal('fetch', fetch);
    expect(await lookupPublicIp('/api/v1/ip')).toEqual(result);
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
  it('reports an interrupted response body as a network failure without exposing details', async () => {
    vi.stubGlobal('fetch', async () => new Response(new ReadableStream({
      start(controller) { controller.error(new Error('private transfer detail')); },
    })));
    await expect(lookupPublicIp('/api/v1/ip')).rejects.toMatchObject({
      code: 'NETWORK_ERROR', message: 'Unable to reach the IP lookup service. Check your connection and try again.',
    });
  });
  it.each(['headers', 'body'])('uses the single request timeout while waiting for %s', async stage => {
    const timeout = new AbortController();
    const timeoutFactory = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeout.signal);
    vi.stubGlobal('fetch', async (_endpoint: string | URL, options: RequestInit) => {
      const signal = options.signal!;
      if (stage === 'headers') {
        return new Promise<Response>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        });
      }
      return new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{'));
          signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
        },
      }));
    });
    const pending = lookupPublicIp('/api/v1/ip');
    timeout.abort(new DOMException('Timed out', 'TimeoutError'));
    await expect(pending).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    expect(timeoutFactory).toHaveBeenCalledExactlyOnceWith(10_000);
  });
  it('reports caller cancellation while reading a response body as a network failure', async () => {
    const caller = new AbortController();
    vi.stubGlobal('fetch', async (_endpoint: string | URL, options: RequestInit) => new Response(new ReadableStream({
      start(controller) {
        options.signal!.addEventListener('abort', () => controller.error(options.signal!.reason), { once: true });
      },
    })));
    const pending = lookupPublicIp('/api/v1/ip', caller.signal);
    caller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
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
