import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import * as core from '@packetrove/core';
import { App } from './App';
import { render } from './test-utils';
import { locales, supportedLocales } from './i18n/locales';
import { localizedPath, resolveRoute } from './i18n/routes';
import { resources } from './i18n/resources';

// Keep the actual application and language menu. The reference's controlled
// child reproduces its browser History operations without executing requests.
vi.mock('./ApiReference', () => ({ default: () => <>
  {(['pushState', 'replaceState'] as const).map(method => <button key={method} onClick={() => {
    const url = new URL(window.location.href);
    url.search = '?source=selected&mode=one';
    url.hash = '#tag/Current-public-IP/get/v1/public-ip';
    window.history[method](null, '', url);
  }}>Select API operation with {method}</button>)}
</> }));

const selectedSuffix = '?source=selected&mode=one#tag/Current-public-IP/get/v1/public-ip';
const laterSuffix = '?source=later#tag/CIDR-cover/post/v1/cidr/cover';

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

async function openDocumentation(method: 'pushState' | 'replaceState' = 'pushState') {
  window.history.replaceState(null, '', '/docs/api?source=initial#previous');
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: `Select API operation with ${method}` }));
  expect(window.location.search + window.location.hash).toBe(selectedSuffix);
  return fetch;
}

function openLanguageMenu() {
  const locale = resolveRoute(window.location.pathname).locale;
  fireEvent.click(screen.getByRole('button', {
    name: resources[locale].translation.common.language + ': ' + locales[locale].name,
  }));
  return screen.getByRole('menuitem', { name: '简体中文' });
}

function updateWhileOpen() {
  act(() => { window.history.replaceState(null, '', '/docs/api' + laterSuffix); });
}

function observeNativeAction(type: string, action: () => void) {
  let preventedByApplication: boolean | undefined;
  document.addEventListener(type, event => {
    preventedByApplication = event.defaultPrevented;
    // JSDOM does not implement new tabs or browser context menus.
    event.preventDefault();
  }, { once: true });
  action();
  expect(preventedByApplication).toBe(false);
}

describe('language links after reference navigation', () => {
  it.each((['pushState', 'replaceState'] as const).flatMap(method => supportedLocales.map(locale => ({ method, locale }))))
    ('preserves the current URL after $method when choosing $locale', async ({ method, locale }) => {
    const fetch = await openDocumentation(method);
    openLanguageMenu();
    for (const language of supportedLocales) {
      expect(screen.getByRole('menuitem', { name: locales[language].name }).getAttribute('href'))
        .toBe(localizedPath('/docs/api', language) + selectedSuffix);
    }
    fireEvent.click(screen.getByRole('menuitem', { name: locales[locale].name }));
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe(localizedPath('/docs/api', locale) + selectedSuffix);
    expect(document.documentElement.lang).toBe(locale);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses the latest query and fragment if they change while the menu is open', async () => {
    const fetch = await openDocumentation();
    const chinese = openLanguageMenu();
    updateWhileOpen();
    fireEvent.click(chinese);
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe('/zh/docs/api' + laterSuffix);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['ctrlKey', 'metaKey', 'shiftKey', 'altKey'])('keeps %s clicks native and supplies the current link', async modifier => {
    const fetch = await openDocumentation();
    const chinese = openLanguageMenu();
    updateWhileOpen();
    observeNativeAction('click', () => { fireEvent.click(chinese, { [modifier]: true }); });
    expect(chinese.getAttribute('href')).toBe('/zh/docs/api' + laterSuffix);
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe('/docs/api' + laterSuffix);
    expect(document.documentElement.lang).toBe('en');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([1, 2])('does not intercept a non-primary click with button %s', async button => {
    const fetch = await openDocumentation();
    const chinese = openLanguageMenu();
    updateWhileOpen();
    fireEvent.pointerDown(chinese, { button });
    observeNativeAction('click', () => { fireEvent.click(chinese, { button }); });
    expect(chinese.getAttribute('href')).toBe('/zh/docs/api' + laterSuffix);
    expect(window.location.pathname).toBe('/docs/api');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('provides the current URL to a native middle-click action', async () => {
    const fetch = await openDocumentation();
    const chinese = openLanguageMenu();
    updateWhileOpen();
    observeNativeAction('auxclick', () => {
      fireEvent(chinese, new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }));
    });
    expect(chinese.getAttribute('href')).toBe('/zh/docs/api' + laterSuffix);
    expect(window.location.pathname).toBe('/docs/api');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('provides the current URL before pointer and copy-link context-menu actions', async () => {
    const fetch = await openDocumentation();
    const chinese = openLanguageMenu();
    updateWhileOpen();
    observeNativeAction('pointerdown', () => { fireEvent.pointerDown(chinese, { button: 2 }); });
    expect(chinese.getAttribute('href')).toBe('/zh/docs/api' + laterSuffix);
    act(() => { window.history.replaceState(null, '', '/docs/api' + selectedSuffix); });
    observeNativeAction('contextmenu', () => { fireEvent.contextMenu(chinese); });
    expect(chinese.getAttribute('href')).toBe('/zh/docs/api' + selectedSuffix);
    expect(window.location.pathname).toBe('/docs/api');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves history and the real local calculator draft through reference and language navigation', async () => {
    window.history.replaceState(null, '', '/cidr');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const calculate = vi.spyOn(core, 'smallestCoveringCidr');
    render(<App />);
    fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value: '::/0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
    expect(calculate).toHaveBeenCalledExactlyOnceWith({ inputs: ['::/0'] });
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    fireEvent.click(screen.getByRole('link', { name: 'Read the API guide' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Select API operation with pushState' }));
    fireEvent.click(openLanguageMenu());
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe('/zh/docs/api' + selectedSuffix);
    act(() => { window.history.back(); });
    await waitFor(() => { expect(window.location.pathname).toBe('/docs/api'); });
    expect(window.location.search + window.location.hash).toBe(selectedSuffix);
    expect(document.documentElement.lang).toBe('en');
    act(() => { window.history.forward(); });
    await waitFor(() => { expect(window.location.pathname).toBe('/zh/docs/api'); });
    expect(window.location.search + window.location.hash).toBe(selectedSuffix);
    fireEvent.click(screen.getByRole('link', { name: '最小覆盖 CIDR' }));
    expect((screen.getByLabelText('IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('::/0');
    expect(screen.getAllByText('340,282,366,920,938,463,463,374,607,431,768,211,456')).toHaveLength(2);
    expect(calculate).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });
});
