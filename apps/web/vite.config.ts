import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { PUBLIC_API_ORIGIN } from '@packetrove/contracts';

export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  input: ['index.html', 'cidr.html', 'ip.html', 'docs/api.html', '404.html',
    'zh/index.html', 'zh/cidr.html', 'zh/ip.html', 'zh/docs/api.html'],
  build: { target: 'es2022' },
  define: {
    'import.meta.env.VITE_API_ORIGIN': JSON.stringify(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_ORIGIN
      || (command === 'serve' ? 'http://localhost:8787' : PUBLIC_API_ORIGIN)),
  },
}));
