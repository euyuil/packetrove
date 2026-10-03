import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as core from '@packetrove/core';
import { App } from './App';
import { render } from './test-utils';
import { locales } from './i18n/locales';

const longList = '203.0.113.1, bad\n\n203.0.113.2\t\n bad，203.0.113.3  203.0.113.4\n'
  + Array.from({ length: 40 }, (_, index) => `198.51.100.${index + 1}`).join('\n');
const fields = [
  { name: 'covering input', path: '/cidr-cover', inputId: 'addresses', calculation: 'Calculate covering CIDR', prefix: 'Line' },
  { name: 'include input', path: '/cidr-subtract', inputId: 'subtract-include', calculation: 'Subtract CIDRs', prefix: 'Include, line' },
  { name: 'exclude input', path: '/cidr-subtract', inputId: 'subtract-exclude', calculation: 'Subtract CIDRs', prefix: 'Exclude, line' },
] as const;

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

function input(id: string) {
  return document.getElementById(id) as HTMLTextAreaElement;
}

function open(field: typeof fields[number], text: string) {
  window.history.replaceState({}, '', field.path);
  render(<App />);
  if (field.inputId === 'subtract-exclude') {
    fireEvent.change(input('subtract-include'), { target: { value: '203.0.113.0/24' } });
  }
  const target = input(field.inputId);
  fireEvent.change(target, { target: { value: text } });
  target.setSelectionRange(target.value.length, target.value.length);
  fireEvent.click(screen.getByRole('button', { name: field.calculation }));
  return target;
}

describe('located CIDR error links', () => {
  it.each(fields)('selects each repeated invalid item in the $name without changing drafts or URLs', async field => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const target = open(field, longList);
    expect(target.value).toHaveLength(611);
    const drafts = Array.from(screen.getAllByRole('textbox'), element => (element as HTMLTextAreaElement).value);
    const links = within(screen.getByRole('alert')).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]?.textContent).toMatch(new RegExp(`^${field.prefix} 1, item 2:`));
    expect(links[1]?.textContent).toMatch(new RegExp(`^${field.prefix} 4, item 1:`));
    expect(document.activeElement).toBe(screen.getByRole('alert'));

    for (const [index, start, end] of [[0, 13, 16], [1, 32, 35]] as const) {
      await user.click(links[index]!);
      expect(document.activeElement).toBe(target);
      expect([target.selectionStart, target.selectionEnd]).toEqual([start, end]);
      expect(target.value.slice(start, end)).toBe('bad');
    }
    // Native link activation by Enter must use the same focus and selection path.
    links[0]!.focus();
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(target);
    expect([target.selectionStart, target.selectionEnd]).toEqual([13, 16]);
    expect(Array.from(screen.getAllByRole('textbox'), element => (element as HTMLTextAreaElement).value)).toEqual(drafts);
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(field.path);
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
  });

  it.each(fields)('selects UTF-16 invalid IPv6 tokens amid empty and mixed separators in the $name', async field => {
    const user = userEvent.setup();
    const text = ',， \t\n2001:db8::1，\t😀bad \u00a0\u3000::/129,\n\n';
    const target = open(field, text);
    const links = within(screen.getByRole('alert')).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]?.textContent).toMatch(new RegExp(`^${field.prefix} 2, item 2:`));
    expect(links[1]?.textContent).toMatch(new RegExp(`^${field.prefix} 2, item 3:`));
    for (const [index, start, end, token] of [[0, 18, 23, '😀bad'], [1, 26, 32, '::/129']] as const) {
      await user.click(links[index]!);
      expect(document.activeElement).toBe(target);
      expect([target.selectionStart, target.selectionEnd]).toEqual([start, end]);
      expect(target.value.slice(start, end)).toBe(token);
    }
    expect(target.value).toBe(text);
  });

  it.each(fields)('uses the normalized textarea value for pasted CRLF positions in the $name', async field => {
    const user = userEvent.setup();
    const target = open(field, '203.0.113.1\r\n\r\n bad');
    expect(target.value).toBe('203.0.113.1\n\n bad');
    const link = within(screen.getByRole('alert')).getByRole('link');
    expect(link.textContent).toMatch(new RegExp(`^${field.prefix} 3:`));
    await user.click(link);
    expect(document.activeElement).toBe(target);
    expect([target.selectionStart, target.selectionEnd]).toEqual([14, 17]);
    expect(target.value.slice(target.selectionStart, target.selectionEnd)).toBe('bad');
  });

  it('only focuses the covering input for an overall entry limit error', async () => {
    const user = userEvent.setup();
    const text = new Array(1001).fill('203.0.113.1').join(', ');
    const target = open(fields[0], text);
    const select = vi.spyOn(target, 'setSelectionRange');
    await user.click(within(screen.getByRole('alert')).getByRole('link'));
    expect(document.activeElement).toBe(target);
    expect(select).not.toHaveBeenCalled();
    expect([target.selectionStart, target.selectionEnd]).toEqual([text.length, text.length]);
  });

  it('only focuses the empty include list and leaves combined-limit errors in the summary', async () => {
    const user = userEvent.setup();
    const target = open(fields[1], ',， \t\n');
    const select = vi.spyOn(target, 'setSelectionRange');
    await user.click(within(screen.getByRole('alert')).getByRole('link'));
    expect(document.activeElement).toBe(target);
    expect(select).not.toHaveBeenCalled();
    fireEvent.change(target, { target: { value: new Array(500).fill('203.0.113.1').join(', ') } });
    fireEvent.change(input('subtract-exclude'), { target: { value: new Array(501).fill('203.0.113.1').join('\t') } });
    fireEvent.click(screen.getByRole('button', { name: fields[1].calculation }));
    expect(screen.getByRole('alert').textContent).toContain('Use at most 1000 entries across both lists.');
    expect(within(screen.getByRole('alert')).queryByRole('link')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('alert'));
    expect(select).not.toHaveBeenCalled();
  });

  it.each(fields)('clears old error locations when editing or clearing the $name', async field => {
    const user = userEvent.setup();
    const target = open(field, longList);
    await user.click(within(screen.getByRole('alert')).getAllByRole('link')[1]!);
    await user.keyboard('203.0.113.5');
    expect(target.value).toBe(longList.slice(0, 32) + '203.0.113.5' + longList.slice(35));
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: field.calculation }));
    expect(within(screen.getByRole('alert')).getAllByRole('link')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(target.value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each(fields)('retains correct error locations through language changes and navigation for the $name', async field => {
    const user = userEvent.setup();
    const cover = vi.spyOn(core, 'smallestCoveringCidr');
    const subtract = vi.spyOn(core, 'subtractCidrs');
    open(field, longList);
    fireEvent.click(screen.getByRole('button', { name: /^Language:/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: locales['zh-Hans'].name }));
    await waitFor(() => { expect(screen.queryByRole('menu')).toBeNull(); });
    fireEvent.click(screen.getByRole('link', { name: '首页' }));
    fireEvent.click(screen.getByRole('link', { name: field.path === '/cidr-cover' ? '最小覆盖 CIDR' : 'CIDR 相减' }));
    const target = input(field.inputId);
    expect(target.value).toBe(longList);
    await user.click(within(screen.getByRole('alert')).getAllByRole('link')[1]!);
    expect(document.activeElement).toBe(target);
    expect([target.selectionStart, target.selectionEnd]).toEqual([32, 35]);
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/zh' + field.path);
    expect(cover).toHaveBeenCalledTimes(field.path === '/cidr-cover' ? 1 : 0);
    expect(subtract).toHaveBeenCalledTimes(field.path === '/cidr-subtract' ? 1 : 0);
  });
});
