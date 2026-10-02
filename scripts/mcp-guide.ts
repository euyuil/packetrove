import { readFile, writeFile } from 'node:fs/promises';
import { createMcpGuideMarkdown } from './mcp-guide-markdown';

const target = new URL('../docs/integrations/mcp.md', import.meta.url);
const generated = createMcpGuideMarkdown();
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== generated) {
    console.error('MCP guide is out of date. Run pnpm docs:mcp:generate.');
    process.exitCode = 1;
  }
} else {
  await writeFile(target, generated);
}
