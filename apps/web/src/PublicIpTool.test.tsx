import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { PublicIpTool } from './PublicIpTool';
import { render } from './test-utils';

function hideStaticAbortMethods() {
  vi.stubGlobal('AbortSignal', new Proxy(AbortSignal, {
    get(target, property, receiver) {
      return property === 'any' || property === 'timeout' ? undefined : Reflect.get(target, property, receiver);
    },
  }));
}

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
});

describe('public IP web tool', () => {
  it('queries on opening and presents the observed address and family', async () => {
    let resolve!: (response: Response) => void;
    const fetch = vi.fn(() => new Promise<Response>(complete => { resolve = complete; }));
    vi.stubGlobal('fetch', fetch);
    render(<PublicIpTool />);
    expect(screen.getByText('Checking your public IP…')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Checking…' }).getAttribute('aria-disabled')).toBe('true');
    resolve(Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    expect(await screen.findByText('203.0.113.1')).toBeDefined();
    expect(screen.getByText('IPv4')).toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://api.packetrove.com/v1/public-ip', expect.objectContaining({
      cache: 'no-store', credentials: 'omit', redirect: 'error',
    }));
  });

  it('queries a contributor-configured API origin without browser credentials', async () => {
    vi.stubEnv('VITE_API_ORIGIN', 'https://api.example.com');
    const fetch = vi.fn().mockResolvedValue(Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    vi.stubGlobal('fetch', fetch);
    render(<PublicIpTool />);
    await screen.findByText('203.0.113.1');
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/v1/public-ip', expect.objectContaining({ credentials: 'omit' }));
  });

  it('queries and displays an IP without static AbortSignal helpers', async () => {
    hideStaticAbortMethods();
    const fetch = vi.fn(async () => Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    vi.stubGlobal('fetch', fetch);
    render(<PublicIpTool />);
    expect(await screen.findByText('203.0.113.1')).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(fetch).toHaveBeenCalledExactlyOnceWith('https://api.packetrove.com/v1/public-ip', expect.objectContaining({
      cache: 'no-store', credentials: 'omit', redirect: 'error',
    }));
  });

  it('clears an old address while refreshing and accepts a changed address family', async () => {
    let resolve!: (response: Response) => void;
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ ip: '203.0.113.1', family: 'ipv4' }))
      .mockImplementationOnce(() => new Promise<Response>(complete => { resolve = complete; }));
    vi.stubGlobal('fetch', fetch);
    render(<PublicIpTool />);
    await screen.findByText('203.0.113.1');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh IP' }));
    expect(screen.queryByText('203.0.113.1')).toBeNull();
    expect(screen.getByText('Checking your public IP…')).toBeDefined();
    resolve(Response.json({ ip: '2001:db8::7', family: 'ipv6' }));
    expect(await screen.findByText('2001:db8::7')).toBeDefined();
    expect(screen.getByText('IPv6')).toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each(['request', 'response body'])('shows useful %s network errors and retries without exposing details', async stage => {
    const fetch = vi.fn();
    const failure = new Error('private proxy detail');
    if (stage === 'request') fetch.mockRejectedValueOnce(failure);
    else fetch.mockResolvedValueOnce(new Response(new ReadableStream({
      start(controller) { controller.error(failure); },
    })));
    vi.stubGlobal('fetch', fetch.mockResolvedValueOnce(Response.json({ ip: '203.0.113.1', family: 'ipv4' })));
    render(<PublicIpTool />);
    expect((await screen.findByRole('alert')).textContent).toContain('Check your connection');
    expect(screen.queryByText(/private proxy detail/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('203.0.113.1')).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('explains unavailable metadata and rejects an invalid service result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({
      error: { code: 'CLIENT_IP_UNAVAILABLE', message: 'Connection metadata is unavailable.' },
    }, { status: 503 })).mockResolvedValueOnce(Response.json({ ip: '2001:db8::7', family: 'ipv4' })));
    render(<PublicIpTool />);
    expect((await screen.findByRole('alert')).textContent).toBe('Connection metadata is unavailable.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('invalid response'));
    expect(screen.queryByText('2001:db8::7')).toBeNull();
  });

  it('copies the IP and explains clipboard failures', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', async () => Response.json({ ip: '2001:db8::7', family: 'ipv6' }));
    render(<PublicIpTool />);
    await screen.findByText('2001:db8::7');
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(screen.getByRole('button', { name: 'Copy IP' }));
    expect(writeText).toHaveBeenCalledWith('2001:db8::7');
    expect(screen.getByRole('status').textContent).toBe('IP address copied.');
    writeText.mockRejectedValueOnce(new Error('Denied'));
    await user.click(screen.getByRole('button', { name: 'Copied' }));
    expect(screen.getByRole('status').textContent).toContain('Select and copy');
  });

  it.each([false, true])('cancels pending requests on unmount (static helpers unavailable: %s)', missing => {
    if (missing) hideStaticAbortMethods();
    let signal!: AbortSignal;
    vi.stubGlobal('fetch', (_endpoint: string, options: RequestInit) => {
      signal = options.signal!;
      return new Promise<Response>(() => {});
    });
    const view = render(<PublicIpTool />);
    expect(signal.aborted).toBe(false);
    view.unmount();
    expect(signal.aborted).toBe(true);
  });

  it.each([false, true])('ignores a cancelled body-read error after its effect restarts (static helpers unavailable: %s)', async missing => {
    if (missing) hideStaticAbortMethods();
    let cancelled!: AbortSignal;
    let resolveCurrent!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockImplementationOnce((_endpoint: string, options: RequestInit) => {
      cancelled = options.signal!;
      return Promise.resolve(new Response(new ReadableStream({
        start(controller) {
          cancelled.addEventListener('abort', () => controller.error(cancelled.reason), { once: true });
        },
      })));
    }).mockImplementationOnce(() => new Promise<Response>(resolve => { resolveCurrent = resolve; })));
    render(<PublicIpTool />, { reactStrictMode: true });
    expect(cancelled.aborted).toBe(true);
    await waitFor(() => expect(screen.getByText('Checking your public IP…')).toBeDefined());
    expect(screen.queryByRole('alert')).toBeNull();
    resolveCurrent(Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    expect(await screen.findByText('203.0.113.1')).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([false, true])('ignores a late success from a cancelled request (static helpers unavailable: %s)', async missing => {
    if (missing) hideStaticAbortMethods();
    let cancelled!: AbortSignal;
    let resolveOld!: (response: Response) => void;
    let resolveCurrent!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockImplementationOnce((_endpoint: string, options: RequestInit) => {
      cancelled = options.signal!;
      return new Promise<Response>(resolve => { resolveOld = resolve; });
    }).mockImplementationOnce(() => new Promise<Response>(resolve => { resolveCurrent = resolve; })));
    render(<PublicIpTool />, { reactStrictMode: true });
    expect(cancelled.aborted).toBe(true);
    await act(async () => { resolveOld(Response.json({ ip: '2001:db8::7', family: 'ipv6' })); });
    expect(screen.queryByText('2001:db8::7')).toBeNull();
    expect(screen.getByText('Checking your public IP…')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Checking…' }).getAttribute('aria-disabled')).toBe('true');
    resolveCurrent(Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    expect(await screen.findByText('203.0.113.1')).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('selects the IP page from its URL and provides navigation to the calculator', async () => {
    window.history.replaceState({}, '', '/public-ip');
    vi.stubGlobal('fetch', async () => Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    render(<App />);
    expect(screen.getByRole('heading', { name: 'My Public IP', level: 1 })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Smallest Covering CIDR' }).getAttribute('href')).toBe('/cidr');
    expect(screen.getByRole('link', { name: 'My Public IP' }).getAttribute('aria-current')).toBe('page');
    expect(await screen.findByText('203.0.113.1')).toBeDefined();
  });
});
