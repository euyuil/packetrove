import { McpServer } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import { CidrCoverRequestSchema, CidrCoverResultSchema, MCP_TOOL_NAME } from '@packetrove/contracts';
import { smallestCoveringCidr, ToolError } from '@packetrove/core';

export function createMcpServer() {
  const server = new McpServer({ name: 'Packetrove', version: '0.1.0' });
  server.registerTool(MCP_TOOL_NAME, {
    title: 'Smallest Covering CIDR',
    description: 'Find the smallest single canonical CIDR covering all IPv4 or all IPv6 inputs. Accept IP addresses or CIDRs; normalize host bits. The result may include additional addresses. Exact address counts are decimal strings, with overlapping inputs counted once. This read-only calculation does not modify firewall rules or make network requests.',
    inputSchema: CidrCoverRequestSchema,
    outputSchema: CidrCoverResultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async request => {
    try {
      const result = smallestCoveringCidr(request);
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] };
    } catch (error) {
      const failure = error instanceof ToolError ? error
        : new ToolError('INTERNAL_ERROR', 'An unexpected error occurred.');
      return { isError: true, content: [{ type: 'text', text: JSON.stringify(failure.toResponse()) }] };
    }
  });
  return server;
}

// Keep these exact hostnames aligned with the production domain.
const allowedHostnames = [
  'localhost', '127.0.0.1', '[::1]',
  'packetrove.com',
];

export const mcpHandler = createMcpHandler(createMcpServer, {
  route: '/mcp', responseMode: 'json',
  allowedHostnames,
  allowedOriginHostnames: allowedHostnames,
});
