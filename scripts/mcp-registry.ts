import { readFile, writeFile } from 'node:fs/promises';
import { createMcpRegistryJson } from './mcp-registry-manifest';

const target = new URL('../server.json', import.meta.url);
const generated = createMcpRegistryJson();
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== generated) {
    console.error('MCP Registry manifest is out of date. Run pnpm registry:generate.');
    process.exitCode = 1;
  }
} else {
  await writeFile(target, generated);
}
