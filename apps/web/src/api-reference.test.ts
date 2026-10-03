import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchApiReference } from './api-reference';

afterEach(() => vi.unstubAllGlobals());

describe('API documentation requests', () => {
  it('sends the request directly to its API URL with cookies omitted and its body intact', async () => {
    const calls: Request[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(new Request(input, init));
      return Response.json({});
    });
    const request = new Request('https://api.example/v1/cidr-cover', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ inputs: ['203.0.113.1', '203.0.113.2'] }),
    });
    await fetchApiReference(request);
    expect(calls).toHaveLength(1);
    const sent = calls[0]!;
    expect(sent.url).toBe('https://api.example/v1/cidr-cover');
    expect(sent.method).toBe('POST');
    expect(sent.credentials).toBe('omit');
    expect(await sent.json()).toEqual({ inputs: ['203.0.113.1', '203.0.113.2'] });
  });

  it('prevents cached public IP checks while preserving static specification revalidation', async () => {
    const calls: Request[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(new Request(input, init));
      return Response.json({});
    });
    await fetchApiReference('https://api.example/v1/public-ip', { cache: 'force-cache', credentials: 'include' });
    await fetchApiReference('https://api.example/openapi.json');
    expect(calls[0]!.cache).toBe('no-store');
    expect(calls[1]!.cache).toBe('default');
    expect(calls.every(request => request.credentials === 'omit')).toBe(true);
  });
});
