import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import * as core from '@packetrove/core';
import { MAX_INPUTS } from '@packetrove/contracts';
import { App } from './App';
import { CidrCoverTool } from './CidrCoverTool';
import { CidrSubtractTool } from './CidrSubtractTool';
import { render } from './test-utils';
import { createI18n } from './i18n';
import { locales, supportedLocales } from './i18n/locales';
import { resources } from './i18n/resources';

const mixedLine = ',， \t203.0.113.1,,203.0.113.2/33，\u00a0\u3000203.0.113.3  203.0.113.4/33, ';
const values = ['203.0.113.1', '203.0.113.2/33', '203.0.113.3', '203.0.113.4/33'];
const fetch = vi.fn(() => { throw new Error('Unexpected input upload'); });

beforeEach(() => {
  fetch.mockClear();
  vi.stubGlobal('fetch', fetch);
  window.history.replaceState({}, '', '/cidr');
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

function errors() {
  return within(screen.getByRole('alert')).getAllByRole('listitem').map(item => item.textContent);
}

function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('address error entry locations', () => {
  it.each(supportedLocales)('identifies both covering errors among valid entries in %s', locale => {
    window.history.replaceState({}, '', locales[locale].prefix + '/cidr');
    const calculation = vi.spyOn(core, 'smallestCoveringCidr');
    const text = resources[locale].translation;
    const t = createI18n(locale).t;
    render(<App />);
    change(text.cidr.inputLabel, mixedLine);
    fireEvent.click(screen.getByRole('button', { name: text.cidr.calculate }));
    expect(calculation).toHaveBeenCalledExactlyOnceWith({ inputs: values });
    const error = calculation.mock.results[0]!.value as core.ToolError;
    expect(error).toBeInstanceOf(core.ToolError);
    expect(error.issues?.map(issue => issue.index)).toEqual([1, 3]);
    expect(errors()).toEqual([2, 4].map(entry => t($ => $.cidr.lineEntry, {
      line: '1', entry: new Intl.NumberFormat(locale).format(entry),
      message: locale === 'en' ? error.issues![0]!.message : text.errors.invalidAddress,
    })));
    expect(errors()[0]).not.toBe(errors()[1]);
    expect((screen.getByLabelText(text.cidr.inputLabel) as HTMLTextAreaElement).value).toBe(mixedLine);
  });

  it.each(supportedLocales)('identifies both exclusion errors while retaining the list in %s', locale => {
    window.history.replaceState({}, '', locales[locale].prefix + '/cidr/subtract');
    const calculation = vi.spyOn(core, 'subtractCidrs');
    const text = resources[locale].translation;
    const t = createI18n(locale).t;
    render(<App />);
    change(text.subtract.includeLabel, '203.0.113.0/24');
    change(text.subtract.excludeLabel, mixedLine);
    fireEvent.click(screen.getByRole('button', { name: text.subtract.calculate }));
    expect(calculation).toHaveBeenCalledExactlyOnceWith({ include: ['203.0.113.0/24'], exclude: values });
    const error = calculation.mock.results[0]!.value as core.ToolError;
    expect(error).toBeInstanceOf(core.ToolError);
    expect(error.issues?.map(issue => [issue.list, issue.index])).toEqual([['exclude', 1], ['exclude', 3]]);
    expect(errors()).toEqual([2, 4].map(entry => t($ => $.subtract.lineEntry, {
      list: text.subtract.exclude, line: '1', entry: new Intl.NumberFormat(locale).format(entry),
      message: locale === 'en' ? error.issues![0]!.message : text.errors.invalidAddress,
    })));
    expect((screen.getByLabelText(text.subtract.excludeLabel) as HTMLTextAreaElement).value).toBe(mixedLine);
  });

  it('preserves physical lines across blank lines, CRLF and bare CR, without adding an item to single-entry lines', () => {
    render(<App />);
    change('IP addresses or CIDR ranges', '\r\n' + mixedLine + '\r\r::/129');
    fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
    expect(errors().map(message => message?.split(': ')[0])).toEqual(['Line 2, item 2', 'Line 2, item 4', 'Line 4']);
  });

  it('retains the shared error order across both lists and restarts entry positions on each physical line', () => {
    window.history.replaceState({}, '', '/cidr/subtract');
    const calculation = vi.spyOn(core, 'subtractCidrs');
    render(<App />);
    change('Included IP addresses or CIDRs', '\n\nbad, 203.0.113.1，broken\r\ninvalid');
    change('Excluded IP addresses or CIDRs', '\r' + mixedLine);
    fireEvent.click(screen.getByRole('button', { name: 'Subtract CIDRs' }));
    const error = calculation.mock.results[0]!.value as core.ToolError;
    expect(error.issues?.map(issue => [issue.list, issue.index])).toEqual([
      ['include', 0], ['include', 2], ['include', 3], ['exclude', 1], ['exclude', 3],
    ]);
    expect(errors().map(message => message?.split(': ')[0])).toEqual([
      'Include, line 3, item 1', 'Include, line 3, item 3', 'Include, line 4',
      'Exclude, line 2, item 2', 'Exclude, line 2, item 4',
    ]);
  });

  it('retranslates retained line and entry positions through the real language menu without recalculating', () => {
    const calculation = vi.spyOn(core, 'smallestCoveringCidr');
    render(<App />);
    change('IP addresses or CIDR ranges', mixedLine);
    fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
    fireEvent.click(screen.getByRole('button', { name: 'Language: English' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '中文' }));
    expect(errors().map(message => message?.split('：')[0])).toEqual(['第 1 行第 2 项', '第 1 行第 4 项']);
    expect((screen.getByLabelText('IP 地址或 CIDR 网段') as HTMLTextAreaElement).value).toBe(mixedLine);
    expect(calculation).toHaveBeenCalledTimes(1);
  });

  it.each(['cover', 'subtract'])('does not invent a location for unindexed %s entry-limit errors', tool => {
    window.history.replaceState({}, '', tool === 'cover' ? '/cidr' : '/cidr/subtract');
    render(<App />);
    change(tool === 'cover' ? 'IP addresses or CIDR ranges' : 'Included IP addresses or CIDRs',
      new Array(MAX_INPUTS + 1).fill('203.0.113.1').join(', '));
    fireEvent.click(screen.getByRole('button', { name: tool === 'cover' ? 'Calculate covering CIDR' : 'Subtract CIDRs' }));
    expect(errors()).toHaveLength(1);
    expect(errors()[0]).not.toMatch(/\b(line|item)\b/i);
    expect(screen.getByRole('alert').textContent).toContain('1000');
  });

  it('does not assign the first entry to a generic error or expose unavailable index locations', () => {
    const issue = { message: 'Check this address list.' };
    const error = new core.ToolError('INVALID_INPUT', 'Invalid input.', [issue, { ...issue, index: 99 }]);
    const view = render(<CidrCoverTool draft={{ input: mixedLine, result: null, error }} onDraftChange={vi.fn()} />);
    expect(errors()).toEqual([issue.message, issue.message]);
    view.unmount();
    const listError = new core.ToolError('INVALID_INPUT', 'Invalid input.', [issue], [{ reason: 'INVALID_INPUT', list: 'exclude' }]);
    render(<CidrSubtractTool draft={{ include: '', exclude: mixedLine, result: null, error: listError }} onDraftChange={vi.fn()} />);
    expect(errors()).toEqual(['Exclude: Check this address list.']);
  });

  it.each(['cover', 'subtract'])('clears obsolete %s error locations on edit and Clear while retaining the draft until then', tool => {
    window.history.replaceState({}, '', tool === 'cover' ? '/cidr' : '/cidr/subtract');
    render(<App />);
    const label = tool === 'cover' ? 'IP addresses or CIDR ranges' : 'Included IP addresses or CIDRs';
    const calculate = tool === 'cover' ? 'Calculate covering CIDR' : 'Subtract CIDRs';
    change(label, mixedLine);
    fireEvent.click(screen.getByRole('button', { name: calculate }));
    expect(errors()).toHaveLength(2);
    fireEvent.click(screen.getByRole('link', { name: 'Packetrove home' }));
    fireEvent.click(screen.getByRole('link', { name: tool === 'cover' ? 'Smallest Covering CIDR' : 'CIDR Subtraction' }));
    expect(errors()).toHaveLength(2);
    expect((screen.getByLabelText(label) as HTMLTextAreaElement).value).toBe(mixedLine);
    change(label, '::/0');
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: calculate }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getAllByText('340,282,366,920,938,463,463,374,607,431,768,211,456')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect((screen.getByLabelText(label) as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('340,282,366,920,938,463,463,374,607,431,768,211,456')).toBeNull();
    change(label, mixedLine);
    fireEvent.click(screen.getByRole('button', { name: calculate }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
