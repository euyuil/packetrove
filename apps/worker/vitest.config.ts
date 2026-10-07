import { fileURLToPath, URL } from 'node:url';
import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [cloudflareTest({
    wrangler: { configPath: fileURLToPath(new URL('./wrangler.jsonc', import.meta.url)) },
    miniflare: { kvNamespaces: ['FEEDBACK_QUOTA'] },
  })],
  test: { name: 'api', include: ['test/**/*.test.ts'], exclude: ['test/website.test.ts'] },
});
