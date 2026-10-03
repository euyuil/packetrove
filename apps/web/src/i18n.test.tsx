import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MAX_INPUT_LENGTH, MAX_INPUTS } from '@packetrove/contracts';
import { App } from './App';
import { render } from './test-utils';
import { createI18n } from './i18n';
import { languageSuggestionStorageKey } from './useLanguageSuggestion';

vi.mock('@scalar/api-reference-react', () => ({ ApiReferenceReact: () => <div>English API reference</div> }));

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
  document.documentElement.lang = 'en';
  window.sessionStorage.clear();
});

function openLanguageMenu() {
  fireEvent.click(screen.getByRole('button', { name: /^(Language|语言):/ }));
}

function chooseLanguage(name: 'English' | '中文') {
  openLanguageMenu();
  fireEvent.click(screen.getByRole('menuitem', { name }));
}

function calculate(input: string, chinese = false) {
  fireEvent.change(screen.getByLabelText(chinese ? 'IP 地址或 CIDR 网段' : 'IP addresses or CIDR ranges'), { target: { value: input } });
  fireEvent.click(screen.getByRole('button', { name: chinese ? '计算覆盖 CIDR' : 'Calculate covering CIDR' }));
}

describe('web internationalization', () => {
  it.each(['/zh/', '/zh', '/zh/index.html'])('opens the Chinese homepage at %s without detecting or uploading inputs', path => {
    window.history.replaceState({}, '', path);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: '面向用户与智能体的网络工具' })).toBeDefined();
    expect(screen.getByRole('link', { name: '最小覆盖 CIDR' }).getAttribute('href')).toBe('/zh/cidr-cover');
    expect(screen.getByRole('link', { name: '我的公网 IP' }).getAttribute('href')).toBe('/zh/public-ip');
    expect(screen.getByRole('link', { name: '阅读 API 指南' }).getAttribute('href')).toBe('/zh/docs/api');
    expect(within(screen.getByRole('banner')).queryByRole('link', { name: 'API 文档' })).toBeNull();
    expect(screen.getByRole('link', { name: '源代码：MIT' }).getAttribute('href')).toContain('/LICENSE');
    openLanguageMenu();
    expect(screen.getByRole('menuitem', { name: 'English' }).getAttribute('href')).toBe('/');
    expect(document.documentElement.lang).toBe('zh-Hans');
    expect(document.title).toBe('Packetrove — CIDR 计算器与公网 IP 查询');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://packetrove.com/zh/');
    expect(document.head.querySelector('link[hreflang="en"]')?.getAttribute('href')).toBe('https://packetrove.com/');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps English URLs English regardless of browser language', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('zh-CN');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Network tools for humans and agents' })).toBeDefined();
    expect(window.location.pathname).toBe('/');
  });

  it.each([
    { path: '/cidr-cover?source=example#tool', button: 'Language: English', current: 'English' },
    { path: '/zh/cidr-cover?source=example#tool', button: '语言: 中文', current: '中文' },
  ])('shows the current language and accessible, local flag icons at $path', ({ path, button, current }) => {
    window.history.replaceState({}, '', path);
    render(<App />);
    const trigger = screen.getByRole('button', { name: button, expanded: false });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.textContent).toBe(current);
    expect(trigger.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(trigger);
    const dropdown = screen.getByRole('menu', { name: button });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const english = within(dropdown).getByRole('menuitem', { name: 'English' });
    const chinese = within(dropdown).getByRole('menuitem', { name: '中文' });
    expect(english.tagName).toBe('A');
    expect(english.getAttribute('href')).toBe('/cidr-cover?source=example#tool');
    expect(english.getAttribute('lang')).toBe('en');
    expect(english.getAttribute('hreflang')).toBe('en');
    expect(chinese.getAttribute('href')).toBe('/zh/cidr-cover?source=example#tool');
    expect(chinese.getAttribute('lang')).toBe('zh-Hans');
    expect(chinese.getAttribute('hreflang')).toBe('zh-Hans');
    for (const item of [english, chinese]) {
      expect(item.getAttribute('aria-current')).toBe(item.textContent === current ? 'true' : null);
      expect(item.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
      expect(item.querySelector('img')).toBeNull();
    }
  });

  it('opens, navigates, selects, and dismisses the language menu using the keyboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    const trigger = screen.getByRole('button', { name: 'Language: English' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeDefined();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'English' }));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Deutsch' }));
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'English' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await user.keyboard('{Enter}{ArrowDown}{ArrowDown}{Enter}');
    expect(window.location.pathname).toBe('/de/');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: 'Sprache: Deutsch', expanded: false })).toBeDefined();
  });

  it.each(['ctrlKey', 'metaKey', 'shiftKey', 'altKey'])('preserves native link behavior for %s language clicks', modifier => {
    window.history.replaceState({}, '', '/cidr-cover?source=example#tool');
    render(<App />);
    openLanguageMenu();
    const link = screen.getByRole('menuitem', { name: '中文' });
    let preventedByApp: boolean | undefined;
    document.addEventListener('click', event => {
      preventedByApp = event.defaultPrevented;
      event.preventDefault();
    }, { once: true });
    fireEvent.click(link, { [modifier]: true });
    expect(preventedByApp).toBe(false);
    expect(window.location.pathname).toBe('/cidr-cover');
    expect(link.getAttribute('href')).toBe('/zh/cidr-cover?source=example#tool');
    expect(screen.getByRole('heading', { level: 1, name: 'Smallest Covering CIDR' })).toBeDefined();
  });

  it('preserves drafts, exact IPv6 counts, query strings, and fragments through language and page changes', () => {
    window.history.replaceState({}, '', '/cidr-cover?source=example#tool');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    calculate('::/0');
    chooseLanguage('中文');
    expect(window.location.pathname).toBe('/zh/cidr-cover');
    expect(window.location.search).toBe('?source=example');
    expect(window.location.hash).toBe('#tool');
    expect((screen.getByLabelText('IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('::/0');
    expect(screen.getAllByText('340,282,366,920,938,463,463,374,607,431,768,211,456')).toHaveLength(2);
    expect(screen.getByText('精确覆盖：此 CIDR 没有增加额外地址。')).toBeDefined();
    expect(document.title).toBe('最小覆盖 CIDR 计算器 — Packetrove');
    expect(document.head.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://packetrove.com/zh/cidr-cover');
    fireEvent.click(screen.getByRole('link', { name: '首页' }));
    fireEvent.click(screen.getByRole('link', { name: '最小覆盖 CIDR' }));
    expect((screen.getByLabelText('IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('::/0');
    chooseLanguage('English');
    expect(screen.getByText('Exact coverage: this CIDR adds no addresses.')).toBeDefined();
    expect(document.documentElement.lang).toBe('en');
    expect(storage).toHaveBeenCalledExactlyOnceWith(languageSuggestionStorageKey, '1');
    expect(storage.mock.contexts).toEqual([window.sessionStorage]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retranslates retained validation errors with physical input line numbers', () => {
    window.history.replaceState({}, '', '/cidr-cover');
    render(<App />);
    calculate('\n203.0.113.1\n\nbad\n::/129');
    const english = screen.getByRole('alert').textContent;
    chooseLanguage('中文');
    const issues = within(screen.getByRole('alert')).getAllByRole('listitem');
    expect(issues[0]?.textContent).toMatch(/^第 4 行：请输入标准 IPv4 或 IPv6 地址/);
    expect(issues[1]?.textContent).toMatch(/^第 5 行：请输入标准 IPv4 或 IPv6 地址/);
    expect(screen.getByRole('alert').textContent).not.toContain('Expected valid');
    chooseLanguage('English');
    expect(screen.getByRole('alert').textContent).toBe(english);
  });

  it.each([
    { input: '', message: '请至少输入一个 IP 地址或 CIDR 网段。' },
    { input: Array.from({ length: MAX_INPUTS + 1 }, () => '203.0.113.1').join('\n'), message: '每次计算最多支持 1000 项。' },
    { input: 'a'.repeat(MAX_INPUT_LENGTH + 1), message: '第 1 行：每项最多支持 64 个字符。' },
    { input: '203.0.113.1\n::1', message: '第 2 行：请使用 IPv4，与第一项保持一致。' },
  ])('explains Chinese validation: $message', ({ input, message }) => {
    window.history.replaceState({}, '', '/zh/cidr-cover');
    render(<App />);
    calculate(input, true);
    expect(screen.getByRole('alert').textContent).toContain(message);
  });

  it('retranslates clipboard success and failure without another clipboard write', async () => {
    window.history.replaceState({}, '', '/cidr-cover');
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    render(<App />);
    calculate('::1');
    await user.click(screen.getByRole('button', { name: 'Copy CIDR' }));
    chooseLanguage('中文');
    expect(screen.getByRole('status', { name: '' }).textContent).toBe('已复制 CIDR。');
    expect(write).toHaveBeenCalledExactlyOnceWith('::1/128');
    write.mockRejectedValueOnce(new Error('Denied'));
    await user.click(screen.getByRole('button', { name: /已复制/ }));
    expect(screen.getByRole('status', { name: '' }).textContent).toBe('无法使用剪贴板，请选中并复制上方 CIDR。');
    chooseLanguage('English');
    expect(screen.getByRole('status', { name: '' }).textContent).toBe('Copy is unavailable. Select and copy the CIDR above.');
    expect(screen.getByRole('button', { name: 'Dismiss copy error' })).toBeDefined();
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('retains a pending IP lookup across a language change and does not query again', async () => {
    window.history.replaceState({}, '', '/public-ip');
    let resolve!: (response: Response) => void;
    let signal!: AbortSignal;
    const fetch = vi.fn((_url: string, options: RequestInit) => {
      signal = options.signal!;
      return new Promise<Response>(complete => { resolve = complete; });
    });
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    chooseLanguage('中文');
    expect(screen.getByText('正在查询公网 IP…')).toBeDefined();
    expect(signal.aborted).toBe(false);
    resolve(Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    expect(await screen.findByText('203.0.113.1')).toBeDefined();
    expect(screen.getByRole('button', { name: '刷新 IP' })).toBeDefined();
    chooseLanguage('English');
    expect(screen.getByText('203.0.113.1')).toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retranslates stored IP errors and retries only on request', async () => {
    window.history.replaceState({}, '', '/public-ip');
    const fetch = vi.fn().mockRejectedValueOnce(new Error('Private connection detail'))
      .mockResolvedValueOnce(Response.json({ ip: '2001:db8::1', family: 'ipv6' }));
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    await screen.findByRole('alert');
    chooseLanguage('中文');
    expect(screen.getByRole('alert').textContent).toBe('无法连接到 IP 查询服务，请检查网络连接后重试。');
    expect(fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(await screen.findByText('2001:db8::1')).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('handles history language changes and unknown Chinese pages without losing a draft', () => {
    window.history.replaceState({}, '', '/cidr-cover');
    render(<App />);
    calculate('203.0.113.1');
    act(() => {
      window.history.pushState(null, '', '/zh/missing-page');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('heading', { level: 1, name: '页面不存在' })).toBeDefined();
    expect(document.title).toBe('页面不存在 — Packetrove');
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('link[hreflang]')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: '返回首页' }));
    fireEvent.click(screen.getByRole('link', { name: '最小覆盖 CIDR' }));
    expect((screen.getByLabelText('IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('203.0.113.1');
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
  });

  it('translates the API documentation shell and identifies the English reference', async () => {
    window.history.replaceState({}, '', '/zh/docs/api');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'API 文档' })).toBeDefined();
    expect(screen.getByText('交互式接口文档与规范使用英文。')).toBeDefined();
    expect(await screen.findByText('English API reference')).toBeDefined();
    expect(document.title).toBe('Packetrove API 文档 — CIDR 与公网 IP');
  });

  it('uses plural forms without rounding large address counts', () => {
    const english = createI18n('en');
    expect(english.t($ => $.cidr.entryCount, { count: 1, total: '1' })).toBe('1 entry');
    expect(english.t($ => $.cidr.entryCount, { count: 2, total: '2' })).toBe('2 entries');
    const chinese = createI18n('zh-Hans');
    expect(chinese.t($ => $.cidr.entryCount, { count: 1, total: '1' })).toBe('1 项');
    expect(chinese.t($ => $.cidr.entryCount, { count: 2, total: '2' })).toBe('2 项');
  });
});
