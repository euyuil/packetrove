import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as core from '@packetrove/core';
import { App } from './App';
import { render } from './test-utils';
import { locales, type Locale } from './i18n/locales';
import { resources } from './i18n/resources';

const includeLabel = 'Included IP addresses or CIDRs';
const excludeLabel = 'Excluded IP addresses or CIDRs';

beforeEach(() => { window.history.replaceState({}, '', '/cidr/subtract'); });
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

function enter(include: string, exclude = '') {
  fireEvent.change(screen.getByLabelText(includeLabel), { target: { value: include } });
  fireEvent.change(screen.getByLabelText(excludeLabel), { target: { value: exclude } });
  fireEvent.click(screen.getByRole('button', { name: 'Subtract CIDRs' }));
}

function output() {
  return (screen.getByLabelText('Remaining CIDRs') as HTMLTextAreaElement).value;
}

async function chooseLanguage(name: string) {
  fireEvent.click(screen.getByRole('button', { name: /^(Language|语言):/ }));
  fireEvent.click(screen.getByRole('menuitem', { name }));
  await waitFor(() => { expect(screen.queryByRole('menu')).toBeNull(); });
}

describe('browser-local CIDR subtraction', () => {
  it.each(['/cidr/subtract', '/cidr/subtract/', '/cidr/subtract.html'])('opens directly at %s with metadata', pathname => {
    window.history.replaceState({}, '', pathname);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    expect(screen.getByRole('heading', { name: 'CIDR Subtraction', level: 1 })).toBeDefined();
    expect(screen.getByRole('link', { name: 'CIDR Subtraction' }).getAttribute('aria-current')).toBe('page');
    expect(document.title).toBe('CIDR Subtraction Calculator — Packetrove');
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('calculates two lists locally without uploads, storage writes or input-bearing URLs', () => {
    const calculation = vi.spyOn(core, 'subtractCidrs');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const log = vi.spyOn(console, 'log');
    render(<App />);
    enter('203.0.113.7/24\n203.0.113.0/24', '203.0.113.64/26\n198.51.100.0/24');
    expect(calculation).toHaveBeenCalledExactlyOnceWith({
      include: ['203.0.113.7/24', '203.0.113.0/24'], exclude: ['203.0.113.64/26', '198.51.100.0/24'],
    });
    expect(output()).toBe('203.0.113.0/26\n203.0.113.128/25');
    expect(screen.getByText('Included addresses').nextElementSibling?.textContent).toBe('256');
    expect(screen.getByText('Addresses removed').nextElementSibling?.textContent).toBe('64');
    expect(screen.getByText('Remaining addresses').nextElementSibling?.textContent).toBe('192');
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/cidr/subtract');
  });

  it.each([
    ['commas', ', '], ['spaces', ' '], ['tabs', '\t'], ['full-width commas', '，'],
    ['Unicode spaces', '\u00a0\u3000'], ['mixed repeated separators', ',， \t\r\n, '],
  ])('subtracts pasted lists separated by %s locally', (_, separator) => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    enter(['203.0.113.0/25', '203.0.113.128/25'].join(separator),
      ['203.0.113.64/26', '198.51.100.0/24'].join(separator));
    expect(output()).toBe('203.0.113.0/26\n203.0.113.128/25');
    expect(screen.getByText('4 entries')).toBeDefined();
    expect(screen.getByText('Remaining addresses').nextElementSibling?.textContent).toBe('192');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('simplifies an empty exclusion list exactly while preserving gaps', () => {
    render(<App />);
    enter('203.0.113.0/26\n203.0.113.32/27\n203.0.113.128/26', ',， \t\n');
    expect(output()).toBe('203.0.113.0/26\n203.0.113.128/26');
    expect(screen.getByText('Addresses removed').nextElementSibling?.textContent).toBe('0');
  });

  it('displays exact full IPv6 counts', () => {
    render(<App />);
    enter('::/0');
    expect(output()).toBe('::/0');
    expect(screen.getAllByText('340,282,366,920,938,463,463,374,607,431,768,211,456')).toHaveLength(2);
  });

  it('makes complete removal explicit and disables both copy actions', () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<App />);
    enter('203.0.113.0/26', '203.0.113.0/24');
    expect(screen.getByText('No addresses remain')).toBeDefined();
    expect(screen.queryByLabelText('Remaining CIDRs')).toBeNull();
    for (const name of ['Copy with newlines', 'Copy with commas']) {
      const button = screen.getByRole('button', { name }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      fireEvent.click(button);
    }
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByText('Copied with newlines.')).toBeNull();
  });

  it('rejects empty inclusion with a useful list-specific error', () => {
    render(<App />);
    enter('\n ,， \t\n');
    expect(screen.getByRole('alert').textContent).toContain('Include: Include at least one IP address or CIDR range.');
    expect(screen.getByLabelText(includeLabel).getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText(excludeLabel).getAttribute('aria-invalid')).not.toBe('true');
  });

  it.each(['\n', '\r\n', '\u2028', '\u2029'])('reports the correct list and physical line with %j separators', separator => {
    render(<App />);
    enter(['', '203.0.113.0/24, 203.0.113.7/24', 'bad，broken'].join(separator),
      ['', '', '203.0.113.1\t203.0.113.2', ',， ', '::/129'].join(separator));
    const errors = within(screen.getByRole('alert')).getAllByRole('listitem');
    expect(errors).toHaveLength(3);
    expect(errors[0]?.textContent).toMatch(/^Include, line 3:/);
    expect(errors[1]?.textContent).toMatch(/^Include, line 3:/);
    expect(errors[2]?.textContent).toMatch(/^Exclude, line 5:/);
    for (const label of [includeLabel, excludeLabel]) {
      const input = screen.getByLabelText(label);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toContain('subtraction-errors');
    }
    expect(screen.queryByRole('button', { name: 'Copy with newlines' })).toBeNull();
  });

  it('rejects mixed address families even for an exclusion outside the include set', () => {
    render(<App />);
    enter('203.0.113.0/24', '::1');
    expect(screen.getByRole('alert').textContent).toContain('Exclude, line 1: Expected IPv4');
    expect(screen.getByLabelText(includeLabel).getAttribute('aria-invalid')).not.toBe('true');
    expect(screen.queryByLabelText('Remaining CIDRs')).toBeNull();
  });

  it('enforces the combined entry limit for mixed separators, including duplicates', () => {
    render(<App />);
    const include = new Array(500).fill('203.0.113.1').join(', ');
    enter(include, new Array(500).fill('203.0.113.1').join('\t'));
    expect(screen.getByText('1,000 entries')).toBeDefined();
    expect(screen.getByText('No addresses remain')).toBeDefined();
    enter(include, new Array(501).fill('203.0.113.1').join('\t'));
    expect(screen.getByText('1,001 entries')).toBeDefined();
    expect(screen.getByRole('alert').textContent).toContain('Use at most 1000 entries across both lists.');
    expect(screen.queryByText('No addresses remain')).toBeNull();
    expect(screen.queryByLabelText('Remaining CIDRs')).toBeNull();
  });

  it('shows a localized output limit error with no truncated result', async () => {
    render(<App />);
    enter(Array.from({ length: 126 }, (_, index) => `2001:db8:${(index * 2).toString(16)}::/48`).join('\n'),
      Array.from({ length: 126 }, (_, index) => `2001:db8:${(index * 2).toString(16)}::1/128`).join('\n'));
    expect(screen.getByRole('alert').textContent).toContain('No partial result is returned.');
    expect(screen.queryByLabelText('Remaining CIDRs')).toBeNull();
    await chooseLanguage(locales['zh-Hans'].name);
    expect(screen.getByRole('alert').textContent).toContain('不会返回部分结果');
    expect(screen.queryByRole('button', { name: '复制（换行分隔）' })).toBeNull();
  });

  it.each([includeLabel, excludeLabel])('clears old results and feedback when editing %s', async label => {
    const user = userEvent.setup();
    render(<App />);
    enter('203.0.113.0/24', '203.0.113.64/26');
    await user.click(screen.getByRole('button', { name: 'Copy with newlines' }));
    expect(screen.getByText('Copied with newlines.')).toBeDefined();
    fireEvent.change(screen.getByLabelText(label), { target: { value: '203.0.113.1' } });
    expect(screen.queryByLabelText('Remaining CIDRs')).toBeNull();
    expect(screen.queryByText('Copied with newlines.')).toBeNull();
  });

  it('loads both documented examples and clears both drafts', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'IPv4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Subtract CIDRs' }));
    expect(output()).toBe('203.0.113.0/26\n203.0.113.128/25');
    fireEvent.click(screen.getByRole('button', { name: 'IPv6' }));
    fireEvent.click(screen.getByRole('button', { name: 'Subtract CIDRs' }));
    expect(output()).toBe('2001:db8::/126\n2001:db8::8/125');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect((screen.getByLabelText(includeLabel) as HTMLTextAreaElement).value).toBe('');
    expect((screen.getByLabelText(excludeLabel) as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByLabelText('Remaining CIDRs')).toBeNull();
  });
});

describe('copy formats and retained subtraction state', () => {
  it.each(['es', 'de', 'ja', 'fr', 'pt-BR', 'ru', 'ko', 'it'] as const)('retains the exact result, formats counts and translates list errors in %s', async (locale: Locale) => {
    const calculation = vi.spyOn(core, 'subtractCidrs');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    enter('::/0', '::1');
    const result = output();
    await chooseLanguage(locales[locale].name);
    const text = resources[locale].translation;
    expect((screen.getByLabelText(text.subtract.output) as HTMLTextAreaElement).value).toBe(result);
    expect(screen.getByText(text.subtract.remaining).nextElementSibling?.textContent)
      .toBe(new Intl.NumberFormat(locale).format(340282366920938463463374607431768211455n));
    expect(window.location.pathname).toBe(locales[locale].prefix + '/cidr/subtract');
    expect(calculation).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText(text.subtract.excludeLabel), { target: { value: '\n\nbad' } });
    fireEvent.click(screen.getByRole('button', { name: text.subtract.calculate }));
    expect(screen.getByRole('alert').textContent).toContain(text.errors.invalidAddress);
    expect(screen.getByRole('alert').textContent).toContain(text.subtract.exclude);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('copies the complete list and accepts the copied format in either CIDR tool', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<App />);
    enter('::/0，::/0', '2001:db8::1\t2001:db8::1');
    const all = output();
    expect(all.split('\n')).toHaveLength(128);
    await user.click(screen.getByRole('button', { name: 'Copy with newlines' }));
    expect(writeText).toHaveBeenLastCalledWith(all);
    expect(screen.getByText('Copied with newlines.')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Copy with commas' }));
    expect(writeText).toHaveBeenLastCalledWith(all.split('\n').join(', '));
    expect(screen.getByText('Copied with commas.')).toBeDefined();
    expect(screen.queryByText('Copied with newlines.')).toBeNull();
    const copied = writeText.mock.calls.at(-1)![0];
    enter(copied);
    expect(output()).toBe(all);
    fireEvent.click(screen.getByRole('link', { name: 'Smallest Covering CIDR' }));
    fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value: copied } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
    expect(screen.getByText('::/0')).toBeDefined();
    expect(screen.getByText('Additional addresses').nextElementSibling?.textContent).toBe('1');
  });

  it('keeps the complete list selectable when copying fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Denied'));
    render(<App />);
    enter('203.0.113.0/24', '203.0.113.64/26');
    await user.click(screen.getByRole('button', { name: 'Copy with commas' }));
    const list = screen.getByLabelText('Remaining CIDRs') as HTMLTextAreaElement;
    expect(list.readOnly).toBe(true);
    list.focus(); list.select();
    expect(list.selectionEnd - list.selectionStart).toBe(list.value.length);
    expect(screen.getAllByText('Copy is unavailable. Select and copy the list above.').length).toBeGreaterThan(0);
  });

  it('preserves both drafts and exact results through language switches and navigation', async () => {
    const calculation = vi.spyOn(core, 'subtractCidrs');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    enter('::/0', '::1');
    const input = screen.getByLabelText(includeLabel);
    const result = output();
    await chooseLanguage(locales['zh-Hans'].name);
    expect(screen.getByLabelText('包含的 IP 地址或 CIDR 网段')).toBe(input);
    expect((screen.getByLabelText('剩余 CIDR 列表') as HTMLTextAreaElement).value).toBe(result);
    expect(screen.getByText('340,282,366,920,938,463,463,374,607,431,768,211,455')).toBeDefined();
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://packetrove.com/zh/cidr/subtract');
    fireEvent.click(screen.getByRole('link', { name: '最小覆盖 CIDR' }));
    expect((screen.getByLabelText('IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('');
    fireEvent.click(screen.getByRole('link', { name: 'CIDR 相减' }));
    expect((screen.getByLabelText('包含的 IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('::/0');
    expect((screen.getByLabelText('排除的 IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('::1');
    await chooseLanguage('English');
    expect(output()).toBe(result);
    expect(calculation).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retranslates retained errors while preserving both lists and physical lines', async () => {
    const calculation = vi.spyOn(core, 'subtractCidrs');
    render(<App />);
    enter('\n203.0.113.1\nbad', '\n\n::/129');
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    fireEvent.click(screen.getByRole('link', { name: 'CIDR Subtraction' }));
    await chooseLanguage(locales['zh-Hans'].name);
    expect(screen.getByRole('alert').textContent).toContain('包含列表第 3 行');
    expect(screen.getByRole('alert').textContent).toContain('排除列表第 3 行');
    expect(calculation).toHaveBeenCalledTimes(1);
  });

  it('preserves unfinished drafts through actual history back and forward', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(includeLabel), { target: { value: '203.0.113.' } });
    fireEvent.change(screen.getByLabelText(excludeLabel), { target: { value: '198.51.100.' } });
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    act(() => { window.history.back(); });
    await waitFor(() => { expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('CIDR Subtraction'); });
    expect((screen.getByLabelText(includeLabel) as HTMLTextAreaElement).value).toBe('203.0.113.');
    expect((screen.getByLabelText(excludeLabel) as HTMLTextAreaElement).value).toBe('198.51.100.');
    act(() => { window.history.forward(); });
    await waitFor(() => { expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Network tools for humans and agents'); });
  });

  it('starts a new page session with empty drafts', () => {
    const first = render(<App />);
    enter('203.0.113.1');
    first.unmount();
    render(<App />);
    expect((screen.getByLabelText(includeLabel) as HTMLTextAreaElement).value).toBe('');
    expect((screen.getByLabelText(excludeLabel) as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByLabelText('Remaining CIDRs')).toBeNull();
  });
});
