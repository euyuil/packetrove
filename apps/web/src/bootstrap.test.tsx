import { afterEach, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { startApplication } from './bootstrap';
import * as pages from './page-resources';
import { renderPage } from './prerender';
import { deferred } from './test-utils';

let stop: (() => void) | undefined;
afterEach(() => {
  act(() => { stop?.(); });
  stop = undefined;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

it('retains prerendered content on an initial load failure and retries hydration once', async () => {
  window.history.replaceState(null, '', '/zh/cidr-cover');
  const root = document.createElement('div');
  root.dataset.prerenderedPath = '/zh/cidr-cover';
  root.dataset.loadFailure = '页面加载失败，请重试。';
  root.dataset.loadRetry = '重试';
  root.innerHTML = await renderPage('/zh/cidr-cover');
  document.body.append(root);
  const heading = root.querySelector('h1');
  const pending = deferred<void>();
  const load = vi.spyOn(pages, 'prepareRoute').mockRejectedValueOnce(new Error('Module diagnostic')).mockReturnValueOnce(pending.promise);
  await act(async () => { stop = startApplication(root); });
  expect(screen.getByRole('alert').textContent).toContain('页面加载失败，请重试。');
  expect(screen.getByRole('alert').textContent).not.toContain('Module diagnostic');
  expect(root.querySelector('h1')).toBe(heading);
  fireEvent.click(screen.getByRole('button', { name: '重试' }));
  fireEvent.click(screen.getByRole('button', { name: '重试' }));
  expect(load).toHaveBeenCalledTimes(2);
  await act(async () => { pending.resolve(); });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(root.querySelector('h1')).toBe(heading);
  expect(screen.getByLabelText('IP 地址或 CIDR 网段')).toBeDefined();
});

it('leaves a bootstrap failure retry usable when another attempt fails', async () => {
  window.history.replaceState(null, '', '/cidr-cover');
  const root = document.createElement('div');
  document.body.append(root);
  const load = vi.spyOn(pages, 'prepareRoute').mockRejectedValue(new Error('Unavailable'));
  await act(async () => { stop = startApplication(root); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retry' })); });
  expect(screen.getByRole('button', { name: 'Retry' }).hasAttribute('disabled')).toBe(false);
  expect(load).toHaveBeenCalledTimes(2);
});
