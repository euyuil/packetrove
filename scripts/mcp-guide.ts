import { checkOrWriteGeneratedFile } from './generated-file';
import { createMcpGuideMarkdown } from './mcp-guide-markdown';

const target = new URL('../docs/integrations/mcp.md', import.meta.url);
const generated = createMcpGuideMarkdown();
await checkOrWriteGeneratedFile(target, generated, 'MCP guide is out of date. Run pnpm docs:mcp:generate.');
