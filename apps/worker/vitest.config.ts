import { fileURLToPath, URL } from 'node:url';
import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [cloudflareTest({
    wrangler: { configPath: fileURLToPath(new URL('./wrangler.jsonc', import.meta.url)) },
  })],
  test: { name: 'worker', include: ['test/**/*.test.ts'] },
});
