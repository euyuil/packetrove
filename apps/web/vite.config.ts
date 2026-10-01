import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  input: ['index.html', 'ip.html', '404.html'],
  build: { target: 'es2022' },
  server: { proxy: { '/api': 'http://localhost:8787' } },
});
