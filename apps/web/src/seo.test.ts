import { afterEach, expect, it, vi } from 'vitest';
import * as metadata from './i18n/page-metadata';
import { renderPageMetadata } from './seo';

afterEach(() => { vi.restoreAllMocks(); });

it('preserves translated punctuation as text without letting it create HTML elements or attributes', () => {
  const text = `CIDR & "IP" 中文 '</title><script>example</script>`;
  const original = metadata.getPageMetadata('en', 'cidr', '/cidr');
  vi.spyOn(metadata, 'getPageMetadata').mockReturnValue({ ...original,
    title: text, meta: original.meta.map(entry => ({ ...entry, content: text })),
  });
  const document = new DOMParser().parseFromString('<!doctype html><html><head>'
    + renderPageMetadata('/cidr') + '</head></html>', 'text/html');
  expect(document.title).toBe(text);
  expect(document.querySelectorAll('title')).toHaveLength(1);
  expect(document.querySelectorAll('script')).toHaveLength(0);
  for (const entry of original.meta) {
    const element = document.querySelector('meta[' + entry.attribute + '="' + entry.key + '"]');
    expect(element?.getAttribute('content')).toBe(text);
    expect(element?.attributes).toHaveLength(2);
  }
});
