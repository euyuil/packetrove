import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { type InputIssue } from '@packetrove/contracts';
import { ToolError } from '@packetrove/core';
import { CidrCoverTool } from './CidrCoverTool';
import { CidrSubtractTool } from './CidrSubtractTool';
import { RangeToCidrsTool } from './RangeToCidrsTool';
import { render } from './test-utils';
import { createI18n } from './i18n';
import { issueMessage } from './i18n/errors';
import { rangeIssueMessage } from './range-errors';

afterEach(cleanup);
const message = 'Check this input.';

function renderTool(tool: 'cover' | 'subtract' | 'range', issue: InputIssue) {
  const error = new ToolError('INVALID_INPUT', 'Invalid input.', [issue], [{ reason: 'INVALID_INPUT', list: 'exclude' }]);
  if (tool === 'cover') return render(<CidrCoverTool draft={{ input: '203.0.113.1', result: null, error }} onDraftChange={vi.fn()} />);
  if (tool === 'subtract') return render(<CidrSubtractTool draft={{ include: '203.0.113.0/24', exclude: '', result: null, error }} onDraftChange={vi.fn()} />);
  return render(<RangeToCidrsTool draft={{ start: '', end: '', result: null, error }} onDraftChange={vi.fn()} />);
}

describe('tool-owned input location rendering', () => {
  it.each(['cover', 'subtract', 'range'] as const)('does not invent links or affected fields for unknown %s paths', tool => {
    for (const issue of [{ field: 'hostname', message }, { list: 'records', index: 1, message }, { path: [0], message },
      { path: ['start', 'hostname'], field: 'start', message }]) {
      const view = renderTool(tool, issue);
      expect(within(screen.getByRole('alert')).queryByRole('link')).toBeNull();
      expect(screen.getAllByRole('textbox').every(input => input.getAttribute('aria-invalid') !== 'true')).toBe(true);
      expect(screen.getByRole('alert').textContent).toContain(message);
      view.unmount();
    }
  });
  it('does not fall back to a legacy subtraction detail for an explicit whole-request path', () => {
    renderTool('subtract', { path: [], list: 'exclude', message });
    expect(within(screen.getByRole('alert')).queryByRole('link')).toBeNull();
    expect(screen.getAllByRole('textbox').every(input => input.getAttribute('aria-invalid') === 'true')).toBe(true);
  });
  it.each([
    { tool: 'cover' as const, path: ['inputs', 0], inputId: 'addresses' },
    { tool: 'subtract' as const, path: ['include', 0], inputId: 'subtract-include' },
    { tool: 'range' as const, path: ['start'], inputId: 'range-start' },
  ])('links a recognized $tool path to its actual input', ({ tool, path, inputId }) => {
    renderTool(tool, { path, field: 'hostname', list: 'records', message });
    expect(within(screen.getByRole('alert')).getByRole('link').getAttribute('href')).toBe('#' + inputId);
    expect(document.getElementById(inputId)?.getAttribute('aria-invalid')).toBe('true');
    fireEvent.click(within(screen.getByRole('alert')).getByRole('link'));
    expect(document.activeElement?.id).toBe(inputId);
    const input = document.getElementById(inputId);
    if (input instanceof HTMLTextAreaElement) {
      expect([input.selectionStart, input.selectionEnd]).toEqual([0, input.value.length]);
    }
    for (const input of screen.getAllByRole('textbox')) {
      if (input.id !== inputId) expect(input.getAttribute('aria-invalid')).not.toBe('true');
    }
  });
  it('localizes range reasons in the range module and safely falls back for unfamiliar or incomplete reasons', () => {
    const t = createI18n('zh-Hans').t;
    expect(rangeIssueMessage({ message }, { reason: 'EMPTY_ENDPOINT' }, t, 'zh-Hans')).toBe(t($ => $.range.emptyEndpoint));
    for (const reason of ['EMPTY_ENDPOINT', 'UNSUPPORTED_HOSTNAME', 'TOO_MANY_INPUTS', 'EXPECTED_FAMILY']) {
      expect(issueMessage({ message }, { reason }, t, 'zh-Hans')).toBe(t($ => $.errors.invalidInput));
    }
    expect(issueMessage({ message }, { reason: 'UNSUPPORTED_HOSTNAME' }, t, 'en')).toBe(message);
  });
});
