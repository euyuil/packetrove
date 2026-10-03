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

const position = () => document.getElementById('tool-gallery-status')!.textContent;
const expectedPosition = (current: number) => `${current} of ${featuredTools.length}`;

describe('homepage tool gallery', () => {
  it.each(supportedLocales)('renders shared example previews and localized links without queries: %s', locale => {
    window.history.replaceState({}, '', localizedPath('/', locale));
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    const text = resources[locale].translation;
    const gallery = screen.getByRole('region', { name: text.home.galleryTitle });
    const cards = Array.from(gallery.querySelectorAll<HTMLElement>('article'));
    expect(cards.map(card => card.getAttribute('data-tool-id'))).toEqual(featuredTools.map(tool => tool.id));
    const buttons = within(gallery).getAllByRole('button');
    expect(buttons.map(button => button.getAttribute('aria-label'))).toEqual([text.home.galleryPrevious, text.home.galleryNext]);
    const indicators = within(within(gallery).getByRole('tablist', { name: text.home.galleryTitle })).getAllByRole('tab');
    expect(indicators).toHaveLength(featuredTools.length);
    for (const [index, tool] of featuredTools.entries()) {
      const card = cards[index]!;
      expect(within(card).getByRole('link', { hidden: true }).getAttribute('href')).toBe(localizedPath(tool.webPath, locale));
      if (index > 0) fireEvent.click(within(gallery).getByRole('button', { name: text.home.galleryNext }));
      expect(within(gallery).getByRole('article')).toBe(card);
      expect(position()).toContain(text[tool.page].title);
      expect(indicators[index]!.getAttribute('aria-label')).toContain(text[tool.page].title);
      expect(indicators.map(indicator => indicator.getAttribute('aria-selected')))
        .toEqual(featuredTools.map((_, selected) => String(selected === index)));
      expect(within(card).getByText(text.home.previewLabel)).toBeDefined();
      const preview = card.querySelector('[data-tool-preview]')!;
      if (tool.page === 'cidr') {
        expect(preview.textContent).toContain(tool.example.request.inputs.join('\n'));
        expect(preview.textContent).toContain(tool.example.result.cidr);
      } else if (tool.page === 'subtract') {
        expect(preview.textContent).toContain(tool.example.request.include.join(', '));
        expect(preview.textContent).toContain(tool.example.request.exclude.join(', '));
        expect(preview.textContent).toContain(tool.example.result.cidrs.join('\n'));
      } else if (tool.page === 'range') {
        expect(preview.textContent).toContain(tool.example.request.start);
        expect(preview.textContent).toContain(tool.example.request.end);
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

  it('selects cards with indicators and keeps keyboard focus and selection in sync', () => {
    render(<App />);
    const indicators = within(screen.getByRole('tablist', { name: 'Explore the tools' })).getAllByRole('tab');
    const lastIndex = featuredTools.length - 1;
    fireEvent.click(indicators[lastIndex]!);
    expect(position()).toContain(expectedPosition(featuredTools.length));
    expect(screen.getByRole('article').getAttribute('data-tool-id')).toBe(featuredTools[lastIndex]!.id);
    expect(indicators[lastIndex]!.getAttribute('aria-selected')).toBe('true');
    indicators[lastIndex]!.focus();
    fireEvent.keyDown(indicators[lastIndex]!, { key: 'ArrowLeft' });
    expect(position()).toContain(expectedPosition(lastIndex));
    expect(document.activeElement).toBe(indicators[lastIndex - 1]);
    expect(indicators[lastIndex - 1]!.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(indicators[lastIndex - 1]!, { key: 'Home' });
    expect(position()).toContain(expectedPosition(1));
    expect(document.activeElement).toBe(indicators[0]);
    fireEvent.keyDown(indicators[0]!, { key: 'End' });
    expect(position()).toContain(expectedPosition(featuredTools.length));
    expect(document.activeElement).toBe(indicators[lastIndex]);
  });

  it('keeps bounded controls and keyboard navigation in sync without moving focus', () => {
    render(<App />);
    const carousel = document.getElementById('tool-gallery-carousel')!;
    const previous = screen.getByRole('button', { name: 'Previous tool' }) as HTMLButtonElement;
    const next = screen.getByRole('button', { name: 'Next tool' }) as HTMLButtonElement;
    expect(previous.getAttribute('aria-disabled')).toBe('true');
    expect(next.getAttribute('aria-disabled')).toBe('false');
    next.focus();
    fireEvent.click(next);
    expect(document.activeElement).toBe(next);
    expect(position()).toContain(expectedPosition(2));
    expect(position()).toContain(resources.en.translation.subtract.title);
    carousel.focus();
    fireEvent.keyDown(carousel, { key: 'End' });
    expect(next.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(next);
    expect(position()).toContain(expectedPosition(featuredTools.length));
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expect(position()).toContain(expectedPosition(featuredTools.length - 1));
    fireEvent.keyDown(carousel, { key: 'Home' });
    expect(previous.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(previous);
    expect(position()).toContain(expectedPosition(1));
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(position()).toContain(expectedPosition(2));
    fireEvent.click(next);
    expect(position()).toContain(expectedPosition(3));
    fireEvent.click(previous);
    expect(position()).toContain(expectedPosition(2));
    expect(document.activeElement).toBe(carousel);
  });

  it('excludes offscreen cards from focus and the accessibility tree', () => {
    render(<App />);
    const gallery = screen.getByRole('region', { name: 'Explore the tools' });
    expect(within(gallery).getAllByRole('article')).toHaveLength(1);
    expect(within(gallery).queryByRole('link', { name: resources.en.translation.home.subtractLink })).toBeNull();
    expect(gallery.querySelectorAll('[inert]')).toHaveLength(featuredTools.length - 1);
    fireEvent.click(within(gallery).getByRole('button', { name: 'Next tool' }));
    expect(within(gallery).getByRole('link', { name: resources.en.translation.home.subtractLink })).toBeDefined();
    expect(within(gallery).queryByRole('link', { name: resources.en.translation.home.cidrLink })).toBeNull();
    expect(gallery.querySelectorAll('[inert]')).toHaveLength(featuredTools.length - 1);
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
    const viewport = host.querySelector<HTMLElement>('.mantine-Carousel-viewport')!;
    expect(viewport.style.overflowX).toBe('auto');
    expect(host.querySelectorAll('[data-tool-id] a[href]')).toHaveLength(featuredTools.length);
    expect(host.querySelectorAll('#tool-gallery-carousel [inert]')).toHaveLength(0);
    const recover = vi.fn();
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(host, view(), { onRecoverableError: recover }); });
    expect(host.querySelector('[data-tool-id]')?.getAttribute('data-tool-id')).toBe(featuredTools[0]!.id);
    expect(host.querySelector('#tool-gallery-status')?.textContent).toContain(expectedPosition(1));
    expect(viewport.style.overflowX).toBe('hidden');
    expect(host.querySelectorAll('#tool-gallery-carousel [inert]')).toHaveLength(featuredTools.length - 1);
    expect(recover).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    await act(async () => { root!.unmount(); });
    host.remove();
  });
});
