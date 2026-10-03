import { checkOrWriteGeneratedFile } from './generated-file';
import { createMcpRegistryJson } from './mcp-registry-manifest';

const target = new URL('../server.json', import.meta.url);
const generated = createMcpRegistryJson();
await checkOrWriteGeneratedFile(target, generated, 'MCP Registry manifest is out of date. Run pnpm registry:generate.');
