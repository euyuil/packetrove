import { fileURLToPath, URL } from 'node:url';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [cloudflareTest({
    wrangler: { configPath: fileURLToPath(new URL('./wrangler.jsonc', import.meta.url)) },
    miniflare: { d1Databases: ['FEEDBACK_DB'] },
  })],
  test: { name: 'api', include: ['test/**/*.test.ts'], exclude: ['test/website.test.ts'],
    provide: { feedbackMigrations: await readD1Migrations(fileURLToPath(new URL('./migrations', import.meta.url))) } },
});
