import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { I18nextProvider } from 'react-i18next';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act } from 'react';
import { toolCatalog } from '@packetrove/contracts';
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
    expect(cards.length).toBeLessThanOrEqual(3);
    expect(gallery.querySelector(`[data-tool-id="${toolCatalog.ip.id}"]`)).toBeNull();
    expect(within(screen.getByRole('navigation', { name: text.common.navigation }))
      .getByRole('link', { name: text.ip.title }).getAttribute('href'))
      .toBe(localizedPath(toolCatalog.ip.webPath, locale));
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

  it('wraps controls and keyboard navigation while keeping selection and focus in sync', () => {
    render(<App />);
    const carousel = document.getElementById('tool-gallery-carousel')!;
    const previous = screen.getByRole('button', { name: 'Previous tool' }) as HTMLButtonElement;
    const next = screen.getByRole('button', { name: 'Next tool' }) as HTMLButtonElement;
    const indicators = screen.getAllByRole('tab');
    const lastIndex = featuredTools.length - 1;
    const expectSelectedTool = (index: number) => {
      expect(position()).toContain(expectedPosition(index + 1));
      expect(position()).toContain(resources.en.translation[featuredTools[index]!.page].title);
      expect(screen.getByRole('article').getAttribute('data-tool-id')).toBe(featuredTools[index]!.id);
      expect(indicators.map(indicator => indicator.getAttribute('aria-selected')))
        .toEqual(featuredTools.map((_, selected) => String(selected === index)));
      for (const button of [previous, next]) {
        expect(button.getAttribute('aria-disabled')).toBe('false');
        expect(button.tabIndex).toBe(0);
      }
    };

    expectSelectedTool(0);
    previous.focus();
    fireEvent.click(previous);
    expectSelectedTool(lastIndex);
    expect(document.activeElement).toBe(previous);
    next.focus();
    fireEvent.click(next);
    expectSelectedTool(0);
    expect(document.activeElement).toBe(next);
    fireEvent.click(next);
    expectSelectedTool(1);
    fireEvent.click(previous);
    expectSelectedTool(0);
    expect(document.activeElement).toBe(next);

    carousel.focus();
    fireEvent.keyDown(carousel, { key: 'End' });
    expectSelectedTool(lastIndex);
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expectSelectedTool(0);
    expect(document.activeElement).toBe(carousel);
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expectSelectedTool(lastIndex);
    expect(document.activeElement).toBe(carousel);
    fireEvent.keyDown(carousel, { key: 'Home' });
    expectSelectedTool(0);
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expectSelectedTool(1);
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expectSelectedTool(0);
    expect(document.activeElement).toBe(carousel);
  });

  it.each(['ArrowLeft', 'ArrowRight', 'Home', 'End'])('leaves %s on card links and arrow buttons to their own interaction', key => {
    render(<App />);
    const link = screen.getByRole('link', { name: resources.en.translation.home.cidrLink });
    const next = screen.getByRole('button', { name: 'Next tool' });
    link.focus();
    expect(fireEvent.keyDown(link, { key })).toBe(true);
    expect(position()).toContain(expectedPosition(1));
    expect(document.activeElement).toBe(link);
    next.focus();
    expect(fireEvent.keyDown(next, { key })).toBe(true);
    expect(position()).toContain(expectedPosition(1));
    expect(document.activeElement).toBe(next);
  });

  it('ignores modified and composing container shortcuts', () => {
    render(<App />);
    const carousel = document.getElementById('tool-gallery-carousel')!;
    carousel.focus();
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey', 'isComposing']) {
      expect(fireEvent.keyDown(carousel, { key: 'ArrowRight', [modifier]: true })).toBe(true);
      expect(position()).toContain(expectedPosition(1));
      expect(document.activeElement).toBe(carousel);
    }
  });

  it('moves focus to the gallery before an indicator hides the focused card', () => {
    render(<App />);
    const carousel = document.getElementById('tool-gallery-carousel')!;
    const link = screen.getByRole('link', { name: resources.en.translation.home.cidrLink });
    const oldSlide = link.closest('.mantine-Carousel-slide')!;
    const indicators = screen.getAllByRole('tab');
    const focusedBeforeInert = vi.fn(() => expect(oldSlide.hasAttribute('inert')).toBe(false));
    carousel.addEventListener('focus', focusedBeforeInert);
    link.focus();
    fireEvent.mouseDown(indicators[1]!);
    fireEvent.click(indicators[1]!);
    expect(focusedBeforeInert).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(carousel);
    expect(oldSlide.getAttribute('aria-hidden')).toBe('true');
    expect(oldSlide.hasAttribute('inert')).toBe(true);
    expect(position()).toContain(expectedPosition(2));
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(position()).toContain(expectedPosition(3));
  });

  it('does not move card focus when its indicator is reselected or steal focus outside a card', () => {
    render(<><button>Outside gallery</button><App /></>);
    const link = screen.getByRole('link', { name: resources.en.translation.home.cidrLink });
    const indicators = screen.getAllByRole('tab');
    link.focus();
    fireEvent.mouseDown(indicators[0]!);
    fireEvent.click(indicators[0]!);
    expect(document.activeElement).toBe(link);
    const outside = screen.getByRole('button', { name: 'Outside gallery' });
    outside.focus();
    fireEvent.mouseDown(indicators[1]!);
    fireEvent.click(indicators[1]!);
    expect(document.activeElement).toBe(outside);
    expect(position()).toContain(expectedPosition(2));
    const next = screen.getByRole('button', { name: 'Next tool' });
    next.focus();
    fireEvent.click(next);
    expect(document.activeElement).toBe(next);
    expect(position()).toContain(expectedPosition(3));
  });

  it('wraps indicator keyboard selection without container shortcuts interfering', () => {
    render(<App />);
    const indicators = screen.getAllByRole('tab');
    indicators[0]!.focus();
    fireEvent.keyDown(indicators[0]!, { key: 'ArrowLeft' });
    expect(position()).toContain(expectedPosition(featuredTools.length));
    expect(document.activeElement).toBe(indicators.at(-1));
    fireEvent.keyDown(indicators.at(-1)!, { key: 'ArrowRight' });
    expect(position()).toContain(expectedPosition(1));
    expect(document.activeElement).toBe(indicators[0]);
  });

  it('preserves Enter and Space activation on controls and Enter navigation on a card link', async () => {
    const user = userEvent.setup();
    render(<App />);
    const next = screen.getByRole('button', { name: 'Next tool' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(position()).toContain(expectedPosition(2));
    expect(document.activeElement).toBe(next);
    await user.keyboard(' ');
    expect(position()).toContain(expectedPosition(3));
    expect(document.activeElement).toBe(next);
    const link = screen.getByRole('link', { name: resources.en.translation.home.rangeLink });
    link.focus();
    await user.keyboard('{Enter}');
    expect(window.location.pathname).toBe(featuredTools[2]!.webPath);
    expect(screen.getByRole('main').getAttribute('aria-label')).toBe(resources.en.translation.range.title);
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
