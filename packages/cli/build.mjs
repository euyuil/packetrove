import { chmod } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const output = fileURLToPath(new URL('./dist/cli.js', import.meta.url));
await build({
  entryPoints: [fileURLToPath(new URL('./src/cli.ts', import.meta.url))],
  outfile: output,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  logLevel: 'info',
});
await chmod(output, 0o755);
