import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as core from '@packetrove/core';
import { App } from './App';
import { render } from './test-utils';
import { locales, supportedLocales, type Locale } from './i18n/locales';
import { resources } from './i18n/resources';

beforeEach(() => { window.history.replaceState({}, '', '/cidr-subtract'); });
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
  document.documentElement.lang = 'en';
});

function calculate(include: string, exclude = '', locale: Locale = 'en') {
  const text = resources[locale].translation.subtract;
  fireEvent.change(screen.getByLabelText(text.includeLabel), { target: { value: include } });
  fireEvent.change(screen.getByLabelText(text.excludeLabel), { target: { value: exclude } });
  fireEvent.click(screen.getByRole('button', { name: text.calculate }));
}

function label(list: 'include' | 'exclude', count: number, locale: Locale = 'en') {
  const text = resources[locale].translation.subtract;
  return (list === 'include' ? text.normalizedInclude : text.normalizedExclude)
    .replace('{{total}}', new Intl.NumberFormat(locale).format(count));
}

async function expand(name: string) {
  const user = userEvent.setup();
  const control = screen.getByRole('button', { name });
  await user.click(control);
  return screen.findByRole('region', { name });
}

function values(panel: HTMLElement) {
  return within(panel).getAllByRole('listitem').map(item => item.textContent);
}

describe('normalized calculation inputs', () => {
  it('reveals canonical host-bit inputs on demand without changing the result or sending requests', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    expect(screen.queryByRole('button', { name: /Normalized (include|exclude) inputs/ })).toBeNull();
    calculate('198.51.100.143/25', '198.51.100.159/28');
    const include = screen.getByRole('button', { name: label('include', 1) });
    const exclude = screen.getByRole('button', { name: label('exclude', 1) });
    expect(include.getAttribute('aria-expanded')).toBe('false');
    expect(exclude.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('region', { name: label('include', 1) })).toBeNull();
    include.focus();
    await user.keyboard('{Enter}');
    expect(values(await screen.findByRole('region', { name: label('include', 1) }))).toEqual(['198.51.100.128/25']);
    expect(document.activeElement).toBe(include);
    const excluded = await expand(label('exclude', 1));
    expect(values(excluded)).toEqual(['198.51.100.144/28']);
    expect(include.getAttribute('aria-expanded')).toBe('true');
    expect(excluded.closest('[role="status"], [aria-live]')).toBeNull();
    expect((screen.getByLabelText('Remaining CIDRs') as HTMLTextAreaElement).value)
      .toBe('198.51.100.128/28\n198.51.100.160/27\n198.51.100.192/26');
    for (const [name, count] of [['Included addresses', '128'], ['Addresses removed', '16'], ['Remaining addresses', '112']]) {
      expect(screen.getByText(name!).nextElementSibling?.textContent).toBe(count);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves order, duplicates and nested ranges independently of union address counts', async () => {
    render(<App />);
    calculate('198.51.100.159/28, 198.51.100.143/25, 198.51.100.128/25',
      '198.51.100.149, 198.51.100.159/28, 198.51.100.144/28');
    expect(values(await expand(label('include', 3))))
      .toEqual(['198.51.100.144/28', '198.51.100.128/25', '198.51.100.128/25']);
    expect(values(await expand(label('exclude', 3))))
      .toEqual(['198.51.100.149/32', '198.51.100.144/28', '198.51.100.144/28']);
    expect(screen.getByText('Included addresses').nextElementSibling?.textContent).toBe('128');
    expect(screen.getByText('Addresses removed').nextElementSibling?.textContent).toBe('16');
  });

  it('shows canonical IPv6 entries and retains duplicate and nested input order', async () => {
    render(<App />);
    calculate('2001:DB8::F/124, 2001:db8::7/125, 2001:DB8::F/124', '2001:db8::6, 2001:db8::7/126, 2001:db8::6');
    expect(values(await expand(label('include', 3)))).toEqual(['2001:db8::/124', '2001:db8::/125', '2001:db8::/124']);
    expect(values(await expand(label('exclude', 3)))).toEqual(['2001:db8::6/128', '2001:db8::4/126', '2001:db8::6/128']);
    expect(screen.getByText('Remaining addresses').nextElementSibling?.textContent).toBe('12');
  });

  it.each(supportedLocales)('localizes entry counts, explanation and the empty exclusion in %s', async locale => {
    window.history.replaceState({}, '', locales[locale].prefix + '/cidr-subtract');
    render(<App />);
    calculate('2001:DB8::F/124', ',， \t\n', locale);
    const text = resources[locale].translation.subtract;
    expect(screen.getByText(text.normalizedHelp)).toBeDefined();
    expect(values(await expand(label('include', 1, locale)))).toEqual(['2001:db8::/124']);
    const excluded = await expand(label('exclude', 0, locale));
    expect(within(excluded).getByText(text.noExcludedInputs)).toBeDefined();
    expect(within(excluded).queryByRole('list')).toBeNull();
  });

  it('keeps both input disclosures available after complete removal', async () => {
    render(<App />);
    calculate('198.51.100.143/25', '198.51.100.159/24');
    expect(screen.getByText('No addresses remain')).toBeDefined();
    expect(values(await expand(label('include', 1)))).toEqual(['198.51.100.128/25']);
    expect(values(await expand(label('exclude', 1)))).toEqual(['198.51.100.0/24']);
    for (const name of ['Copy with newlines', 'Copy with commas']) {
      expect((screen.getByRole('button', { name }) as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it.each(['includeLabel', 'excludeLabel'] as const)('removes the old disclosures when editing %s', async key => {
    render(<App />);
    calculate('198.51.100.143/25', '198.51.100.159/28');
    await expand(label('include', 1));
    fireEvent.change(screen.getByLabelText(resources.en.translation.subtract[key]), { target: { value: '198.51.100.1' } });
    expect(screen.queryByRole('button', { name: /Normalized (include|exclude) inputs/ })).toBeNull();
  });

  it('removes previous disclosures on Clear and when a repeated calculation fails', async () => {
    render(<App />);
    calculate('198.51.100.143/25', '198.51.100.159/28');
    await expand(label('include', 1));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByRole('button', { name: /Normalized (include|exclude) inputs/ })).toBeNull();
    calculate('198.51.100.143/25', '198.51.100.159/28');
    vi.spyOn(core, 'subtractCidrs').mockImplementationOnce(() => { throw new core.ToolError('INVALID_INPUT', 'Invalid inputs.'); });
    fireEvent.click(screen.getByRole('button', { name: 'Subtract CIDRs' }));
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Normalized (include|exclude) inputs/ })).toBeNull();
  });

  it('retranslates retained lists and restores them after navigation without recalculating', async () => {
    const calculation = vi.spyOn(core, 'subtractCidrs');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    calculate('198.51.100.143/25', '198.51.100.159/28');
    await expand(label('include', 1));
    fireEvent.click(screen.getByRole('button', { name: 'Language: English' }));
    fireEvent.click(screen.getByRole('menuitem', { name: locales['zh-Hans'].name }));
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(values(screen.getByRole('region', { name: label('include', 1, 'zh-Hans') }))).toEqual(['198.51.100.128/25']);
    expect(values(await expand(label('exclude', 1, 'zh-Hans')))).toEqual(['198.51.100.144/28']);
    fireEvent.click(screen.getByRole('link', { name: resources['zh-Hans'].translation.common.home }));
    fireEvent.click(screen.getByRole('link', { name: resources['zh-Hans'].translation.subtract.title }));
    expect(screen.getByRole('button', { name: label('include', 1, 'zh-Hans') }).getAttribute('aria-expanded')).toBe('false');
    expect(values(await expand(label('include', 1, 'zh-Hans')))).toEqual(['198.51.100.128/25']);
    expect(calculation).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves covering-calculator normalization, disclosure and coverage with the shared display', async () => {
    window.history.replaceState({}, '', '/cidr-cover');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), {
      target: { value: '2001:DB8::F/124, 2001:db8::7/125, 2001:DB8::F/124' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
    const control = screen.getByRole('button', { name: 'Normalized inputs (3)' });
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('Exact coverage: this CIDR adds no addresses.')).toBeDefined();
    expect(values(await expand('Normalized inputs (3)'))).toEqual(['2001:db8::/124', '2001:db8::/125', '2001:db8::/124']);
    expect(screen.getByText('Unique input addresses').nextElementSibling?.textContent).toBe('16');
    expect(screen.queryByText('No excluded inputs.')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
