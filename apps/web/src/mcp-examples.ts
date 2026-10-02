import { tools, toolCatalog, type ToolPage } from '@packetrove/contracts';

type McpExamples = {
  [Page in ToolPage]: {
    name: (typeof toolCatalog)[Page]['mcp']['name'];
    arguments: (typeof toolCatalog)[Page]['example']['request'];
    result: (typeof toolCatalog)[Page]['example']['result'];
  };
};
export const mcpExamples = Object.fromEntries(tools.map(tool => [tool.page, {
  name: tool.mcp.name, arguments: tool.example.request, result: tool.example.result,
}])) as McpExamples;

export type McpExampleTool = ToolPage;
