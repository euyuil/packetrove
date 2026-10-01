import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'shared', include: ['packages/**/*.test.ts'] } },
      './apps/worker/vitest.config.ts',
    ],
  },
});
