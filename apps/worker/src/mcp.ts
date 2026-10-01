import { McpServer, type McpRequestContext } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import {
  CidrCoverRequestSchema, CidrCoverResultSchema, MCP_TOOL_NAME,
  PUBLIC_IP_TOOL_NAME, PublicIpRequestSchema, PublicIpResultSchema,
} from '@packetrove/contracts';
import { smallestCoveringCidr, ToolError } from '@packetrove/core';
import { getPublicIp } from './ip';

export function createMcpServer(context: McpRequestContext) {
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
  server.registerTool(PUBLIC_IP_TOOL_NAME, {
    title: 'Current Public IP',
    description: 'Get the IPv4 or IPv6 address observed for this MCP tool-call request. This is the MCP client connection: a hosted AI client may observe its own exit address, not the user device address. A VPN or proxy changes the observed path. One call observes one address family and does not discover local IPs or bypass a proxy. The application does not store or log the result; no firewall rules are changed. Cloudflare Worker subrequests can have platform-specific address semantics.',
    inputSchema: PublicIpRequestSchema,
    outputSchema: PublicIpResultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async () => {
    try {
      const result = getPublicIp(context.requestInfo?.headers);
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
