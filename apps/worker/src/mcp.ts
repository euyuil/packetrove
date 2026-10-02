import { McpServer, type McpRequestContext } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import {
  CidrCoverRequestSchema, CidrCoverResultSchema, MAX_INPUTS, MAX_INPUT_LENGTH, MCP_PATH, MCP_TOOL_NAME,
  PACKETROVE_VERSION,
  PUBLIC_IP_TOOL_NAME, PublicIpRequestSchema, PublicIpResultSchema,
} from '@packetrove/contracts';
import { smallestCoveringCidr, ToolError } from '@packetrove/core';
import { getPublicIp } from './ip';

export function createMcpServer(context: McpRequestContext) {
  const server = new McpServer({ name: 'Packetrove', version: PACKETROVE_VERSION });
  server.registerTool(MCP_TOOL_NAME, {
    title: 'Smallest Covering CIDR',
    description: `Use when combining a selected group of firewall allowlist or blocklist entries into one smallest covering CIDR, or when checking the exact extra coverage. Accept 1 to ${MAX_INPUTS.toLocaleString('en')} IP addresses or CIDRs from one address family, up to ${MAX_INPUT_LENGTH} characters each; normalize host bits and count overlaps once. Return the canonical CIDR, inclusive range, and exact decimal-string counts, including additionalAddressCount. The range may allow or block additional addresses. This computes one CIDR for the supplied inputs; it does not optimize an entire list against an entry limit or change firewall rules. Remote MCP calls submit inputs to this server; the calculation makes no outbound network requests.`,
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
    description: 'Use to inspect the public IPv4 or IPv6 address observed for the connection making this MCP tool call. Takes an empty object and returns ip and family. This is the MCP client connection: a hosted AI client may observe its own exit address, not the user device address. If the user needs their browser or computer connection, direct them to the web tool or a CLI running on that machine. A VPN or proxy changes the observed path. One call observes one address family; it does not discover private local addresses, an address before a proxy, or both address families. The application does not store or log results, and no firewall rules are changed. Cloudflare Worker subrequests can have platform-specific address semantics; the result is not an identity proof.',
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
  'api.packetrove.com',
];

export const mcpHandler = createMcpHandler(createMcpServer, {
  route: MCP_PATH, responseMode: 'json',
  allowedHostnames,
  allowedOriginHostnames: [...allowedHostnames, 'packetrove.com'],
});
