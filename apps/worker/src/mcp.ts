import { McpServer, type McpRequestContext } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import type { z } from 'zod';
import { MCP_PATH, PACKETROVE_VERSION, tools } from '@packetrove/contracts';
import { ToolError } from '@packetrove/core';
import { executeTool } from './tools';

export function createMcpServer(context: McpRequestContext) {
  const server = new McpServer({ name: 'Packetrove', version: PACKETROVE_VERSION });
  for (const tool of tools) {
    server.registerTool<z.ZodType, z.ZodType>(tool.mcp.name, {
      title: tool.title, description: tool.mcp.description,
      inputSchema: tool.inputSchema, outputSchema: tool.outputSchema,
      annotations: tool.mcp.annotations,
    }, async (request: unknown) => {
      try {
        const result = executeTool(tool.page, request, context.requestInfo?.headers);
        return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (error) {
        const failure = error instanceof ToolError ? error
          : new ToolError('INTERNAL_ERROR', 'An unexpected error occurred.');
        return { isError: true, content: [{ type: 'text', text: JSON.stringify(failure.toResponse()) }] };
      }
    });
  }
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
