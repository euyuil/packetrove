import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { I18nextProvider } from 'react-i18next';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act } from 'react';
import { App } from './App';
import { featuredTools } from './ToolGallery';
import { render } from './test-utils';
import { createI18n } from './i18n';
import { resources } from './i18n/resources';
import { supportedLocales } from './i18n/locales';
import { localizedPath } from './i18n/routes';
import { theme } from './theme';

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

function galleryGeometry() {
  const viewport = document.getElementById('tool-gallery-viewport')!;
  const cards = Array.from(viewport.querySelectorAll<HTMLElement>('[data-tool-id]'));
  cards.forEach((card, index) => Object.defineProperty(card, 'offsetLeft', { value: index * 600 }));
  const scroll = vi.fn((options: ScrollToOptions) => {
    viewport.scrollLeft = options.left!;
    fireEvent.scroll(viewport);
  });
  Object.defineProperty(viewport, 'scrollTo', { value: scroll });
  return { viewport, scroll };
}

describe('homepage tool gallery', () => {
  it.each(supportedLocales)('renders shared example previews and localized links without queries: %s', locale => {
    window.history.replaceState({}, '', localizedPath('/', locale));
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    const text = resources[locale].translation;
    const gallery = screen.getByRole('region', { name: text.home.galleryTitle });
    const cards = within(gallery).getAllByRole('article');
    expect(cards.map(card => card.getAttribute('data-tool-id'))).toEqual(featuredTools.map(tool => tool.id));
    for (const [index, tool] of featuredTools.entries()) {
      const card = cards[index]!;
      expect(within(card).getByRole('link').getAttribute('href')).toBe(localizedPath(tool.webPath, locale));
      expect(within(card).getByText(text.home.previewLabel)).toBeDefined();
      const preview = card.querySelector('[data-tool-preview]')!;
      if (tool.page === 'cidr') {
        expect(preview.textContent).toContain(tool.example.request.inputs.join('\n'));
        expect(preview.textContent).toContain(tool.example.result.cidr);
      } else if (tool.page === 'subtract') {
        expect(preview.textContent).toContain(tool.example.request.include.join(', '));
        expect(preview.textContent).toContain(tool.example.request.exclude.join(', '));
        expect(preview.textContent).toContain(tool.example.result.cidrs.join('\n'));
      } else {
        expect(preview.textContent).toContain(tool.example.result.ip);
        expect(preview.textContent).toContain(text.home.ipPreview);
      }
    }
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
  });

  it('keeps bounded buttons, keyboard navigation, and native scrolling in sync', () => {
    render(<App />);
    const { viewport, scroll } = galleryGeometry();
    const previous = screen.getByRole('button', { name: 'Previous tool' }) as HTMLButtonElement;
    const next = screen.getByRole('button', { name: 'Next tool' }) as HTMLButtonElement;
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    next.focus();
    fireEvent.click(next);
    expect(scroll).toHaveBeenLastCalledWith({ left: 600, behavior: 'auto' });
    expect(document.activeElement).toBe(next);
    expect(screen.getByRole('status').textContent).toContain('2 of 3');
    expect(screen.getByRole('status').textContent).toContain(resources.en.translation.subtract.title);
    viewport.focus();
    fireEvent.keyDown(viewport, { key: 'End' });
    expect(scroll).toHaveBeenLastCalledWith({ left: 1200, behavior: 'auto' });
    expect(next.disabled).toBe(true);
    fireEvent.keyDown(viewport, { key: 'ArrowLeft' });
    expect(screen.getByRole('status').textContent).toContain('2 of 3');
    fireEvent.keyDown(viewport, { key: 'Home' });
    expect(previous.disabled).toBe(true);
    fireEvent.keyDown(viewport, { key: 'ArrowRight' });
    expect(screen.getByRole('status').textContent).toContain('2 of 3');
    viewport.scrollLeft = 1180;
    fireEvent.scroll(viewport);
    expect(screen.getByRole('status').textContent).toContain('3 of 3');
    fireEvent.click(previous);
    expect(screen.getByRole('status').textContent).toContain('2 of 3');
    expect(document.activeElement).toBe(viewport);
  });

  it('hydrates a stable initial preview without random order or tool calls', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const view = () => <I18nextProvider i18n={createI18n('en')}>
      <MantineProvider theme={theme} forceColorScheme="light" env="test"><App initialPathname="/" /></MantineProvider>
    </I18nextProvider>;
    const host = document.createElement('div');
    document.body.append(host);
    host.innerHTML = renderToString(view());
    const recover = vi.fn();
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(host, view(), { onRecoverableError: recover }); });
    expect(host.querySelector('[data-tool-id]')?.getAttribute('data-tool-id')).toBe(featuredTools[0]!.id);
    expect(host.querySelector('[role="status"]')?.textContent).toContain('1 of 3');
    expect(recover).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    await act(async () => { root!.unmount(); });
    host.remove();
  });
});
