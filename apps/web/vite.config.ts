import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { PUBLIC_API_ORIGIN } from '@packetrove/contracts';
import { supportedLocales } from './src/i18n/locales';
import { localizedPath, pagePaths } from './src/i18n/routes';

export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  input: [...supportedLocales.flatMap(locale => Object.values(pagePaths).map(path =>
    localizedPath(path, locale).slice(1) + (path === '/' ? 'index.html' : '.html'))), '404.html'],
  build: { target: 'es2022' },
  define: {
    'import.meta.env.VITE_API_ORIGIN': JSON.stringify(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_ORIGIN
      || (command === 'serve' ? 'http://localhost:8787' : PUBLIC_API_ORIGIN)),
  },
}));
