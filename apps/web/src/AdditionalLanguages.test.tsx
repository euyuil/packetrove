import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { render } from './test-utils';
import { createI18n } from './i18n';
import { locales, supportedLocales, type Locale } from './i18n/locales';
import { localizedPath, pagePaths, resolveRoute } from './i18n/routes';
import { en, resources } from './i18n/resources';
import { languageSuggestionStorageKey } from './useLanguageSuggestion';

const reference = vi.hoisted(() => ({ fail: false }));
vi.mock('@scalar/api-reference-react', () => ({ ApiReferenceReact: () => {
  if (reference.fail) throw new Error('Example documentation failure');
  return <div>English API reference</div>;
} }));

const additionalLanguages = [
  { locale: 'es', prefix: '/es', heading: 'Herramientas de red para personas y agentes de IA', count: '340.282.366.920.938.463.463.374.607.431.768.211.456' },
  { locale: 'de', prefix: '/de', heading: 'Netzwerkwerkzeuge für Menschen und KI-Agenten', count: '340.282.366.920.938.463.463.374.607.431.768.211.456' },
  { locale: 'ja', prefix: '/ja', heading: '人と AI エージェントのためのネットワークツール', count: '340,282,366,920,938,463,463,374,607,431,768,211,456' },
  { locale: 'fr', prefix: '/fr', heading: 'Des outils réseau pour les utilisateurs et les agents IA', count: '340\u202f282\u202f366\u202f920\u202f938\u202f463\u202f463\u202f374\u202f607\u202f431\u202f768\u202f211\u202f456' },
  { locale: 'pt-BR', prefix: '/pt', heading: 'Ferramentas de rede para pessoas e agentes de IA', count: '340.282.366.920.938.463.463.374.607.431.768.211.456' },
  { locale: 'ru', prefix: '/ru', heading: 'Сетевые инструменты для людей и ИИ-агентов', count: '340\u00a0282\u00a0366\u00a0920\u00a0938\u00a0463\u00a0463\u00a0374\u00a0607\u00a0431\u00a0768\u00a0211\u00a0456' },
  { locale: 'ko', prefix: '/ko', heading: '사용자와 AI 에이전트를 위한 네트워크 도구', count: '340,282,366,920,938,463,463,374,607,431,768,211,456' },
  { locale: 'it', prefix: '/it', heading: 'Strumenti di rete per persone e agenti IA', count: '340.282.366.920.938.463.463.374.607.431.768.211.456' },
] as const;

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  reference.fail = false;
  window.history.replaceState({}, '', '/');
  document.documentElement.lang = 'en';
});

function chooseLanguage(locale: Locale) {
  const current = resolveRoute(window.location.pathname).locale;
  fireEvent.click(screen.getByRole('button', {
    name: resources[current].translation.common.language + ': ' + locales[current].name,
  }));
  fireEvent.click(screen.getByRole('menuitem', { name: locales[locale].name }));
}

function calculate(input: string) {
  const translation = resources[resolveRoute(window.location.pathname).locale].translation;
  fireEvent.change(screen.getByLabelText(translation.cidr.inputLabel), { target: { value: input } });
  fireEvent.click(screen.getByRole('button', { name: translation.cidr.calculate }));
}

describe('additional website languages', () => {
  it.each(additionalLanguages)('opens the $locale homepage with localized links and metadata', ({ locale, prefix, heading }) => {
    window.history.replaceState({}, '', prefix + '/');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const translation = resources[locale].translation;
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeDefined();
    expect(screen.getByRole('link', { name: translation.cidr.title }).getAttribute('href')).toBe(prefix + '/cidr-cover');
    expect(screen.getByRole('link', { name: translation.ip.title }).getAttribute('href')).toBe(prefix + '/public-ip');
    expect(screen.getByRole('link', { name: translation.home.apiGuide }).getAttribute('href')).toBe(prefix + '/docs/api');
    expect(document.documentElement.lang).toBe(locale);
    expect(document.title).toBe(translation.meta.home.title);
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(translation.meta.home.description);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://packetrove.com' + prefix + '/');
    expect(document.head.querySelectorAll('link[rel="alternate"][hreflang]')).toHaveLength(supportedLocales.length + 1);
    for (const language of supportedLocales) {
      expect(document.head.querySelector(`link[hreflang="${language}"]`)?.getAttribute('href'))
        .toBe('https://packetrove.com' + localizedPath('/', language));
    }
    fireEvent.click(screen.getByRole('button', { name: translation.common.language + ': ' + locales[locale].name }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(supportedLocales.length);
    for (const language of supportedLocales) {
      const link = within(menu).getByRole('menuitem', { name: locales[language].name });
      expect(link.getAttribute('href')).toBe(localizedPath('/', language));
      expect(link.getAttribute('hreflang')).toBe(language);
      expect(link.getAttribute('aria-current')).toBe(language === locale ? 'true' : null);
      expect(link.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
      expect(link.querySelector('img')).toBeNull();
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(additionalLanguages)('preserves the draft, exact IPv6 counts, and URL suffixes when switching to $locale', ({ locale, prefix, count }) => {
    window.history.replaceState({}, '', '/cidr-cover?source=example#tool');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    calculate('::/0');
    chooseLanguage(locale);
    const translation = resources[locale].translation;
    expect(window.location.pathname).toBe(prefix + '/cidr-cover');
    expect(window.location.search).toBe('?source=example');
    expect(window.location.hash).toBe('#tool');
    expect((screen.getByLabelText(translation.cidr.inputLabel) as HTMLTextAreaElement).value).toBe('::/0');
    expect(screen.getAllByText(count, { normalizer: text => text })).toHaveLength(2);
    expect(screen.getByText(translation.cidr.exact)).toBeDefined();
    expect(document.title).toBe(translation.meta.cidr.title);
    fireEvent.click(screen.getByRole('link', { name: translation.common.home }));
    fireEvent.click(screen.getByRole('link', { name: translation.cidr.title }));
    expect(screen.getAllByText(count, { normalizer: text => text })).toHaveLength(2);
    chooseLanguage('en');
    expect(screen.getByText(en.cidr.exact)).toBeDefined();
    expect(storage).toHaveBeenCalledExactlyOnceWith(languageSuggestionStorageKey, '1');
    expect(storage.mock.contexts).toEqual([window.sessionStorage]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(additionalLanguages)('retranslates physical-line validation errors in $locale', ({ locale }) => {
    window.history.replaceState({}, '', '/cidr-cover');
    render(<App />);
    calculate('\n203.0.113.1\n\nbad');
    const english = screen.getByRole('alert').textContent;
    chooseLanguage(locale);
    const translation = resources[locale].translation;
    expect(screen.getByRole('alert').textContent).toContain(translation.errors.invalidInput);
    const issues = within(screen.getByRole('alert')).getAllByRole('listitem');
    expect(issues).toHaveLength(1);
    expect(issues[0]?.textContent).toBe(createI18n(locale).t($ => $.cidr.line, { line: '4', message: translation.errors.invalidAddress }));
    chooseLanguage('en');
    expect(screen.getByRole('alert').textContent).toBe(english);
  });

  it.each(additionalLanguages)('keeps a pending IP lookup and its result when switching to $locale', async ({ locale }) => {
    window.history.replaceState({}, '', '/public-ip');
    let complete!: (response: Response) => void;
    let signal!: AbortSignal;
    const fetch = vi.fn((_url: string, options: RequestInit) => {
      signal = options.signal!;
      return new Promise<Response>(resolve => { complete = resolve; });
    });
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    chooseLanguage(locale);
    expect(screen.getByText(resources[locale].translation.ip.checking)).toBeDefined();
    expect(signal.aborted).toBe(false);
    complete(Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    expect(await screen.findByText('203.0.113.1')).toBeDefined();
    chooseLanguage('en');
    expect(screen.getByText('203.0.113.1')).toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(additionalLanguages)('retranslates clipboard feedback in $locale without repeating a write', async ({ locale }) => {
    window.history.replaceState({}, '', '/cidr-cover');
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    render(<App />);
    calculate('::1');
    await user.click(screen.getByRole('button', { name: en.cidr.copy }));
    chooseLanguage(locale);
    const translation = resources[locale].translation;
    expect(screen.getByRole('status', { name: '' }).textContent).toBe(translation.cidr.copySuccess);
    expect(write).toHaveBeenCalledExactlyOnceWith('::1/128');
    write.mockRejectedValueOnce(new Error('Example clipboard failure'));
    await user.click(screen.getByRole('button', { name: translation.common.copied }));
    expect(screen.getByRole('status', { name: '' }).textContent).toBe(translation.cidr.copyFailure);
    expect(screen.getByRole('button', { name: translation.common.dismissCopy })).toBeDefined();
    chooseLanguage('en');
    expect(screen.getByRole('status', { name: '' }).textContent).toBe(en.cidr.copyFailure);
    expect(write).toHaveBeenCalledTimes(2);
  });

  it.each(additionalLanguages)('retranslates stored IP failures in $locale without another request', async ({ locale }) => {
    window.history.replaceState({}, '', '/public-ip');
    const fetch = vi.fn().mockRejectedValue(new Error('Example connection failure'));
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    await screen.findByRole('alert');
    chooseLanguage(locale);
    expect(screen.getByRole('alert').textContent).toBe(resources[locale].translation.errors.network);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(additionalLanguages)('identifies the English API reference on the $locale documentation page', async ({ locale, prefix }) => {
    window.history.replaceState({}, '', prefix + '/docs/api');
    render(<App />);
    const translation = resources[locale].translation;
    expect(await screen.findByRole('heading', { level: 1, name: translation.api.title })).toBeDefined();
    expect(screen.getByText(translation.api.englishReference)).toBeDefined();
    expect(await screen.findByText('English API reference')).toBeDefined();
  });

  it.each(additionalLanguages)('localizes API failure recovery in $locale and preserves the calculation', async ({ locale, prefix, count }) => {
    reference.fail = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.history.replaceState({}, '', prefix + '/cidr-cover');
    render(<App />);
    calculate('::/0');
    act(() => {
      window.history.pushState(null, '', prefix + '/docs/api');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    const translation = resources[locale].translation;
    expect(await screen.findByRole('heading', { name: translation.api.unavailableTitle })).toBeDefined();
    fireEvent.click(screen.getByRole('link', { name: translation.api.returnToCalculator }));
    expect(window.location.pathname).toBe(prefix + '/cidr-cover');
    expect(screen.getAllByText(count, { normalizer: text => text })).toHaveLength(2);
  });

  it.each(additionalLanguages)('renders unknown $locale routes with localized text and no canonical metadata', ({ locale, prefix }) => {
    window.history.replaceState({}, '', prefix + '/missing-page');
    render(<App />);
    const translation = resources[locale].translation;
    expect(screen.getByRole('heading', { level: 1, name: translation.common.notFound })).toBeDefined();
    expect(screen.getByRole('link', { name: translation.common.returnHome }).getAttribute('href')).toBe(prefix + '/');
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('link[hreflang]')).toBeNull();
  });

  it.each([
    { locale: 'es', one: '1 entrada', other: '2 entradas', many: '1.000.000 entradas' },
    { locale: 'de', one: '1 Eintrag', other: '2 Einträge', many: '1.000.000 Einträge' },
    { locale: 'ja', one: '1 件', other: '2 件', many: '1,000,000 件' },
  ] as const)('uses the $locale plural rules and count formatting', ({ locale, one, other, many }) => {
    const instance = createI18n(locale);
    const formatter = new Intl.NumberFormat(locale);
    expect(instance.t($ => $.cidr.entryCount, { count: 1, total: '1' })).toBe(one);
    expect(instance.t($ => $.cidr.entryCount, { count: 2, total: '2' })).toBe(other);
    expect(instance.t($ => $.cidr.entryCount, { count: 1_000_000, total: formatter.format(1_000_000) })).toBe(many);
  });

  it.each(supportedLocales)('shows exact additional counts and neutral coverage messages in %s', locale => {
    window.history.replaceState({}, '', localizedPath(pagePaths.cidr, locale));
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const translation = resources[locale].translation.cidr;
    const formatter = new Intl.NumberFormat(locale);
    for (const [input, additional] of [
      ['203.0.113.0/30', 0n],
      ['203.0.113.1,203.0.113.2,203.0.113.3', 1n],
      ['203.0.113.0,203.0.113.3', 2n],
      ['2001:db8::1,2001:db8:8000::1', 79228162514264337593543950334n],
    ] as const) {
      calculate(input);
      const notice = screen.getByRole('note');
      expect(within(notice).getByText(translation.additional).nextElementSibling?.textContent)
        .toBe(formatter.format(additional));
      expect(within(notice).getByText(additional === 0n ? translation.exact : translation.expansion)).toBeDefined();
      expect(within(notice).queryByText(additional === 0n ? translation.expansion : translation.exact)).toBeNull();
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses only the other entry-count branch for Chinese, including zero and one', () => {
    const instance = createI18n('zh-Hans');
    for (const [count, expected] of [[0, '0 项'], [1, '1 项'], [2, '2 项']] as const) {
      expect(instance.t($ => $.cidr.entryCount, { count, total: String(count) })).toBe(expected);
    }
  });

  it.each([
    { locale: 'fr', zero: '0 entrée', one: '1 entrée', other: '2 entrées', many: '1\u202f000\u202f000 entrées' },
    { locale: 'pt-BR', zero: '0 entrada', one: '1 entrada', other: '2 entradas', many: '1.000.000 entradas' },
    { locale: 'ko', zero: '0개 항목', one: '1개 항목', other: '2개 항목', many: '1,000,000개 항목' },
    { locale: 'it', zero: '0 voci', one: '1 voce', other: '2 voci', many: '1.000.000 voci' },
  ] as const)('handles zero, singular, plural, and million counts in $locale', ({ locale, zero, one, other, many }) => {
    const instance = createI18n(locale);
    const formatter = new Intl.NumberFormat(locale);
    for (const [count, expected] of [[0, zero], [1, one], [2, other], [1_000_000, many]] as const) {
      expect(instance.t($ => $.cidr.entryCount, { count, total: formatter.format(count) })).toBe(expected);
    }
  });

  it('uses Russian one, few, and many entry counts including teens and compound endings', () => {
    const instance = createI18n('ru');
    const formatter = new Intl.NumberFormat('ru');
    for (const [count, expected] of [
      [0, '0 записей'], [1, '1 запись'], [2, '2 записи'], [5, '5 записей'],
      [11, '11 записей'], [21, '21 запись'], [22, '22 записи'], [25, '25 записей'],
      [101, '101 запись'], [1_000_000, '1\u00a0000\u00a0000 записей'],
    ] as const) {
      expect(instance.t($ => $.cidr.entryCount, { count, total: formatter.format(count) })).toBe(expected);
    }
  });
});
