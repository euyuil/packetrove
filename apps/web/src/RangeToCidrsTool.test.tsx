import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RANGE_TO_CIDRS_EXAMPLES } from '@packetrove/contracts';
import * as core from '@packetrove/core';
import { App } from './App';
import { render } from './test-utils';
import { locales, supportedLocales } from './i18n/locales';
import { localizedPath } from './i18n/routes';
import { resources } from './i18n/resources';

beforeEach(() => { window.history.replaceState({}, '', '/range-to-cidrs'); });
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

function enter(start: string, end: string) {
  fireEvent.change(screen.getByLabelText('Start IP'), { target: { value: start } });
  fireEvent.change(screen.getByLabelText('End IP'), { target: { value: end } });
  fireEvent.click(screen.getByRole('button', { name: 'Convert range to CIDRs' }));
}

const output = () => (screen.getByLabelText('Exact CIDR list') as HTMLTextAreaElement).value;

async function chooseLanguage(name: string) {
  fireEvent.click(screen.getByRole('button', { name: /^Language:/ }));
  fireEvent.click(screen.getByRole('menuitem', { name }));
  await waitFor(() => { expect(screen.queryByRole('menu')).toBeNull(); });
}

describe('browser-local IP range conversion', () => {
  it.each(['/range-to-cidrs', '/range-to-cidrs/', '/range-to-cidrs.html'])('opens %s without a lookup', pathname => {
    window.history.replaceState({}, '', pathname);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'IP Range to CIDRs' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'IP Range to CIDRs' }).getAttribute('aria-current')).toBe('page');
    expect(document.title).toBe(resources.en.translation.meta.range.title);
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(RANGE_TO_CIDRS_EXAMPLES)('calculates the exact $name example with no input disclosure', ({ request, result }) => {
    const calculation = vi.spyOn(core, 'rangeToCidrs');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const log = vi.spyOn(console, 'log');
    render(<App />);
    enter(request.start, request.end);
    expect(calculation).toHaveBeenCalledExactlyOnceWith(request);
    expect(output()).toBe(result.cidrs.join('\n'));
    expect(screen.getByText('Addresses in range').nextElementSibling?.textContent).toBe('13');
    expect(screen.getByText('Result CIDRs').nextElementSibling?.textContent).toBe('3');
    const status = screen.getByRole('status', { name: 'Exact range result' });
    expect(status.textContent).toBe('Calculation complete. Addresses: 13. CIDRs: 3.');
    expect(status.textContent).not.toContain(result.cidrs[0]);
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/range-to-cidrs');
  });
  it('formats full IPv6 counts exactly and displays normalized endpoints', () => {
    render(<App />);
    enter(' :: ', 'FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF');
    expect(output()).toBe('::/0');
    expect(screen.getByText('Addresses in range').nextElementSibling?.textContent)
      .toBe('340,282,366,920,938,463,463,374,607,431,768,211,456');
    expect(screen.getByText('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBeDefined();
  });
  it('focuses all located endpoint errors and supports correction without changing the URL', () => {
    render(<App />);
    enter('bad', '::/128');
    const alert = screen.getByRole('alert');
    expect(document.activeElement).toBe(alert);
    const links = within(alert).getAllByRole('link');
    expect(links.map(link => link.getAttribute('href'))).toEqual(['#range-start', '#range-end']);
    expect(links[0]?.textContent).toContain('Start IP: Use a standard IPv4 or IPv6 address without a CIDR prefix.');
    expect(links[1]?.textContent).toBe('End IP: Enter an IP address without a CIDR prefix.');
    for (const label of ['Start IP', 'End IP']) {
      const input = screen.getByLabelText(label);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toContain('range-errors');
    }
    fireEvent.click(links[1]!);
    expect(document.activeElement).toBe(screen.getByLabelText('End IP'));
    expect(window.location.hash).toBe('');
    expect(screen.queryByLabelText('Exact CIDR list')).toBeNull();
  });
  it.each([
    ['203.0.113.23', '203.0.113.11', 'Enter an end IP at or after the start IP.'],
    ['203.0.113.11', '2001:db8::17', 'Use IPv4 to match the start IP.'],
    ['203.0.113.11', '', 'Enter one IPv4 or IPv6 address'],
  ])('identifies End IP when converting %s through %s fails', (start, end, message) => {
    render(<App />);
    enter(start, end);
    expect(screen.getByRole('alert').textContent).toContain('End IP: ' + message);
    expect(screen.getByLabelText('End IP').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Start IP').getAttribute('aria-invalid')).not.toBe('true');
  });
  it('loads shared examples, keeps focus on success, and clears both endpoints', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const example of RANGE_TO_CIDRS_EXAMPLES) {
      await user.click(screen.getByRole('button', { name: example.name }));
      const button = screen.getByRole('button', { name: 'Convert range to CIDRs' });
      await user.click(button);
      expect(output()).toBe(example.result.cidrs.join('\n'));
      expect(document.activeElement).toBe(button);
    }
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect((screen.getByLabelText('Start IP') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('End IP') as HTMLInputElement).value).toBe('');
    expect(screen.queryByLabelText('Exact CIDR list')).toBeNull();
    expect(screen.getByRole('status', { name: 'Exact range result' }).textContent).toBe('');
  });
});

describe('complete copies and in-memory range state', () => {
  it('copies every CIDR in a maximal IPv6 result with either separator', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<App />);
    enter('::1', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:fffe');
    const all = output();
    expect(all.split('\n')).toHaveLength(254);
    await user.click(screen.getByRole('button', { name: 'Copy with newlines' }));
    expect(writeText).toHaveBeenLastCalledWith(all);
    expect(screen.getByText('Copied with newlines.')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Copy with commas' }));
    expect(writeText).toHaveBeenLastCalledWith(all.split('\n').join(', '));
    expect(screen.getByText('Copied with commas.')).toBeDefined();
    expect(screen.queryByText('Copied with newlines.')).toBeNull();
  });
  it.each(['Start IP', 'End IP'])('clears stale results and copy feedback when editing %s', async label => {
    const user = userEvent.setup();
    render(<App />);
    enter('203.0.113.11', '203.0.113.23');
    await user.click(screen.getByRole('button', { name: 'Copy with newlines' }));
    fireEvent.change(screen.getByLabelText(label), { target: { value: '203.0.113.12' } });
    expect(screen.queryByLabelText('Exact CIDR list')).toBeNull();
    expect(screen.queryByText('Copied with newlines.')).toBeNull();
    expect(screen.getByRole('status', { name: 'Exact range result' }).textContent).toBe('');
  });
  it('ignores clipboard completion for a result that has been edited', async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    vi.spyOn(navigator.clipboard, 'writeText').mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
    render(<App />);
    enter('203.0.113.11', '203.0.113.23');
    await user.click(screen.getByRole('button', { name: 'Copy with commas' }));
    fireEvent.change(screen.getByLabelText('Start IP'), { target: { value: '203.0.113.12' } });
    await act(async () => { finish(); });
    expect(screen.queryByText('Copied with commas.')).toBeNull();
    expect(screen.queryByLabelText('Exact CIDR list')).toBeNull();
  });
  it('keeps the full output selectable if clipboard access fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Denied'));
    render(<App />);
    enter('203.0.113.11', '203.0.113.23');
    await user.click(screen.getByRole('button', { name: 'Copy with commas' }));
    const list = screen.getByLabelText('Exact CIDR list') as HTMLTextAreaElement;
    expect(list.readOnly).toBe(true);
    list.focus(); list.select();
    expect(list.selectionEnd - list.selectionStart).toBe(list.value.length);
    expect(screen.getAllByText(resources.en.translation.subtract.copyFailure).length).toBeGreaterThan(0);
  });
  it.each(supportedLocales)('retains exact results and translates located errors in %s', async locale => {
    const calculation = vi.spyOn(core, 'rangeToCidrs');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    enter('::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
    await chooseLanguage(locales[locale].name);
    const text = resources[locale].translation;
    expect((screen.getByLabelText(text.range.output) as HTMLTextAreaElement).value).toBe('::/0');
    expect(screen.getByText(text.range.addresses).nextElementSibling?.textContent)
      .toBe(new Intl.NumberFormat(locale).format(340282366920938463463374607431768211456n));
    expect(window.location.pathname).toBe(localizedPath('/range-to-cidrs', locale));
    expect(document.title).toBe(text.meta.range.title);
    expect(calculation).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText(text.range.start), { target: { value: '::/128' } });
    fireEvent.click(screen.getByRole('button', { name: text.range.calculate }));
    expect(screen.getByRole('alert').textContent).toContain(text.range.start);
    expect(screen.getByRole('alert').textContent).toContain(text.range.endpointCidr);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('retains drafts, results and errors across navigation without recalculating', async () => {
    const calculation = vi.spyOn(core, 'rangeToCidrs');
    render(<App />);
    enter(' 2001:DB8::B ', '2001:db8::17');
    const result = output();
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    fireEvent.click(screen.getByRole('link', { name: 'IP Range to CIDRs' }));
    expect(output()).toBe(result);
    expect((screen.getByLabelText('Start IP') as HTMLInputElement).value).toBe(' 2001:DB8::B ');
    enter('bad', '2001:db8::17');
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    fireEvent.click(screen.getByRole('link', { name: 'IP Range to CIDRs' }));
    await chooseLanguage(locales['zh-Hans'].name);
    expect(screen.getByRole('alert').textContent).toContain(resources['zh-Hans'].translation.range.invalidEndpoint);
    expect((screen.getByLabelText('起始 IP') as HTMLInputElement).value).toBe('bad');
    expect(calculation).toHaveBeenCalledTimes(2);
  });
  it('starts a new page session with empty endpoints', () => {
    const first = render(<App />);
    enter('203.0.113.11', '203.0.113.23');
    first.unmount();
    render(<App />);
    expect((screen.getByLabelText('Start IP') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('End IP') as HTMLInputElement).value).toBe('');
    expect(screen.queryByLabelText('Exact CIDR list')).toBeNull();
  });
});
