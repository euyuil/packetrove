import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as core from '@packetrove/core';
import { App } from './App';
import { render } from './test-utils';
import { locales, supportedLocales, type Locale } from './i18n/locales';
import { resources } from './i18n/resources';

beforeEach(() => { window.history.replaceState({}, '', '/cidr/subtract'); });
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
  document.documentElement.lang = 'en';
});

function status(locale: Locale = 'en') {
  return screen.getByRole('status', { name: resources[locale].translation.subtract.result });
}

function enter(include: string, exclude = '', locale: Locale = 'en') {
  const text = resources[locale].translation.subtract;
  fireEvent.change(screen.getByLabelText(text.includeLabel), { target: { value: include } });
  fireEvent.change(screen.getByLabelText(text.excludeLabel), { target: { value: exclude } });
  return screen.getByRole('button', { name: text.calculate });
}

describe('CIDR subtraction completion status', () => {
  it('keeps a short persistent status and keyboard focus through repeated successful calculations', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const completion = status();
    expect(completion.textContent).toBe('');
    expect(completion.getAttribute('aria-live')).toBe('polite');
    expect(completion.getAttribute('aria-atomic')).toBe('true');
    const submit = enter('203.0.113.0/24', '203.0.113.64/26');
    submit.focus();
    await user.keyboard('{Enter}');
    const message = 'Calculation complete. Remaining addresses: 192. CIDRs: 2.';
    expect(status()).toBe(completion);
    expect(completion.textContent).toBe(message);
    expect(document.activeElement).toBe(submit);
    const output = screen.getByLabelText('Remaining CIDRs') as HTMLTextAreaElement;
    expect(output.value).toBe('203.0.113.0/26\n203.0.113.128/25');
    expect(output.closest('[role="status"], [aria-live]')).toBeNull();
    const firstContent = completion.firstElementChild;
    await user.keyboard('{Enter}');
    expect(status()).toBe(completion);
    expect(completion.firstElementChild).not.toBe(firstContent);
    expect(completion.textContent).toBe(message);
    expect(document.activeElement).toBe(submit);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['includeLabel', 'excludeLabel'] as const)('removes the previous summary when editing %s', key => {
    render(<App />);
    fireEvent.click(enter('203.0.113.0/24', '203.0.113.64/26'));
    expect(status().textContent).toContain('Calculation complete.');
    const input = screen.getByLabelText(resources.en.translation.subtract[key]);
    input.focus();
    fireEvent.change(input, { target: { value: '203.0.113.1' } });
    expect(status().textContent).toBe('');
    expect(screen.queryByLabelText('Remaining CIDRs')).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it('removes the previous summary on Clear', () => {
    render(<App />);
    fireEvent.click(enter('203.0.113.0/24', '203.0.113.64/26'));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(status().textContent).toBe('');
    expect(screen.queryByLabelText('Remaining CIDRs')).toBeNull();
    expect((screen.getByLabelText(resources.en.translation.subtract.includeLabel) as HTMLTextAreaElement).value).toBe('');
    expect((screen.getByLabelText(resources.en.translation.subtract.excludeLabel) as HTMLTextAreaElement).value).toBe('');
  });

  it('removes the previous summary when a repeated calculation fails', async () => {
    const user = userEvent.setup();
    render(<App />);
    const submit = enter('203.0.113.0/24', '203.0.113.64/26');
    submit.focus();
    await user.keyboard('{Enter}');
    vi.spyOn(core, 'subtractCidrs').mockImplementationOnce(() => {
      throw new core.ToolError('INVALID_INPUT', 'Unable to calculate the input.');
    });
    await user.keyboard('{Enter}');
    expect(status().textContent).toBe('');
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.queryByLabelText('Remaining CIDRs')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('alert'));
  });

  it('keeps only the existing nonempty status message for complete removal', () => {
    render(<App />);
    fireEvent.click(enter('203.0.113.0/24', '203.0.113.64/26'));
    fireEvent.click(enter('203.0.113.0/24', '203.0.113.0/24'));
    expect(status().textContent).toBe('');
    const messages = screen.getAllByRole('status').filter(element => element.textContent?.trim());
    expect(messages).toHaveLength(1);
    expect(messages[0]?.textContent).toContain('No addresses remain');
    expect(messages[0]?.textContent).not.toContain('Calculation complete.');
    expect(screen.queryByLabelText('Remaining CIDRs')).toBeNull();
  });

  it.each(supportedLocales)('uses a short localized summary and exact IPv6 counts in %s', locale => {
    window.history.replaceState({}, '', locales[locale].prefix + '/cidr/subtract');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    expect(status(locale).textContent).toBe('');
    fireEvent.click(enter('::/0', '::1', locale));
    const formatter = new Intl.NumberFormat(locale);
    const addresses = formatter.format(340282366920938463463374607431768211455n);
    const text = resources[locale].translation.subtract;
    const expected = text.completed.replace('{{addresses}}', addresses).replace('{{cidrs}}', formatter.format(128));
    expect(status(locale).textContent).toBe(expected);
    const output = screen.getByLabelText(text.output) as HTMLTextAreaElement;
    expect(output.value.split('\n')).toHaveLength(128);
    expect(output.closest('[role="status"], [aria-live]')).toBeNull();
    expect(status(locale).textContent).not.toContain('::');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retranslates the saved summary and restores it on return without recalculating', async () => {
    const user = userEvent.setup();
    const calculation = vi.spyOn(core, 'subtractCidrs');
    render(<App />);
    fireEvent.click(enter('203.0.113.0/24', '203.0.113.64/26'));
    const completion = status();
    const language = screen.getByRole('button', { name: 'Language: English' });
    await user.click(language);
    await user.click(screen.getByRole('menuitem', { name: locales['zh-Hans'].name }));
    await waitFor(() => { expect(screen.queryByRole('menu')).toBeNull(); });
    expect(status('zh-Hans')).toBe(completion);
    expect(completion.textContent).toBe('计算完成。剩余地址数：192；CIDR 数：2。');
    expect(document.activeElement).toBe(language);
    await user.click(screen.getByRole('link', { name: '首页' }));
    await user.click(screen.getByRole('link', { name: 'CIDR 相减' }));
    expect(status('zh-Hans').textContent).toBe('计算完成。剩余地址数：192；CIDR 数：2。');
    expect((screen.getByLabelText('包含的 IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('203.0.113.0/24');
    expect((screen.getByLabelText('排除的 IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe('203.0.113.64/26');
    expect(calculation).toHaveBeenCalledTimes(1);
  });
});
