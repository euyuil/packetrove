import { CIDR_COVER_EXAMPLES, MCP_TOOL_NAME, PUBLIC_IP_TOOL_NAME, type PublicIpResult } from '@packetrove/contracts';

const cidr = CIDR_COVER_EXAMPLES[1]!;

export const mcpExamples = {
  cidr: { name: MCP_TOOL_NAME, arguments: cidr.request, result: cidr.result },
  ip: { name: PUBLIC_IP_TOOL_NAME, arguments: {},
    result: { ip: '203.0.113.1', family: 'ipv4' } satisfies PublicIpResult },
};

export type McpExampleTool = keyof typeof mcpExamples;
