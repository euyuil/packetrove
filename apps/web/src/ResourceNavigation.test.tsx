import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { App } from './App';
import * as pages from './page-resources';
import * as languages from './i18n/locale-resources';
import { deferred, render } from './test-utils';

beforeEach(() => { window.history.replaceState(null, '', '/cidr-cover'); });
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

function delayRoutes(targets: Record<string, ReturnType<typeof deferred<void>>>) {
  const isReady = pages.isRoutePrepared;
  const prepare = pages.prepareRoute;
  vi.spyOn(pages, 'isRoutePrepared').mockImplementation(path => !Object.hasOwn(targets, path) && isReady(path));
  return vi.spyOn(pages, 'prepareRoute').mockImplementation(path => targets[path]?.promise ?? prepare(path));
}

const field = () => screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement;

it('keeps the current page editable while loading and retains the latest draft on return', async () => {
  const destination = deferred<void>();
  delayRoutes({ '/cidr-subtract': destination });
  render(<App />);
  fireEvent.change(field(), { target: { value: '203.0.113.' } });
  fireEvent.click(screen.getByRole('link', { name: 'CIDR Subtraction' }));
  expect(screen.getByRole('status', { name: 'Loading page…' }).textContent).toContain('Loading page');
  expect(window.location.pathname).toBe('/cidr-cover');
  expect(document.title).toContain('Smallest Covering');
  fireEvent.change(field(), { target: { value: '203.0.113.27' } });
  await act(async () => { destination.resolve(); });
  expect(window.location.pathname).toBe('/cidr-subtract');
  fireEvent.click(screen.getByRole('link', { name: 'Smallest Covering CIDR' }));
  expect(field().value).toBe('203.0.113.27');
});

it('commits only the latest choice when page loads complete in reverse order', async () => {
  const first = deferred<void>();
  const last = deferred<void>();
  delayRoutes({ '/cidr-subtract': first, '/range-to-cidrs': last });
  render(<App />);
  fireEvent.click(screen.getByRole('link', { name: 'CIDR Subtraction' }));
  fireEvent.click(screen.getByRole('link', { name: 'IP Range to CIDRs' }));
  await act(async () => { last.resolve(); });
  expect(window.location.pathname).toBe('/range-to-cidrs');
  const title = document.title;
  await act(async () => { first.resolve(); });
  expect(window.location.pathname).toBe('/range-to-cidrs');
  expect(document.title).toBe(title);
  expect(screen.queryByText('Loading page…')).toBeNull();
});

it.each(['popstate', 'hashchange'])('lets a later %s event supersede a pending click', async event => {
  const pending = deferred<void>();
  delayRoutes({ '/cidr-subtract': pending });
  render(<App />);
  fireEvent.click(screen.getByRole('link', { name: 'CIDR Subtraction' }));
  act(() => {
    window.history.replaceState(null, '', '/cidr-cover?mode=local#input');
    window.dispatchEvent(new Event(event));
  });
  await act(async () => { pending.resolve(); });
  expect(window.location.pathname + window.location.search + window.location.hash).toBe('/cidr-cover?mode=local#input');
  expect(field()).toBeDefined();
});

it('keeps input and metadata on failure and retries without exposing module errors', async () => {
  const first = deferred<void>();
  const loads = delayRoutes({ '/cidr-subtract': first });
  render(<App />);
  fireEvent.change(field(), { target: { value: '203.0.113.57' } });
  fireEvent.click(screen.getByRole('link', { name: 'CIDR Subtraction' }));
  await act(async () => { first.reject(new Error('Private chunk diagnostic')); });
  expect(screen.getByRole('alert').textContent).toContain('This page could not be loaded');
  expect(screen.getByRole('alert').textContent).not.toContain('Private chunk');
  expect(field().value).toBe('203.0.113.57');
  expect(document.title).toContain('Smallest Covering');
  const retry = deferred<void>();
  loads.mockImplementationOnce(() => retry.promise);
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await act(async () => { retry.resolve(); });
  expect(window.location.pathname).toBe('/cidr-subtract');
  fireEvent.click(screen.getByRole('link', { name: 'Smallest Covering CIDR' }));
  expect(field().value).toBe('203.0.113.57');
});

it('restores a failed history destination and retries it by replacing, without adding an entry', async () => {
  const pending = deferred<void>();
  const loads = delayRoutes({ '/cidr-subtract': pending });
  render(<App />);
  const length = window.history.length;
  act(() => {
    window.history.replaceState(null, '', '/cidr-subtract?from=history#result');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await act(async () => { pending.reject(new Error('Unavailable')); });
  expect(window.location.pathname).toBe('/cidr-cover');
  expect(document.title).toContain('Smallest Covering');
  loads.mockResolvedValueOnce();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retry' })); });
  expect(window.location.pathname + window.location.search + window.location.hash).toBe('/cidr-subtract?from=history#result');
  expect(window.history.length).toBe(length);
});

it('ignores completion after the application has unmounted', async () => {
  const pending = deferred<void>();
  delayRoutes({ '/cidr-subtract': pending });
  const application = render(<App />);
  fireEvent.click(screen.getByRole('link', { name: 'CIDR Subtraction' }));
  application.unmount();
  await act(async () => { pending.resolve(); });
  expect(window.location.pathname).toBe('/cidr-cover');
});

it('switches a delayed locale in place without remounting the tool or losing edits', async () => {
  const pending = deferred<void>();
  delayRoutes({ '/zh/cidr-cover': pending });
  render(<App />);
  const original = field();
  fireEvent.click(screen.getByRole('button', { name: 'Language: English' }));
  fireEvent.click(screen.getByRole('menuitem', { name: '中文' }));
  fireEvent.change(original, { target: { value: '203.0.113.37' } });
  expect(window.location.pathname).toBe('/cidr-cover');
  await act(async () => { pending.resolve(); });
  expect(window.location.pathname).toBe('/zh/cidr-cover');
  const translated = screen.getByLabelText('IP 地址或 CIDR 网段') as HTMLTextAreaElement;
  expect(translated).toBe(original);
  expect(translated.value).toBe('203.0.113.37');
});

it('shows a browser-language suggestion only after that locale is prepared', async () => {
  const pending = deferred<Awaited<ReturnType<typeof languages.prepareLocale>>>();
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ja-JP']);
  const isReady = languages.isLocalePrepared;
  vi.spyOn(languages, 'isLocalePrepared').mockImplementation(locale => locale !== 'ja' && isReady(locale));
  const prepare = vi.spyOn(languages, 'prepareLocale').mockReturnValue(pending.promise);
  const title = languages.getLocaleTranslation('ja').languageSuggestion.title;
  render(<App />);
  expect(screen.queryByRole('region', { name: title })).toBeNull();
  expect(prepare).toHaveBeenCalledExactlyOnceWith('ja');
  await act(async () => { pending.resolve([languages.getLocaleTranslation('en'), languages.getLocaleTranslation('ja')]); });
  expect(screen.getByRole('region', { name: title })).toBeDefined();
  expect(window.location.pathname).toBe('/cidr-cover');
});
