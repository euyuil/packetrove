import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'shared', include: ['packages/**/*.test.ts', 'scripts/**/*.test.ts'] } },
      './apps/worker/vitest.config.ts',
      './apps/worker/vitest.website.config.ts',
      './apps/web/vitest.config.ts',
    ],
  },
});
