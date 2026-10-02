import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from './test-utils';

type DocumentationModule = { default: ComponentType };

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Value>((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetModules();
  window.history.replaceState(null, '', '/cidr');
});
afterEach(() => {
  cleanup();
  vi.doUnmock('./ApiDocumentation');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

async function application() {
  const documentation = deferred<DocumentationModule>();
  vi.doMock('./ApiDocumentation', () => documentation.promise);
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const core = await import('@packetrove/core');
  const calculation = vi.spyOn(core, 'smallestCoveringCidr');
  const { App } = await import('./App');
  const caught = vi.fn();
  render(<App />, { onCaughtError: caught });
  return { documentation, fetch, calculation, caught };
}

function calculate(input: string) {
  fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value: input } });
  fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
}

function openDocumentation() {
  fireEvent.click(screen.getByRole('link', { name: 'Home' }));
  fireEvent.click(screen.getByRole('link', { name: 'Read the API guide' }));
}

async function failDocumentation(documentation: ReturnType<typeof deferred<DocumentationModule>>, mode = 'load') {
  await screen.findByRole('status');
  await act(async () => {
    if (mode === 'load') documentation.reject(new Error('Controlled documentation module-load failure'));
    else documentation.resolve({ default: () => { throw new Error('Controlled documentation render failure'); } });
  });
  expect(await screen.findByRole('heading', { level: 1, name: 'API documentation is unavailable' })).toBeDefined();
  expect(screen.getByRole('alert').textContent).not.toContain('Controlled documentation');
  expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeDefined();
  expect(screen.getByRole('link', { name: 'Packetrove home' })).toBeDefined();
}

function returnToCalculator() {
  fireEvent.click(screen.getByRole('link', { name: 'Return to the calculator' }));
  expect(window.location.pathname).toBe('/cidr');
}

describe('API documentation failure isolation', () => {
  it.each(['load', 'render'])('keeps calculated input and result after a %s error', async mode => {
    const { documentation, fetch, calculation, caught } = await application();
    const input = ' 203.0.113.1\n\n203.0.113.2 ';
    calculate(input);
    expect(screen.getByText('203.0.113.0/30')).toBeDefined();
    openDocumentation();
    await failDocumentation(documentation, mode);
    expect(caught).toHaveBeenCalled();
    returnToCalculator();
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe(input);
    expect(screen.getByText('203.0.113.0/30')).toBeDefined();
    expect(calculation).toHaveBeenCalledExactlyOnceWith({ inputs: ['203.0.113.1', '203.0.113.2'] });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps physical-line validation errors and cannot revive a cleared draft on revisiting failed documentation', async () => {
    const { documentation, fetch, calculation } = await application();
    const input = '\n203.0.113.1\nbad\n\n203.0.113.2\n::/129';
    calculate(input);
    const error = screen.getByRole('alert').textContent;
    expect(error).toContain('Line 3:');
    expect(error).toContain('Line 6:');
    openDocumentation();
    await failDocumentation(documentation);
    returnToCalculator();
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe(input);
    expect(screen.getByRole('alert').textContent).toBe(error);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    openDocumentation();
    // React.lazy caches the rejected module. Returning shows the same local failure,
    // without promising a retry or reloading the surrounding page session.
    expect(await screen.findByRole('heading', { name: 'API documentation is unavailable' })).toBeDefined();
    returnToCalculator();
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Your result will appear here')).toBeDefined();
    expect(calculation).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps unfinished input without calculating or uploading it', async () => {
    const { documentation, fetch, calculation } = await application();
    const input = '\n203.0.113.';
    fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value: input } });
    openDocumentation();
    await failDocumentation(documentation);
    returnToCalculator();
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe(input);
    expect(screen.getByText('Your result will appear here')).toBeDefined();
    expect(calculation).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps real History API back and forward usable after a module-load failure', async () => {
    const { documentation, fetch, calculation } = await application();
    calculate('203.0.113.1');
    openDocumentation();
    await failDocumentation(documentation);
    act(() => { window.history.back(); });
    await waitFor(() => expect(window.location.pathname).toBe('/'));
    expect(screen.getByRole('heading', { name: 'Network tools for humans and agents' })).toBeDefined();
    act(() => { window.history.back(); });
    await waitFor(() => expect(window.location.pathname).toBe('/cidr'));
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe('203.0.113.1');
    await waitFor(() => expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2));
    act(() => { window.history.forward(); });
    await waitFor(() => expect(window.location.pathname).toBe('/'));
    act(() => { window.history.forward(); });
    await waitFor(() => expect(window.location.pathname).toBe('/docs/api'));
    expect(await screen.findByRole('heading', { name: 'API documentation is unavailable' })).toBeDefined();
    expect(document.title).toBe('API documentation — Packetrove');
    returnToCalculator();
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
    expect(calculation).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('translates the local failure in place and returns to the calculator in the selected language', async () => {
    const { documentation, fetch, calculation } = await application();
    calculate('203.0.113.1');
    openDocumentation();
    await failDocumentation(documentation);
    fireEvent.click(screen.getByRole('button', { name: 'Language: English' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '简体中文' }));
    expect(window.location.pathname).toBe('/zh/docs/api');
    expect(screen.getByRole('heading', { name: 'API 文档暂时无法显示' })).toBeDefined();
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeDefined();
    const calculator = screen.getByRole('link', { name: '返回计算器' });
    expect(calculator.getAttribute('href')).toBe('/zh/cidr');
    fireEvent.click(calculator);
    expect((screen.getByLabelText('IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('203.0.113.1');
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
    expect(calculation).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps tool navigation usable when opening a failed documentation route directly', async () => {
    window.history.replaceState(null, '', '/docs/api');
    const { documentation, fetch } = await application();
    await failDocumentation(documentation);
    fireEvent.click(screen.getByRole('link', { name: 'Smallest Covering CIDR' }));
    calculate('203.0.113.1');
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('ignores a module-load rejection after leaving pending documentation and isolates it on return', async () => {
    const { documentation, fetch, calculation } = await application();
    calculate('203.0.113.1');
    openDocumentation();
    await screen.findByRole('status');
    fireEvent.click(screen.getByRole('link', { name: 'Smallest Covering CIDR' }));
    await act(async () => { documentation.reject(new Error('Controlled late module-load failure')); });
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
    expect(screen.queryByRole('alert')).toBeNull();
    openDocumentation();
    expect(await screen.findByRole('heading', { name: 'API documentation is unavailable' })).toBeDefined();
    returnToCalculator();
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
    expect(calculation).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('opens the IP tool only on navigation and still cancels its request when returning to the retained calculator', async () => {
    const { documentation, fetch, calculation } = await application();
    calculate('203.0.113.1');
    openDocumentation();
    await failDocumentation(documentation);
    expect(fetch).not.toHaveBeenCalled();
    const response = deferred<Response>();
    let signal!: AbortSignal;
    fetch.mockImplementation((_url: string, options: RequestInit) => {
      signal = options.signal!;
      return response.promise;
    });
    fireEvent.click(screen.getByRole('link', { name: 'My Public IP' }));
    expect(fetch).toHaveBeenCalledExactlyOnceWith('https://api.packetrove.com/v1/ip', expect.objectContaining({
      cache: 'no-store', credentials: 'omit',
    }));
    expect(signal.aborted).toBe(false);
    fireEvent.click(screen.getByRole('link', { name: 'Smallest Covering CIDR' }));
    expect(signal.aborted).toBe(true);
    await act(async () => { response.resolve(Response.json({ ip: '198.51.100.2', family: 'ipv4' })); });
    expect(screen.queryByText('198.51.100.2')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
    expect(calculation).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('shows successfully loaded documentation and retains the calculator when leaving it', async () => {
    const { documentation, fetch, calculation, caught } = await application();
    calculate('203.0.113.1');
    openDocumentation();
    await screen.findByRole('status');
    await act(async () => {
      documentation.resolve({ default: () => <h1>Loaded documentation</h1> });
    });
    expect(await screen.findByRole('heading', { name: 'Loaded documentation' })).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Smallest Covering CIDR' }));
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
    expect(calculation).toHaveBeenCalledTimes(1);
    expect(caught).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
