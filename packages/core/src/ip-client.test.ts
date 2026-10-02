import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lookupPublicIp } from './index';

const apiModes: Array<{ name: string; missing: Array<'any' | 'timeout'> }> = [
  { name: 'native helpers available', missing: [] },
  { name: 'any unavailable', missing: ['any'] },
  { name: 'timeout unavailable', missing: ['timeout'] },
  { name: 'both helpers unavailable', missing: ['any', 'timeout'] },
];

function hideAbortMethods(missing: Array<'any' | 'timeout'>) {
  const unavailable = new Set<PropertyKey>(missing);
  vi.stubGlobal('AbortSignal', new Proxy(AbortSignal, {
    get(target, property, receiver) {
      return unavailable.has(property) ? undefined : Reflect.get(target, property, receiver);
    },
  }));
}

function unfinishedBody(signal: AbortSignal) {
  return new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{'));
      signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
    },
  }));
}

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('shared public IP HTTP client', () => {
  it.each(apiModes.flatMap(mode => [
    { ip: '203.0.113.1', family: 'ipv4' },
    { ip: '2001:db8::1', family: 'ipv6' },
  ].map(result => ({ ...mode, result }))))('requests uncached anonymous $result.family JSON with $name', async ({ missing, result }) => {
    hideAbortMethods(missing);
    const fetch = vi.fn(async () => Response.json(result));
    vi.stubGlobal('fetch', fetch);
    expect(await lookupPublicIp('/v1/public-ip')).toEqual(result);
    expect(fetch).toHaveBeenCalledWith('/v1/public-ip', expect.objectContaining({
      cache: 'no-store', credentials: 'omit', redirect: 'error', headers: { accept: 'application/json' },
      signal: expect.any(AbortSignal),
    }));
  });
  it('preserves a structured unavailable error from the server', async () => {
    vi.stubGlobal('fetch', async () => Response.json({
      error: { code: 'CLIENT_IP_UNAVAILABLE', message: 'Connection metadata is unavailable.' },
    }, { status: 503 }));
    await expect(lookupPublicIp('/v1/public-ip')).rejects.toMatchObject({ code: 'CLIENT_IP_UNAVAILABLE' });
  });
  it.each([
    Response.json({ ip: '2001:db8::1', family: 'ipv4' }),
    new Response('<html>Unavailable</html>'),
  ])('rejects malformed JSON or a mismatched IP family', async response => {
    vi.stubGlobal('fetch', async () => response);
    await expect(lookupPublicIp('/v1/public-ip')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
  it('reports network failures without leaking exception details', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('private network detail'); });
    await expect(lookupPublicIp('/v1/public-ip')).rejects.toMatchObject({
      code: 'NETWORK_ERROR', message: 'Unable to reach the IP lookup service. Check your connection and try again.',
    });
  });
  it('reports an interrupted response body as a network failure without exposing details', async () => {
    vi.stubGlobal('fetch', async () => new Response(new ReadableStream({
      start(controller) { controller.error(new Error('private transfer detail')); },
    })));
    await expect(lookupPublicIp('/v1/public-ip')).rejects.toMatchObject({
      code: 'NETWORK_ERROR', message: 'Unable to reach the IP lookup service. Check your connection and try again.',
    });
  });
});

describe.each(apiModes)('IP request cancellation with $name', ({ missing }) => {
  beforeEach(() => { hideAbortMethods(missing); vi.useFakeTimers(); });

  it.each(['headers', 'body'])('times out after ten seconds while waiting for %s', async stage => {
    let request!: AbortSignal;
    vi.stubGlobal('fetch', async (_endpoint: string | URL, options: RequestInit) => {
      request = options.signal!;
      return stage === 'body' ? unfinishedBody(request) : new Promise<Response>((_resolve, reject) => {
        request.addEventListener('abort', () => reject(request.reason), { once: true });
      });
    });
    const failure = expect(lookupPublicIp('/v1/public-ip')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    await vi.advanceTimersByTimeAsync(9_999);
    expect(request.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await failure;
    expect(request.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses the remaining budget for the body after six seconds waiting for headers', async () => {
    let request!: AbortSignal;
    vi.stubGlobal('fetch', (_endpoint: string | URL, options: RequestInit) => {
      request = options.signal!;
      return new Promise<Response>(resolve => {
        setTimeout(() => resolve(unfinishedBody(request)), 6_000);
      });
    });
    const failure = expect(lookupPublicIp('/v1/public-ip')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    await vi.advanceTimersByTimeAsync(9_999);
    expect(request.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await failure;
    expect(request.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['headers', 'body'])('cancels on the caller signal while waiting for %s', async stage => {
    const caller = new AbortController();
    let request!: AbortSignal;
    vi.stubGlobal('fetch', async (_endpoint: string | URL, options: RequestInit) => {
      request = options.signal!;
      return stage === 'body' ? unfinishedBody(request) : new Promise<Response>((_resolve, reject) => {
        request.addEventListener('abort', () => reject(request.reason), { once: true });
      });
    });
    const failure = expect(lookupPublicIp('/v1/public-ip', caller.signal)).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    await vi.advanceTimersByTimeAsync(1_000);
    caller.abort();
    await failure;
    expect(request.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('passes an already cancelled caller signal to fetch', async () => {
    const caller = new AbortController();
    caller.abort();
    vi.stubGlobal('fetch', async (_endpoint: string | URL, options: RequestInit) => {
      expect(options.signal?.aborted).toBe(true);
      throw options.signal!.reason;
    });
    await expect(lookupPublicIp('/v1/public-ip', caller.signal)).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['success', 'network failure', 'invalid JSON'])('releases the timeout and caller listener after %s', async outcome => {
    const caller = new AbortController();
    let request!: AbortSignal;
    const removeListener = vi.spyOn(caller.signal, 'removeEventListener');
    vi.stubGlobal('fetch', async (_endpoint: string | URL, options: RequestInit) => {
      request = options.signal!;
      if (outcome === 'network failure') throw new Error('private network detail');
      return outcome === 'invalid JSON' ? new Response('{') : Response.json({ ip: '203.0.113.1', family: 'ipv4' });
    });
    const pending = lookupPublicIp('/v1/public-ip', caller.signal);
    if (outcome === 'success') await expect(pending).resolves.toMatchObject({ family: 'ipv4' });
    else await expect(pending).rejects.toMatchObject({ code: outcome === 'invalid JSON' ? 'INVALID_RESPONSE' : 'NETWORK_ERROR' });
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
    caller.abort();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(request.aborted).toBe(false);
  });
});
