import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { startApplication } from './bootstrap';
import { getPageMetadata } from './i18n/page-metadata';
import { resources } from './i18n/resources';
import { renderPage } from './prerender';
import { render } from './test-utils';

let stop: (() => void) | undefined;
afterEach(() => {
  act(() => { stop?.(); });
  stop = undefined;
  cleanup();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.history.replaceState(null, '', '/');
});

it.each([
  ['dev', 'development', 'DEV'],
  ['staging', 'staging', 'STAGING'],
] as const)('identifies %s before hydration and throughout page and language changes', async (host, name, label) => {
  vi.stubEnv('VITE_WEBSITE_ORIGIN', 'https://' + host + '.packetrove.com');
  window.history.replaceState(null, '', '/cidr-cover');
  const fetch = vi.fn(() => { throw new Error('Unexpected environment lookup'); });
  vi.stubGlobal('fetch', fetch);
  const consoleError = vi.spyOn(console, 'error');
  const root = document.createElement('div');
  root.dataset.prerenderedPath = '/cidr-cover';
  root.innerHTML = await renderPage('/cidr-cover');
  document.body.append(root);
  const description = resources.en.translation.common.environment[name].description;
  const badge = screen.getByRole('note', { name: label + ': ' + description });
  expect(badge.textContent).toBe(label);
  expect(badge.closest('header')).not.toBeNull();
  expect(badge.closest('a')).toBeNull();

  document.title = getPageMetadata('en', 'cidr', '/cidr-cover').title;
  await act(async () => { stop = startApplication(root); });
  expect(screen.getByRole('note', { name: label + ': ' + description })).toBe(badge);
  expect(document.title).toBe('[' + label + '] ' + resources.en.translation.meta.cidr.title);
  const user = userEvent.setup();
  await user.click(screen.getByRole('link', { name: 'Home' }));
  expect(document.title).toBe('[' + label + '] ' + resources.en.translation.meta.home.title);
  expect(screen.getByRole('note')).toBe(badge);

  await user.click(screen.getByRole('button', { name: 'Language: English' }));
  await user.click(await screen.findByRole('menuitem', { name: '中文' }));
  expect(window.location.pathname).toBe('/zh/');
  const chinese = resources['zh-Hans'].translation;
  expect(screen.getByRole('note', { name: label + ': ' + chinese.common.environment[name].description })).toBe(badge);
  expect(badge.textContent).toBe(label);
  expect(document.title).toBe('[' + label + '] ' + chinese.meta.home.title);
  expect(consoleError).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

it.each([
  'https://packetrove.com',
  'http://localhost:5173',
  'https://preview.example.com',
  'https://dev.packetrove.com.example.com',
  'https://api.dev.packetrove.com',
])('keeps %s without an environment badge or title prefix', origin => {
  vi.stubEnv('VITE_WEBSITE_ORIGIN', origin);
  render(<App />);
  expect(screen.queryByRole('note')).toBeNull();
  expect(document.title).toBe(resources.en.translation.meta.home.title);
  expect(screen.getByRole('link', { name: 'Packetrove home' })).toBeDefined();
});
