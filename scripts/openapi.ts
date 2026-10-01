import { readFile, writeFile } from 'node:fs/promises';
import { createOpenApiDocument } from '../packages/contracts/src/openapi';

const target = new URL('../docs/api/openapi.json', import.meta.url);
const generated = `${JSON.stringify(createOpenApiDocument(), null, 2)}\n`;
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== generated) {
    console.error('OpenAPI specification is out of date. Run pnpm spec:generate.');
    process.exitCode = 1;
  }
} else {
  await writeFile(target, generated);
}
