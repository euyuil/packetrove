import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { supportedLocales } from './i18n/locales';
import { websitePages } from './seo';

type Chunk = { file: string; imports?: string[]; isDynamicEntry?: boolean };

it('keeps every page and locale module out of the production static entry graph', async () => {
  const filename = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/.vite/manifest.json');
  const manifest = JSON.parse(await readFile(filename, 'utf8')) as Record<string, Chunk>;
  const pages = ['CidrCoverTool', 'CidrSubtractTool', 'RangeToCidrsTool', 'PublicIpTool', 'HomePage', 'ApiDocumentation', 'McpDocumentation'];
  const deferredModules = [...pages.map(page => `src/${page}.tsx`),
    ...supportedLocales.map(locale => `src/i18n/translations/${locale}.ts`)];
  for (const module of deferredModules) expect(manifest[module]?.isDynamicEntry, module).toBe(true);
  function staticImports(key: string, seen = new Set<string>()): Set<string> {
    if (seen.has(key)) return seen;
    seen.add(key);
    for (const dependency of manifest[key]!.imports ?? []) staticImports(dependency, seen);
    return seen;
  }
  const byFile = new Map(Object.entries(manifest).map(([key, chunk]) => [chunk.file, key]));
  for (const page of websitePages) {
    const html = await readFile(resolve(dirname(filename), '..', page.entry), 'utf8');
    const document = new DOMParser().parseFromString(html, 'text/html');
    const imports = new Set<string>();
    for (const script of document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')) {
      const file = script.getAttribute('src')!.replace(/^\//, '');
      const key = byFile.get(file);
      expect(key, file).toBeDefined();
      staticImports(key!, imports);
    }
    expect(imports.size, page.entry).toBeGreaterThan(0);
    for (const module of deferredModules) expect(imports.has(module), `${page.entry} eagerly imports ${module}`).toBe(false);
  }
});
