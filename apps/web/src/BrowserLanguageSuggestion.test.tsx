import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { render } from './test-utils';
import { localizedPath } from './i18n/routes';
import { resources } from './i18n/resources';
import { supportedLocales } from './i18n/locales';
import { languageSuggestionStorageKey } from './useLanguageSuggestion';

const chineseCopy = resources['zh-Hans'].translation.languageSuggestion;

function currentSuggestion() {
  return screen.queryByRole('region', {
    name: name => supportedLocales.some(locale => resources[locale].translation.languageSuggestion.title === name),
  });
}

function browserLanguages(preferences: string[], fallback = preferences[0] ?? 'en-US') {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(preferences);
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(fallback);
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  browserLanguages(['zh-CN', 'en-US']);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  document.documentElement.lang = 'en';
});

describe('browser language suggestions', () => {
  it.each(supportedLocales)('offers %s using its own language without changing the page', locale => {
    const page = locale === 'en' ? '/zh/cidr' : '/cidr';
    window.history.replaceState(null, '', page + '?source=example#tool');
    browserLanguages([locale]);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const copy = resources[locale].translation.languageSuggestion;
    const suggestion = screen.getByRole('region', { name: copy.title });
    expect(suggestion.getAttribute('lang')).toBe(locale);
    expect(within(suggestion).getByRole('button', { name: copy.dismiss })).toBeDefined();
    const link = within(suggestion).getByRole('link', { name: copy.switch });
    expect(link.getAttribute('href')).toBe(localizedPath('/cidr', locale) + '?source=example#tool');
    expect(link.getAttribute('hreflang')).toBe(locale);
    expect(window.location.pathname).toBe(page);
    expect(document.activeElement).toBe(document.body);
    expect(window.sessionStorage.length).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    { preferences: ['en-GB', 'zh-CN'], path: '/' },
    { preferences: ['pt-PT', 'en-US'], path: '/pt/' },
    { preferences: ['ar', 'en-US', 'zh-CN'], path: '/' },
    { preferences: ['zh-TW', 'zh-Hant'], path: '/' },
  ])('does not prompt when the supported preference matches or no match exists: $path $preferences', ({ preferences, path }) => {
    browserLanguages(preferences);
    window.history.replaceState(null, '', path);
    render(<App />);
    expect(currentSuggestion()).toBeNull();
  });

  it('falls back to navigator.language when the list is empty', () => {
    browserLanguages([], 'zh-SG');
    render(<App />);
    expect(screen.getByRole('region', { name: chineseCopy.title })).toBeDefined();
  });

  it('switches on request while retaining the calculator draft, exact result, and live URL suffix', () => {
    window.history.replaceState(null, '', '/cidr?source=initial#initial');
    const fetch = vi.fn();
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value: '::/0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
    window.history.replaceState(null, '', '/cidr?source=selected#tool');
    fireEvent.click(screen.getByRole('link', { name: chineseCopy.switch }));
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/zh/cidr?source=selected#tool');
    expect((screen.getByLabelText('IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('::/0');
    expect(screen.getAllByText('340,282,366,920,938,463,463,374,607,431,768,211,456')).toHaveLength(2);
    expect(currentSuggestion()).toBeNull();
    expect(storage).toHaveBeenCalledExactlyOnceWith(languageSuggestionStorageKey, '1');
    expect(storage.mock.contexts).toEqual([window.sessionStorage]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retains a pending public IP lookup when accepting the suggestion', async () => {
    window.history.replaceState(null, '', '/public-ip');
    let resolve!: (response: Response) => void;
    let signal!: AbortSignal;
    const fetch = vi.fn((_url: string, options: RequestInit) => {
      signal = options.signal!;
      return new Promise<Response>(complete => { resolve = complete; });
    });
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: chineseCopy.switch }));
    expect(screen.getByText('正在查询公网 IP…')).toBeDefined();
    expect(signal.aborted).toBe(false);
    resolve(Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    expect(await screen.findByText('203.0.113.1')).toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('remembers dismissal across page navigation, history, and an application reload', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: chineseCopy.dismiss }));
    fireEvent.click(screen.getByRole('link', { name: 'Smallest Covering CIDR' }));
    expect(currentSuggestion()).toBeNull();
    act(() => {
      window.history.replaceState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(currentSuggestion()).toBeNull();
    cleanup();
    render(<App />);
    expect(currentSuggestion()).toBeNull();
    cleanup();
    window.sessionStorage.clear();
    render(<App />);
    expect(screen.getByRole('region', { name: chineseCopy.title })).toBeDefined();
  });

  it('remembers an explicit menu selection even when another language was suggested', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Language: English' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Deutsch' }));
    expect(window.location.pathname).toBe('/de/');
    expect(currentSuggestion()).toBeNull();
    cleanup();
    render(<App />);
    expect(currentSuggestion()).toBeNull();
    expect(window.sessionStorage.getItem(languageSuggestionStorageKey)).toBe('1');
  });

  it('temporarily hides the suggestion while the menu is open and keeps keyboard navigation available', async () => {
    const user = userEvent.setup();
    render(<App />);
    const trigger = screen.getByRole('button', { name: 'Language: English' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeDefined();
    expect(currentSuggestion()).toBeNull();
    await user.keyboard('{ArrowDown}{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('region', { name: chineseCopy.title })).toBeDefined();
    expect(window.sessionStorage.length).toBe(0);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: chineseCopy.switch }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: chineseCopy.dismiss }));
    await user.keyboard('{Escape}');
    expect(currentSuggestion()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it.each(['ctrlKey', 'metaKey', 'shiftKey', 'altKey'])('preserves native suggestion-link behavior for %s', modifier => {
    render(<App />);
    const link = screen.getByRole('link', { name: chineseCopy.switch });
    let preventedByApp: boolean | undefined;
    document.addEventListener('click', event => {
      preventedByApp = event.defaultPrevented;
      event.preventDefault();
    }, { once: true });
    fireEvent.click(link, { [modifier]: true });
    expect(preventedByApp).toBe(false);
    expect(window.location.pathname).toBe('/');
    expect(window.sessionStorage.getItem(languageSuggestionStorageKey)).toBe('1');
  });

  it('updates unhandled suggestions when browser preferences change and stops after dismissal', () => {
    render(<App />);
    browserLanguages(['ja-JP']);
    act(() => { window.dispatchEvent(new Event('languagechange')); });
    const copy = resources.ja.translation.languageSuggestion;
    expect(screen.getByRole('region', { name: copy.title })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: copy.dismiss }));
    browserLanguages(['zh-CN']);
    act(() => { window.dispatchEvent(new Event('languagechange')); });
    expect(currentSuggestion()).toBeNull();
  });

  it('continues browsing with an in-memory dismissal when session storage is blocked', () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: chineseCopy.dismiss }));
    fireEvent.click(screen.getByRole('link', { name: 'Smallest Covering CIDR' }));
    act(() => { window.dispatchEvent(new Event('languagechange')); });
    expect(currentSuggestion()).toBeNull();
    expect(screen.getByRole('heading', { name: 'Smallest Covering CIDR' })).toBeDefined();
  });
});
