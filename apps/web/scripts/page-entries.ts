import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizePath, type Plugin } from 'vite';
import { renderPageMetadata, websitePages } from '../src/seo';
import { resolveRoute } from '../src/i18n/routes';

type WebsitePage = (typeof websitePages)[number];

export function pageEntryMap(pages: readonly WebsitePage[]) {
  const entries = new Map<string, WebsitePage>();
  for (const page of pages) {
    if (page.entry === '404.html') throw new Error('Page entry is reserved: 404.html');
    if (entries.has(page.entry)) throw new Error('Duplicate page entry: ' + page.entry);
    entries.set(page.entry, page);
  }
  return entries;
}

export function renderPageEntry(template: string, page: WebsitePage) {
  if (!template.includes('<!--page-metadata-->') || !template.includes('<html lang="en"')) {
    throw new Error('The page template must contain its metadata placeholder and English language attribute.');
  }
  return template.replace('<html lang="en"', '<html lang="' + page.locale + '"')
    .replace('<!--page-metadata-->', () => renderPageMetadata(page.pathname));
}

/** Virtual absolute HTML IDs preserve Vite's output paths without copied source files. */
export function pageEntriesPlugin(root: string): Plugin {
  const entries = pageEntryMap(websitePages);
  const pagesById = new Map([...entries].map(([entry, page]) => [normalizePath(resolve(root, entry)), page]));
  const templatePath = resolve(root, 'index.html');
  const readEntry = async (page: WebsitePage) => renderPageEntry(await readFile(templatePath, 'utf8'), page);
  return {
    name: 'packetrove-page-entries', enforce: 'pre',
    resolveId(source) {
      const id = normalizePath(resolve(root, source));
      return pagesById.has(id) ? id : null;
    },
    async load(id) {
      const page = pagesById.get(normalizePath(id));
      if (!page) return null;
      this.addWatchFile(templatePath);
      return readEntry(page);
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const accept = request.headers.accept;
        if (!request.url || (request.method !== 'GET' && request.method !== 'HEAD')
          || request.headers['sec-fetch-dest'] === 'script'
          || (accept && !accept.includes('text/html') && !accept.includes('*/*'))) return next();
        const pathname = new URL(request.url, 'http://localhost').pathname;
        const route = resolveRoute(pathname);
        const page = websitePages.find(candidate => candidate.locale === route.locale && candidate.page === route.page);
        if (!page) return next();
        try {
          const html = await server.transformIndexHtml('/' + page.entry, await readEntry(page), request.url);
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(request.method === 'HEAD' ? undefined : html);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
