import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BodyLimitError, lookupPublicIp, MAX_PUBLIC_IP_RESPONSE_BYTES } from './index';

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
  it.each([undefined, '1'])('accepts valid JSON exactly at the actual byte limit (content-length: %s)', async length => {
    const result = { ip: '203.0.113.1', family: 'ipv4' };
    const json = JSON.stringify(result);
    vi.stubGlobal('fetch', async () => new Response(json + ' '.repeat(MAX_PUBLIC_IP_RESPONSE_BYTES - json.length), {
      ...(length === undefined ? {} : { headers: { 'content-length': length } }),
    }));
    expect(await lookupPublicIp('/v1/public-ip')).toEqual(result);
  });
  it.each([200, 503])('cancels an oversized HTTP %s body before EOF and reports INVALID_RESPONSE', async status => {
    let pulls = 0;
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++;
        controller.enqueue(new Uint8Array(pulls === 1 ? MAX_PUBLIC_IP_RESPONSE_BYTES : 1));
      },
      cancel,
    }, { highWaterMark: 0 });
    vi.stubGlobal('fetch', async () => new Response(stream, { status, headers: { 'content-length': '1' } }));
    await expect(lookupPublicIp('/v1/public-ip')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE', message: 'The IP lookup service returned an invalid response. Please try again.',
    });
    expect(pulls).toBe(2);
    expect(cancel).toHaveBeenCalledOnce();
    expect(stream.locked).toBe(false);
  });
  it('rejects previously valid oversized JSON instead of accepting its service error code', async () => {
    const json = JSON.stringify({ error: { code: 'CLIENT_IP_UNAVAILABLE', message: '€'.repeat(MAX_PUBLIC_IP_RESPONSE_BYTES / 2) } });
    expect(json.length).toBeLessThan(MAX_PUBLIC_IP_RESPONSE_BYTES);
    vi.stubGlobal('fetch', async () => new Response(json, { status: 503 }));
    await expect(lookupPublicIp('/v1/public-ip')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
  it('preserves replacement decoding and split multibyte text in a structured service error', async () => {
    const before = new TextEncoder().encode('{"error":{"code":"CLIENT_IP_UNAVAILABLE","message":"');
    const after = new TextEncoder().encode('"}}');
    vi.stubGlobal('fetch', async () => new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(before);
        controller.enqueue(Uint8Array.of(0xff, 0xe2));
        controller.enqueue(Uint8Array.of(0x82, 0xac));
        controller.enqueue(after);
        controller.close();
      },
    }), { status: 503 }));
    await expect(lookupPublicIp('/v1/public-ip')).rejects.toMatchObject({ code: 'CLIENT_IP_UNAVAILABLE', message: '�€' });
  });
  it('keeps a caller-supplied size-error abort reason classified as NETWORK_ERROR', async () => {
    const reason = new BodyLimitError();
    const caller = new AbortController();
    caller.abort(reason);
    // Native fetch rejects the already-aborted signal without making a request.
    const fetch = vi.fn(globalThis.fetch);
    vi.stubGlobal('fetch', fetch);
    await expect(lookupPublicIp('http://localhost/v1/public-ip', caller.signal)).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    await expect(fetch.mock.results[0]!.value).rejects.toBe(reason);
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

  it.each(['success', 'network failure', 'invalid JSON', 'oversized body'])('releases the timeout and caller listener after %s', async outcome => {
    const caller = new AbortController();
    let request!: AbortSignal;
    const removeListener = vi.spyOn(caller.signal, 'removeEventListener');
    vi.stubGlobal('fetch', async (_endpoint: string | URL, options: RequestInit) => {
      request = options.signal!;
      if (outcome === 'network failure') throw new Error('private network detail');
      if (outcome === 'oversized body') return new Response(' '.repeat(MAX_PUBLIC_IP_RESPONSE_BYTES + 1));
      return outcome === 'invalid JSON' ? new Response('{') : Response.json({ ip: '203.0.113.1', family: 'ipv4' });
    });
    const pending = lookupPublicIp('/v1/public-ip', caller.signal);
    if (outcome === 'success') await expect(pending).resolves.toMatchObject({ family: 'ipv4' });
    else await expect(pending).rejects.toMatchObject({ code: outcome === 'network failure' ? 'NETWORK_ERROR' : 'INVALID_RESPONSE' });
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
    caller.abort();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(request.aborted).toBe(false);
  });
});
