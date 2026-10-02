import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { render } from './test-utils';
import { locales, supportedLocales, type Locale } from './i18n/locales';
import { localizedPath, pagePaths, resolveRoute } from './i18n/routes';
import { resources } from './i18n/resources';

const reference = vi.hoisted(() => ({ fail: false }));
vi.mock('./ApiReference', () => ({ default: () => {
  if (reference.fail) throw new Error('Controlled reference rendering failure');
  return <div>Controlled API reference</div>;
} }));

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(20, 20, 100, 40));
});
afterEach(() => {
  cleanup();
  reference.fail = false;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

async function chooseLanguage(locale: Locale) {
  const current = resolveRoute(window.location.pathname).locale;
  const trigger = screen.getByRole('button', {
    name: resources[current].translation.common.language + ': ' + locales[current].name,
  });
  const user = userEvent.setup();
  await user.click(trigger);
  await user.click(await screen.findByRole('menuitem', { name: locales[locale].name }));
  await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  return trigger;
}

describe('focus after navigation to a different page', () => {
  const homepageEntries = supportedLocales.flatMap(locale =>
    (['cidr', 'subtract'] as const).map(tool => ({ locale, tool })));
  it.each(homepageEntries)('moves keyboard focus from the removed $locale homepage entry to the $tool content', async ({ locale, tool }) => {
    const translation = resources[locale].translation;
    const linkName = tool === 'cidr' ? translation.home.cidrLink : translation.home.subtractLink;
    const title = tool === 'cidr' ? translation.cidr.title : translation.subtract.title;
    const inputLabel = tool === 'cidr' ? translation.cidr.inputLabel : translation.subtract.includeLabel;
    window.history.replaceState({}, '', localizedPath('/', locale));
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: title }));
    const entry = screen.getByRole('link', { name: linkName });
    entry.focus();
    const user = userEvent.setup();
    await user.keyboard('{Enter}');
    expect(entry.isConnected).toBe(false);
    expect(window.location.pathname).toBe(localizedPath(pagePaths[tool], locale));
    const main = screen.getByRole('main', { name: title });
    expect(document.activeElement).toBe(main);
    expect(main.tabIndex).toBe(-1);
    const input = screen.getByLabelText(inputLabel);
    await user.tab();
    expect(document.activeElement).toBe(input);
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
  });

  it('focuses each distinct CIDR page and retains both unfinished drafts', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    window.history.replaceState({}, '', '/cidr');
    render(<App />);
    fireEvent.change(screen.getByLabelText(resources.en.translation.cidr.inputLabel), { target: { value: '203.0.113.' } });
    fireEvent.click(screen.getByRole('link', { name: resources.en.translation.subtract.title }));
    expect(document.activeElement).toBe(screen.getByRole('main', { name: resources.en.translation.subtract.title }));
    fireEvent.change(screen.getByLabelText(resources.en.translation.subtract.includeLabel), { target: { value: '198.51.100.' } });
    fireEvent.click(screen.getByRole('link', { name: resources.en.translation.cidr.title }));
    expect(document.activeElement).toBe(screen.getByRole('main', { name: resources.en.translation.cidr.title }));
    expect((screen.getByLabelText(resources.en.translation.cidr.inputLabel) as HTMLTextAreaElement).value).toBe('203.0.113.');
    fireEvent.click(screen.getByRole('link', { name: resources.en.translation.subtract.title }));
    expect((screen.getByLabelText(resources.en.translation.subtract.includeLabel) as HTMLTextAreaElement).value).toBe('198.51.100.');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('focuses the new content on actual history back and forward without losing the calculation', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Open CIDR calculator' }));
    fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value: '::/0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(document.activeElement).toBe(screen.getByRole('main', { name: 'Home' }));
    act(() => { window.history.back(); });
    await waitFor(() => {
      expect(window.location.pathname).toBe('/cidr');
      expect(document.activeElement).toBe(screen.getByRole('main', { name: 'Smallest Covering CIDR' }));
    });
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe('::/0');
    expect(screen.getAllByText('340,282,366,920,938,463,463,374,607,431,768,211,456')).toHaveLength(2);
    act(() => { window.history.forward(); });
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
      expect(document.activeElement).toBe(screen.getByRole('main', { name: 'Home' }));
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps focus during initial rendering', () => {
    const existing = document.createElement('button');
    document.body.append(existing);
    existing.focus();
    render(<App />);
    expect(document.activeElement).toBe(existing);
    existing.remove();
  });

  it('keeps focus for same-page languages, input changes, URL suffixes, and route aliases', async () => {
    window.history.replaceState({}, '', '/cidr');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const main = screen.getByRole('main');
    const focus = vi.spyOn(main, 'focus');
    const languages: Locale[] = [...supportedLocales.filter(language => language !== 'en'), 'en'];
    for (const locale of languages) {
      const trigger = await chooseLanguage(locale);
      expect(document.activeElement).toBe(trigger);
      expect(main.getAttribute('aria-label')).toBe(resources[locale].translation.cidr.title);
    }
    const input = screen.getByLabelText('IP addresses or CIDR ranges');
    await userEvent.setup().type(input, '203.0.113.1');
    expect(document.activeElement).toBe(input);
    act(() => {
      window.history.pushState({}, '', '/cidr?source=example#tool');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(document.activeElement).toBe(input);
    act(() => {
      window.history.pushState({}, '', '/cidr.html?source=example#another');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(document.activeElement).toBe(input);
    expect(focus).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  }, 15_000); // Allow the complete ten-language menu sequence to finish on slower runners.

  it('does not refocus for IP completion or refresh and still cancels a request when leaving', async () => {
    const requests: Array<{ complete: (response: Response) => void; signal: AbortSignal }> = [];
    const fetch = vi.fn((_url: string, options: RequestInit) => new Promise<Response>(complete => {
      requests.push({ complete, signal: options.signal! });
    }));
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'My Public IP' }));
    fireEvent.click(screen.getByRole('link', { name: 'Check my public IP' }));
    expect(window.location.pathname).toBe(pagePaths.ip);
    const main = screen.getByRole('main', { name: 'My Public IP' });
    expect(document.activeElement).toBe(main);
    const focus = vi.spyOn(main, 'focus');
    const home = screen.getByRole('link', { name: 'Packetrove home' });
    home.focus();
    requests[0]!.complete(Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    await screen.findByText('203.0.113.1');
    expect(document.activeElement).toBe(home);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh IP' }));
    expect(requests).toHaveLength(2);
    expect(document.activeElement).toBe(home);
    expect(focus).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(requests[1]!.signal.aborted).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole('main', { name: 'Home' }));
  });

  it('keeps the main region focused if the API reference fails after entering documentation', async () => {
    reference.fail = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const link = screen.getByRole('link', { name: resources.en.translation.home.apiGuide });
    link.focus();
    await userEvent.setup().keyboard('{Enter}');
    await screen.findByRole('heading', { name: resources.en.translation.api.unavailableTitle });
    expect(document.activeElement).toBe(screen.getByRole('main', { name: resources.en.translation.api.title }));
    fireEvent.click(screen.getByRole('link', { name: resources.en.translation.api.returnToCalculator }));
    expect(document.activeElement).toBe(screen.getByRole('main', { name: resources.en.translation.cidr.title }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('focuses the homepage when following the recovery link on an unknown route', async () => {
    window.history.replaceState({}, '', '/missing-page');
    render(<App />);
    const link = screen.getByRole('link', { name: resources.en.translation.common.returnHome });
    link.focus();
    await userEvent.setup().keyboard('{Enter}');
    expect(document.activeElement).toBe(screen.getByRole('main', { name: 'Home' }));
  });
});
