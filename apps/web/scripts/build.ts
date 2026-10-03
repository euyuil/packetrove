import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';
import { escapeHtml, renderSitemap, robotsText, websitePages, websiteRedirects } from '../src/seo';
import { resources } from '../src/i18n/resources';

const root = fileURLToPath(new URL('..', import.meta.url));
await build({ root });

const cache = join(root, 'node_modules/.cache');
await mkdir(cache, { recursive: true });
const renderDirectory = await mkdtemp(join(cache, 'packetrove-prerender-'));
try {
  await build({
    root, input: 'src/prerender.tsx', publicDir: false, logLevel: 'warn',
    build: {
      ssr: 'src/prerender.tsx', outDir: renderDirectory, emptyOutDir: true,
      rolldownOptions: { output: { entryFileNames: 'render.mjs' } },
    },
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Prerendering must not make network requests.'); };
  try {
    const { renderPage } = await import(pathToFileURL(join(renderDirectory, 'render.mjs')).href) as {
      renderPage: (pathname: string) => Promise<string>;
    };
    for (const page of websitePages) {
      const filename = join(root, 'dist', page.entry);
      const html = await readFile(filename, 'utf8');
      const placeholder = '<div id="root"></div>';
      if (!html.includes(placeholder)) throw new Error('Missing prerender placeholder: ' + page.entry);
      const content = await renderPage(page.pathname);
      const copy = resources[page.locale].translation.common;
      await writeFile(filename, html.replace(placeholder, () =>
        '<div id="root" data-prerendered-path="' + escapeHtml(page.pathname)
        + '" data-load-failure="' + escapeHtml(copy.pageLoadFailure)
        + '" data-load-retry="' + escapeHtml(copy.retryPage) + '">'
        + content + '</div>'));
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  await writeFile(join(root, 'dist/sitemap.xml'), renderSitemap());
  await writeFile(join(root, 'dist/robots.txt'), robotsText);
  await writeFile(join(root, 'dist/_redirects'), websiteRedirects
    .map(({ from, to }) => from + ' ' + to + ' 301').join('\n') + '\n');
  console.log('Prerendered ' + websitePages.length + ' localized pages and generated sitemap.xml, robots.txt, and _redirects.');
} finally {
  await rm(renderDirectory, { recursive: true, force: true });
}
