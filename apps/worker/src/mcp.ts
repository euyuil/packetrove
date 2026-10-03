import { McpServer, type McpRequestContext, type CallToolResult } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import type { z } from 'zod';
import { MCP_PATH, PACKETROVE_IDENTITY, PACKETROVE_VERSION, PUBLIC_WEBSITE_ORIGIN, tools } from '@packetrove/contracts';
import { ToolError } from '@packetrove/core';
import { executeTool } from './tools';

function createMcpServer(context: McpRequestContext) {
  const server = new McpServer({ ...PACKETROVE_IDENTITY, version: PACKETROVE_VERSION });
  for (const tool of tools) {
    // Local cores validate the entire request and return shared, located errors.
    // Retain the catalog's discovery schema while letting malformed inputs reach that validation.
    const inputSchema = tool.execution === 'local' ? {
      '~standard': { ...tool.inputSchema['~standard'], validate: (value: unknown) => ({ value }) },
    } : tool.inputSchema;
    server.registerTool<z.ZodType, typeof inputSchema>(tool.mcp.name, {
      title: tool.title, description: tool.mcp.description,
      inputSchema, outputSchema: tool.outputSchema,
      annotations: tool.mcp.annotations,
    }, async (request: unknown): Promise<CallToolResult> => {
      try {
        const result = executeTool(tool.page, request, context.requestInfo?.headers);
        return { structuredContent: result, content: [
          { type: 'text', text: JSON.stringify(result) }, tool.mcp.resultLink,
        ] };
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
  allowedOriginHostnames: [...allowedHostnames, new URL(PUBLIC_WEBSITE_ORIGIN).hostname],
});
