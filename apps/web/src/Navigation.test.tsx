import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import * as core from '@packetrove/core';
import { App } from './App';
import { render } from './test-utils';

let originalClipboard: PropertyDescriptor | undefined;
beforeEach(() => {
  originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  window.history.replaceState({}, '', '/cidr');
});
afterEach(() => {
  cleanup();
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
  else Reflect.deleteProperty(navigator, 'clipboard');
  vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

function calculate(value: string) {
  fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
}

function openTool(name: 'Smallest Covering CIDR' | 'My Public IP') {
  fireEvent.click(screen.getByRole('link', { name }));
}

function lookup() {
  const fetch = vi.fn(async () => Response.json({ ip: '198.51.100.2', family: 'ipv4' }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

async function visitIpAndReturn() {
  openTool('My Public IP');
  await screen.findByText('198.51.100.2');
  fireEvent.click(screen.getByRole('link', { name: 'Home' }));
  expect(screen.queryByLabelText('IP addresses or CIDR ranges')).toBeNull();
  openTool('Smallest Covering CIDR');
}

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Value>((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}

describe('tool navigation in one page session', () => {
  it('preserves the exact CIDR input and calculated result without recalculating or uploading it', async () => {
    const calculation = vi.spyOn(core, 'smallestCoveringCidr');
    const fetch = vi.fn(async () => Response.json({ ip: '198.51.100.2', family: 'ipv4' }));
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const input = ' 203.0.113.1\n\n203.0.113.2 ';
    calculate(input);
    expect(screen.getByText('203.0.113.0/30')).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
    openTool('My Public IP');
    expect(window.location.pathname).toBe('/ip');
    expect(await screen.findByText('198.51.100.2')).toBeDefined();
    expect(screen.queryByLabelText('IP addresses or CIDR ranges')).toBeNull();
    openTool('Smallest Covering CIDR');
    expect(window.location.pathname).toBe('/cidr');
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe(input);
    expect(screen.getByText('203.0.113.0/30')).toBeDefined();
    expect(calculation).toHaveBeenCalledExactlyOnceWith({ inputs: ['203.0.113.1', '203.0.113.2'] });
    expect(fetch).toHaveBeenCalledExactlyOnceWith('https://api.packetrove.com/v1/ip', expect.objectContaining({
      cache: 'no-store', credentials: 'omit',
    }));
  });
  it('preserves an unfinished input without calculating it', async () => {
    const calculation = vi.spyOn(core, 'smallestCoveringCidr');
    lookup();
    render(<App />);
    const input = '\n203.0.113.';
    fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value: input } });
    await visitIpAndReturn();
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe(input);
    expect(screen.getByText('Your result will appear here')).toBeDefined();
    expect(calculation).not.toHaveBeenCalled();
  });
  it('preserves validation errors and their original physical line numbers', async () => {
    const calculation = vi.spyOn(core, 'smallestCoveringCidr');
    lookup();
    render(<App />);
    const input = '\n203.0.113.1\nbad\n\n203.0.113.2\n::/129';
    calculate(input);
    const message = screen.getByRole('alert').textContent;
    await visitIpAndReturn();
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe(input);
    expect(screen.getByRole('alert').textContent).toBe(message);
    expect(message).toContain('Line 3:');
    expect(message).toContain('Line 6:');
    expect(calculation).toHaveBeenCalledTimes(1);
  });
  it.each(['203.0.113.1', 'bad', ''])('clears the input, result, and error for %j so navigation cannot revive them', async input => {
    lookup();
    render(<App />);
    calculate(input);
    const clear = screen.getByRole('button', { name: 'Clear' });
    expect((clear as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(clear);
    await visitIpAndReturn();
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copy CIDR' })).toBeNull();
    expect(screen.getByText('Your result will appear here')).toBeDefined();
    expect((screen.getByRole('button', { name: 'Clear' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('starts a new page session with an empty draft', () => {
    const fetch = lookup();
    const firstPage = render(<App />);
    calculate('203.0.113.1');
    firstPage.unmount();
    render(<App />);
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Your result will appear here')).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('supports actual History API back and forward while retaining the CIDR draft', async () => {
    const fetch = lookup();
    render(<App />);
    calculate('::/0');
    openTool('My Public IP');
    await screen.findByText('198.51.100.2');
    openTool('Smallest Covering CIDR');
    act(() => { window.history.back(); });
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('My Public IP'));
    expect(document.title).toBe('My Public IP — Packetrove');
    expect(screen.getByRole('link', { name: 'My Public IP' }).getAttribute('aria-current')).toBe('page');
    await screen.findByText('198.51.100.2');
    act(() => { window.history.forward(); });
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Smallest Covering CIDR'));
    expect(document.title).toBe('Smallest Covering CIDR — Packetrove');
    expect(screen.getByRole('link', { name: 'Smallest Covering CIDR' }).getAttribute('aria-current')).toBe('page');
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe('::/0');
    expect(screen.getAllByText('340,282,366,920,938,463,463,374,607,431,768,211,456')).toHaveLength(2);
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(screen.getByRole('heading', { name: 'Network tools for humans and agents', level: 1 })).toBeDefined();
    act(() => { window.history.back(); });
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Smallest Covering CIDR'));
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe('::/0');
    act(() => { window.history.forward(); });
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Network tools for humans and agents'));
    expect(document.title).toBe('Packetrove — Network tools for humans and agents');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('handles an unknown history route and returns home with the existing draft', () => {
    const fetch = lookup();
    render(<App />);
    calculate('203.0.113.1');
    act(() => {
      window.history.pushState(null, '', '/missing-page');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('heading', { name: 'Page not found', level: 1 })).toBeDefined();
    expect(document.title).toBe('Page not found — Packetrove');
    expect(screen.queryByLabelText('IP addresses or CIDR ranges')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Return to home' }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { name: 'Network tools for humans and agents', level: 1 })).toBeDefined();
    expect(screen.queryByLabelText('IP addresses or CIDR ranges')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Open CIDR calculator' }));
    expect(window.location.pathname).toBe('/cidr');
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('returns through the home logo without losing the draft', async () => {
    lookup();
    render(<App />);
    calculate('203.0.113.1');
    openTool('My Public IP');
    await screen.findByText('198.51.100.2');
    fireEvent.click(screen.getByRole('link', { name: 'Packetrove home' }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { name: 'Network tools for humans and agents', level: 1 })).toBeDefined();
    expect(screen.queryByLabelText('IP addresses or CIDR ranges')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Open CIDR calculator' }));
    expect(window.location.pathname).toBe('/cidr');
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
  });
  it('follows the tool href when the current path has a query or fragment', () => {
    window.history.replaceState(null, '', '/cidr?source=example#top');
    const fetch = lookup();
    render(<App />);
    calculate('203.0.113.1');
    openTool('Smallest Covering CIDR');
    expect(window.location.pathname).toBe('/cidr');
    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe('');
    expect(window.history.state).toBeNull();
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }])(
    'leaves %j tool-link clicks to native browser navigation', options => {
      const fetch = lookup();
      const push = vi.spyOn(window.history, 'pushState');
      render(<App />);
      const click = new MouseEvent('click', { bubbles: true, cancelable: true, ...options });
      // Suppress jsdom's unsupported document navigation after React handles it.
      document.addEventListener('click', event => {
        expect(event.defaultPrevented).toBe(false);
        event.preventDefault();
      }, { once: true });
      fireEvent(screen.getByRole('link', { name: 'My Public IP' }), click);
      expect(push).not.toHaveBeenCalled();
      expect(window.location.pathname).toBe('/cidr');
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});

describe('navigation request and clipboard lifetimes', () => {
  it('opens the public IP tool from home and cancels its request when returning home', () => {
    window.history.replaceState(null, '', '/');
    let signal!: AbortSignal;
    const fetch = vi.fn((_url: string, options: RequestInit) => {
      signal = options.signal!;
      return new Promise<Response>(() => {});
    });
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('link', { name: 'Open public IP tool' }));
    expect(window.location.pathname).toBe('/ip');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(signal.aborted).toBe(false);
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(window.location.pathname).toBe('/');
    expect(signal.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Network tools for humans and agents', level: 1 })).toBeDefined();
  });

  it('queries IP only when entering or refreshing, and not when reselecting the active tool', async () => {
    const fetch = lookup();
    render(<App />);
    calculate('203.0.113.1');
    expect(fetch).not.toHaveBeenCalled();
    openTool('My Public IP');
    await screen.findByText('198.51.100.2');
    openTool('My Public IP');
    expect(fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh IP' }));
    await screen.findByText('198.51.100.2');
    expect(fetch).toHaveBeenCalledTimes(2);
    openTool('Smallest Covering CIDR');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it.each(['success', 'failure'] as const)('cancels an IP lookup on leaving and ignores its late %s after reentry', async outcome => {
    const oldRequest = deferred<Response>();
    const currentRequest = deferred<Response>();
    let oldSignal!: AbortSignal;
    const fetch = vi.fn().mockImplementationOnce((_url: string, options: RequestInit) => {
      oldSignal = options.signal!;
      return oldRequest.promise;
    }).mockReturnValueOnce(currentRequest.promise);
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    expect(fetch).not.toHaveBeenCalled();
    openTool('My Public IP');
    expect(oldSignal.aborted).toBe(false);
    openTool('Smallest Covering CIDR');
    expect(oldSignal.aborted).toBe(true);
    openTool('My Public IP');
    await act(async () => {
      if (outcome === 'success') oldRequest.resolve(Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
      else oldRequest.reject(new Error('Late request failed'));
    });
    expect(screen.getByText('Checking your public IP…')).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('203.0.113.1')).toBeNull();
    await act(async () => { currentRequest.resolve(Response.json({ ip: '198.51.100.2', family: 'ipv4' })); });
    expect(await screen.findByText('198.51.100.2')).toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it.each([
    { tool: 'Smallest Covering CIDR' as const, copy: 'Copy CIDR', success: 'CIDR copied.', outcome: 'success' },
    { tool: 'Smallest Covering CIDR' as const, copy: 'Copy CIDR', success: 'CIDR copied.', outcome: 'failure' },
    { tool: 'My Public IP' as const, copy: 'Copy IP', success: 'IP address copied.', outcome: 'success' },
    { tool: 'My Public IP' as const, copy: 'Copy IP', success: 'IP address copied.', outcome: 'failure' },
  ])('ignores a pending $tool copy $outcome after leaving and reentering', async ({ tool, copy, success, outcome }) => {
    const pending = deferred<void>();
    const writeText = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    lookup();
    render(<App />);
    calculate('203.0.113.1');
    if (tool === 'My Public IP') {
      openTool(tool);
      await screen.findByText('198.51.100.2');
    }
    fireEvent.click(screen.getByRole('button', { name: copy }));
    const otherTool = tool === 'My Public IP' ? 'Smallest Covering CIDR' : 'My Public IP';
    openTool(otherTool);
    if (otherTool === 'My Public IP') await screen.findByText('198.51.100.2');
    openTool(tool);
    if (tool === 'My Public IP') await screen.findByText('198.51.100.2');
    await act(async () => {
      if (outcome === 'success') pending.resolve();
      else pending.reject(new Error('Denied'));
    });
    expect(screen.getByRole('status').textContent).toBe('');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: copy })); });
    expect(screen.getByRole('status').textContent).toBe(success);
    expect(writeText).toHaveBeenCalledTimes(2);
  });
});
