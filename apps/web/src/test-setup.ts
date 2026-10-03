import { beforeAll, beforeEach, vi } from 'vitest';
import { prepareRoute } from './page-resources';
import { pagePaths, localizedPath } from './i18n/routes';
import { supportedLocales } from './i18n/locales';

// Existing interaction tests exercise prepared views. Cold caches and loading
// races have separate tests; the production manifest also verifies chunk edges.
beforeAll(async () => {
  await Promise.all(supportedLocales.flatMap(locale =>
    Object.values(pagePaths).map(path => prepareRoute(localizedPath(path, locale)))));
});

beforeEach(() => { window.sessionStorage.clear(); });

// JSDOM has no layout. Give Carousel measurable slide offsets so its engine can select
// different cards; all other elements retain JSDOM's original measurements.
const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!.get!;
const originalLeft = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetLeft')!.get!;
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return ['mantine-Carousel-viewport', 'mantine-Carousel-container', 'mantine-Carousel-slide']
      .some(name => this.classList.contains(name)) ? 600 : originalWidth.call(this);
  });
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('mantine-Carousel-slide')
      ? Array.from(this.parentElement!.children).indexOf(this) * 600 : originalLeft.call(this);
  });
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// JSDOM has no FontFaceSet; Mantine's autosizing textarea listens for font loads.
Object.defineProperty(document, 'fonts', { value: new EventTarget(), configurable: true });

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: class {
    constructor(private callback: (entries: IntersectionObserverEntry[], observer: unknown) => void) {}
    observe(target: Element) {
      queueMicrotask(() => this.callback([{
        target, isIntersecting: true, intersectionRatio: 1, time: performance.now(), rootBounds: null,
        boundingClientRect: target.getBoundingClientRect(), intersectionRect: target.getBoundingClientRect(),
      }], this));
    }
    unobserve() {}
    disconnect() {}
  },
});
