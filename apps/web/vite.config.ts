import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { PUBLIC_API_ORIGIN } from '@packetrove/contracts';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { renderPageMetadata, websitePages } from './src/seo';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command, mode }) => ({
  plugins: [react(), {
    name: 'packetrove-page-metadata',
    transformIndexHtml(html, context) {
      const entry = relative(root, context.filename).replaceAll('\\', '/');
      const page = websitePages.find(candidate => candidate.entry === entry);
      if (!page) return html;
      if (!html.includes('<!--page-metadata-->')) throw new Error('Missing page metadata placeholder: ' + entry);
      return html.replace('<!--page-metadata-->', () => renderPageMetadata(page.pathname));
    },
  }],
  input: ['index.html', 'cidr.html', 'ip.html', 'docs/api.html', '404.html',
    'zh/index.html', 'zh/cidr.html', 'zh/ip.html', 'zh/docs/api.html'],
  build: { target: 'es2022' },
  define: {
    'import.meta.env.VITE_API_ORIGIN': JSON.stringify(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_ORIGIN
      || (command === 'serve' ? 'http://localhost:8787' : PUBLIC_API_ORIGIN)),
  },
}));
