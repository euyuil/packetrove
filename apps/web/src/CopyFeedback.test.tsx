import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { CidrCoverTool } from './CidrCoverTool';
import { PublicIpTool } from './PublicIpTool';
import { render } from './test-utils';

let originalClipboard: PropertyDescriptor | undefined;
beforeEach(() => { originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard'); });
afterEach(() => {
  cleanup();
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
  else Reflect.deleteProperty(navigator, 'clipboard');
  vi.useRealTimers();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Value>((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}

function clipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
}

async function finishCopy(copy: ReturnType<typeof deferred<void>>, outcome: 'success' | 'failure') {
  await act(async () => {
    if (outcome === 'success') copy.resolve();
    else copy.reject(new Error('Denied'));
  });
}

const tools = [
  { name: 'CIDR calculator', Component: CidrCoverTool, button: 'Copy CIDR',
    first: '203.0.113.1/32', second: '198.51.100.2/32', success: 'CIDR copied.' },
  { name: 'public IP page', Component: PublicIpTool, button: 'Copy IP',
    first: '203.0.113.1', second: '198.51.100.2', success: 'IP address copied.' },
] as const;

async function openTool(tool: typeof tools[number]) {
  const refresh = deferred<Response>();
  if (tool.Component === PublicIpTool) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ ip: tool.first, family: 'ipv4' }))
      .mockReturnValueOnce(refresh.promise));
  }
  const { Component } = tool;
  const view = render(<Component />);
  if (Component === CidrCoverTool) {
    fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value: '203.0.113.1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
  } else await screen.findByText(tool.first);

  function beginResultChange() {
    if (Component === CidrCoverTool) {
      fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value: '198.51.100.2' } });
    } else fireEvent.click(screen.getByRole('button', { name: 'Refresh IP' }));
  }
  async function finishResultChange() {
    if (Component === CidrCoverTool) {
      fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
    } else {
      await act(async () => { refresh.resolve(Response.json({ ip: tool.second, family: 'ipv4' })); });
    }
    const result = screen.getByRole('region', {
      name: Component === CidrCoverTool ? 'Coverage result' : 'Your current connection',
    });
    expect(within(result).getAllByText(tool.second, { selector: 'code' }).length).toBeGreaterThan(0);
  }
  return { view, beginResultChange, finishResultChange };
}

describe.each(tools)('$name copy feedback', tool => {
  it.each([
    { outcome: 'success' as const, stage: 'after the new result appears' },
    { outcome: 'failure' as const, stage: 'after the new result appears' },
    { outcome: 'success' as const, stage: 'while the result is cleared' },
    { outcome: 'failure' as const, stage: 'while the result is cleared' },
  ])('ignores an old copy $outcome $stage and can copy the new result', async ({ outcome, stage }) => {
    const oldCopy = deferred<void>();
    const writeText = vi.fn().mockReturnValueOnce(oldCopy.promise).mockResolvedValue(undefined);
    clipboard(writeText);
    const { beginResultChange, finishResultChange } = await openTool(tool);
    fireEvent.click(screen.getByRole('button', { name: tool.button }));
    expect(writeText).toHaveBeenCalledExactlyOnceWith(tool.first);

    beginResultChange();
    if (stage === 'after the new result appears') await finishResultChange();
    await finishCopy(oldCopy, outcome);
    expect(screen.queryByRole('status')?.textContent ?? '').toBe('');
    if (stage === 'while the result is cleared') await finishResultChange();
    expect(screen.getByRole('status').textContent).toBe('');

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: tool.button })); });
    expect(writeText.mock.calls.map(call => call[0])).toEqual([tool.first, tool.second]);
    expect(screen.getByRole('status').textContent).toBe(tool.success);
  });

  it.each(['success', 'failure'] as const)('does not let an older copy %s replace the latest copy feedback', async outcome => {
    const oldCopy = deferred<void>();
    const latestCopy = deferred<void>();
    clipboard(vi.fn().mockReturnValueOnce(oldCopy.promise).mockReturnValueOnce(latestCopy.promise));
    await openTool(tool);
    fireEvent.click(screen.getByRole('button', { name: tool.button }));
    fireEvent.click(screen.getByRole('button', { name: tool.button }));

    await finishCopy(latestCopy, 'success');
    expect(screen.getByRole('status').textContent).toBe(tool.success);
    await finishCopy(oldCopy, outcome);
    expect(screen.getByRole('status').textContent).toBe(tool.success);
  });

  it('keeps feedback empty while the latest copy is pending and reports its failure', async () => {
    const oldCopy = deferred<void>();
    const latestCopy = deferred<void>();
    clipboard(vi.fn().mockReturnValueOnce(oldCopy.promise).mockReturnValueOnce(latestCopy.promise));
    await openTool(tool);
    fireEvent.click(screen.getByRole('button', { name: tool.button }));
    await finishCopy(oldCopy, 'success');
    expect(screen.getByRole('status').textContent).toBe(tool.success);

    fireEvent.click(screen.getByRole('button', { name: 'Copied' }));
    expect(screen.getByRole('status').textContent).toBe('');
    await finishCopy(latestCopy, 'failure');
    expect(screen.getByRole('status').textContent).toContain('Select and copy');
  });

  it.each(['success', 'failure'] as const)('handles a pending copy %s after unmount without affecting a new page', async outcome => {
    const oldCopy = deferred<void>();
    clipboard(vi.fn().mockReturnValueOnce(oldCopy.promise).mockResolvedValue(undefined));
    const { view } = await openTool(tool);
    fireEvent.click(screen.getByRole('button', { name: tool.button }));
    view.unmount();
    await openTool(tool);
    await finishCopy(oldCopy, outcome);
    expect(screen.getByRole('status').textContent).toBe('');

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: tool.button })); });
    expect(screen.getByRole('status').textContent).toBe(tool.success);
  });

  it('restores the button two seconds after the latest successful copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard(writeText);
    await openTool(tool);
    vi.useFakeTimers();

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: tool.button })); });
    expect(screen.getByRole('button', { name: 'Copied' })).toBeDefined();
    act(() => { vi.advanceTimersByTime(1_500); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Copied' })); });
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByRole('button', { name: 'Copied' })).toBeDefined();
    expect(screen.getByRole('status').textContent).toBe(tool.success);
    act(() => { vi.advanceTimersByTime(1_500); });
    expect(screen.getByRole('button', { name: tool.button })).toBeDefined();
    expect(screen.getByRole('status').textContent).toBe('');
    expect(writeText).toHaveBeenCalledTimes(2);
  });

  it.each(['close button', 'Escape', 'outside click'])('keeps failures visible until dismissed with %s', async method => {
    clipboard(vi.fn().mockRejectedValue(new Error('Denied')));
    await openTool(tool);
    vi.useFakeTimers();

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: tool.button })); });
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(screen.getByRole('dialog').textContent).toContain('Select and copy');
    expect(screen.getByRole('status').textContent).toContain('Select and copy');
    if (method === 'close button') fireEvent.click(screen.getByRole('button', { name: 'Dismiss copy error' }));
    else if (method === 'Escape') fireEvent.keyDown(screen.getByRole('button', { name: tool.button }), { key: 'Escape' });
    else fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('can retry after a failure without clearing the successful feedback', async () => {
    clipboard(vi.fn().mockRejectedValueOnce(new Error('Denied')).mockResolvedValue(undefined));
    await openTool(tool);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: tool.button })); });
    expect(screen.getByRole('dialog')).toBeDefined();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: tool.button })); });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Copied' })).toBeDefined();
    expect(screen.getByRole('status').textContent).toBe(tool.success);
  });
});

it('invalidates a pending CIDR copy when recalculating unchanged input', async () => {
  const oldCopy = deferred<void>();
  clipboard(vi.fn().mockReturnValueOnce(oldCopy.promise));
  await openTool(tools[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Copy CIDR' }));
  fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
  await finishCopy(oldCopy, 'success');
  expect(screen.getByRole('status').textContent).toBe('');
});
