import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tools } from '@packetrove/contracts';
import { App } from './App';
import { render } from './test-utils';
import { resources } from './i18n/resources';
import { supportedLocales } from './i18n/locales';
import { localizedPath, pagePaths } from './i18n/routes';

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('calculation feedback', () => {
  it('focuses the covering error summary and links original lines to the input without changing the URL', async () => {
    window.history.replaceState({}, '', '/cidr-cover');
    render(<App />);
    const input = screen.getByLabelText('IP addresses or CIDR ranges');
    fireEvent.change(input, { target: { value: '\n203.0.113.1, bad\n::/129' } });
    const submit = screen.getByRole('button', { name: 'Calculate covering CIDR' });
    submit.focus();
    await userEvent.setup().keyboard('{Enter}');
    const summary = screen.getByRole('alert');
    expect(document.activeElement).toBe(summary);
    const errors = within(summary).getAllByRole('link');
    expect(errors.map(error => error.getAttribute('href'))).toEqual(['#addresses', '#addresses']);
    expect(errors[0]?.textContent).toContain('Line 2, item 2:');
    expect(errors[1]?.textContent).toContain('Line 3:');
    await userEvent.setup().click(errors[1]!);
    expect(document.activeElement).toBe(input);
    expect(window.location.pathname + window.location.hash).toBe('/cidr-cover');
    fireEvent.change(input, { target: { value: '203.0.113.1' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBe('input-help');
  });

  it('focuses subtraction errors and takes each link to its affected list', async () => {
    window.history.replaceState({}, '', '/cidr-subtract');
    render(<App />);
    fireEvent.change(screen.getByLabelText('Included IP addresses or CIDRs'), { target: { value: 'bad' } });
    fireEvent.change(screen.getByLabelText('Excluded IP addresses or CIDRs'), { target: { value: '\n\nbroken' } });
    fireEvent.click(screen.getByRole('button', { name: 'Subtract CIDRs' }));
    const summary = screen.getByRole('alert');
    expect(document.activeElement).toBe(summary);
    const errors = within(summary).getAllByRole('link');
    expect(errors.map(error => error.getAttribute('href'))).toEqual(['#subtract-include', '#subtract-exclude']);
    for (const error of errors) {
      await userEvent.setup().click(error);
      expect(document.activeElement?.id).toBe(error.getAttribute('href')!.slice(1));
    }
    expect(window.location.hash).toBe('');
  });

  it('announces only a short covering result, including repeated calculations, without moving keyboard focus', async () => {
    window.history.replaceState({}, '', '/cidr-cover');
    render(<App />);
    const completion = screen.getByRole('status', { name: resources.en.translation.cidr.result });
    expect(completion.textContent).toBe('');
    fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value: '203.0.113.1, 203.0.113.2' } });
    const submit = screen.getByRole('button', { name: 'Calculate covering CIDR' });
    submit.focus();
    const user = userEvent.setup();
    await user.keyboard('{Enter}');
    expect(completion.textContent).toBe(resources.en.translation.cidr.resultLabel + ': 203.0.113.0/30');
    expect(document.activeElement).toBe(submit);
    const previousContent = completion.firstElementChild;
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status', { name: resources.en.translation.cidr.result })).toBe(completion);
    expect(completion.firstElementChild).not.toBe(previousContent);
    expect(screen.getByRole('button', { name: 'Copy CIDR' }).closest('[aria-live]')).toBeNull();
    expect(screen.getByText('Applying this CIDR expands the range of addresses allowed or blocked by your list.')
      .closest('[aria-live]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(completion.textContent).toBe('');
  });

  it('reveals an off-screen result on submission while preserving focus, and does not scroll on editing', () => {
    window.history.replaceState({}, '', '/cidr-subtract');
    render(<App />);
    const panel = screen.getByRole('region', { name: resources.en.translation.subtract.result });
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 900, 400, 400));
    const scroll = vi.fn();
    panel.scrollIntoView = scroll;
    const include = screen.getByLabelText('Included IP addresses or CIDRs');
    fireEvent.change(include, { target: { value: '203.0.113.0/24' } });
    const submit = screen.getByRole('button', { name: 'Subtract CIDRs' });
    submit.focus();
    fireEvent.click(submit);
    expect(scroll).toHaveBeenCalledExactlyOnceWith({ block: 'start' });
    expect(document.activeElement).toBe(submit);
    fireEvent.change(include, { target: { value: '203.0.113.0/25' } });
    expect(scroll).toHaveBeenCalledTimes(1);
  });
});

describe('compact navigation', () => {
  it.each(supportedLocales)('provides complete catalog links and retains drafts when switching tools in %s', async locale => {
    window.history.replaceState({}, '', localizedPath('/cidr-cover', locale));
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const text = resources[locale].translation;
    render(<App />);
    fireEvent.change(screen.getByLabelText(text.cidr.inputLabel), { target: { value: '203.0.113.' } });
    const trigger = screen.getByRole('button', { name: text.common.navigation + ': ' + text.cidr.title });
    const user = userEvent.setup();
    await user.click(trigger);
    const menu = screen.getByRole('menu');
    for (const tool of tools) {
      const item = within(menu).getByRole('menuitem', { name: text[tool.page].title });
      expect(item.getAttribute('href')).toBe(localizedPath(tool.webPath, locale));
      expect(item.getAttribute('aria-current')).toBe(tool.page === 'cidr' ? 'page' : null);
    }
    await user.click(within(menu).getByRole('menuitem', { name: text.subtract.title }));
    await waitFor(() => { expect(screen.queryByRole('menu')).toBeNull(); });
    expect(window.location.pathname).toBe(localizedPath(pagePaths.subtract, locale));
    expect(document.activeElement).toBe(screen.getByRole('main', { name: text.subtract.title }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(text.subtract.includeLabel));
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: text.cidr.title }));
    await waitFor(() => { expect(screen.queryByRole('menu')).toBeNull(); });
    expect((screen.getByLabelText(text.cidr.inputLabel) as HTMLTextAreaElement).value).toBe('203.0.113.');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns focus after Escape and reselecting the active page', async () => {
    window.history.replaceState({}, '', '/cidr-cover');
    render(<App />);
    const trigger = screen.getByRole('button', { name: resources.en.translation.common.navigation + ': ' + resources.en.translation.cidr.title });
    const user = userEvent.setup();
    trigger.focus();
    await user.keyboard('{Enter}{ArrowDown}{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('menuitem', { name: 'Smallest Covering CIDR' }));
    expect(document.activeElement).toBe(trigger);
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])(
    'preserves native compact-menu navigation for %j without dropping focus or drafts', async modifiers => {
      window.history.replaceState({}, '', '/cidr-cover');
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      render(<App />);
      const input = screen.getByLabelText('IP addresses or CIDR ranges');
      fireEvent.change(input, { target: { value: '203.0.113.' } });
      const trigger = screen.getByRole('button', { name: resources.en.translation.common.navigation + ': ' + resources.en.translation.cidr.title });
      await userEvent.setup().click(trigger);
      document.addEventListener('click', event => {
        expect(event.defaultPrevented).toBe(false);
        event.preventDefault();
      }, { once: true });
      fireEvent.click(screen.getByRole('menuitem', { name: 'My Public IP' }), modifiers);
      expect(window.location.pathname).toBe('/cidr-cover');
      expect((input as HTMLTextAreaElement).value).toBe('203.0.113.');
      expect(document.activeElement).toBe(trigger);
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});

describe('public IP refresh controls', () => {
  it('keeps focus during refresh, suppresses duplicate requests, and copies a wrapped IPv6 address exactly', async () => {
    window.history.replaceState({}, '', '/public-ip');
    let complete!: (response: Response) => void;
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ ip: '203.0.113.1', family: 'ipv4' }))
      .mockImplementationOnce(() => new Promise<Response>(resolve => { complete = resolve; }));
    vi.stubGlobal('fetch', fetch);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('203.0.113.1');
    const refresh = screen.getByRole('button', { name: 'Refresh IP' });
    refresh.focus();
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(refresh);
    expect(refresh.getAttribute('aria-disabled')).toBe('true');
    expect((refresh as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: 'Copy IP' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText('203.0.113.1')).toBeNull();
    await user.keyboard('{Enter} ');
    fireEvent.click(refresh);
    expect(fetch).toHaveBeenCalledTimes(2);
    const ip = '2001:db8:1234:5678:9abc:def0:1234:5678';
    await act(async () => { complete(Response.json({ ip, family: 'ipv6' })); });
    expect(await screen.findByText(ip)).toBeDefined();
    expect(document.activeElement).toBe(refresh);
    expect(refresh.getAttribute('aria-disabled')).toBe('false');
    const copy = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(screen.getByRole('button', { name: 'Copy IP' }));
    expect(copy).toHaveBeenCalledExactlyOnceWith(ip);
  });
});
