import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { PUBLIC_API_ORIGIN } from '@packetrove/contracts';
import { fileURLToPath } from 'node:url';
import { websitePages } from './src/seo';
import { pageEntriesPlugin } from './scripts/page-entries';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command, mode }) => ({
  plugins: [react(), pageEntriesPlugin(root)],
  input: [...websitePages.map(page => page.entry), '404.html'],
  build: { target: 'es2022', manifest: true },
  define: {
    'import.meta.env.VITE_API_ORIGIN': JSON.stringify(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_ORIGIN
      || (command === 'serve' ? 'http://localhost:8787' : PUBLIC_API_ORIGIN)),
  },
}));
