import { McpServer, type McpRequestContext, type CallToolResult, type ServerContext } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import type { z } from 'zod';
import { MCP_PATH, PACKETROVE_VERSION, PUBLIC_API_ORIGIN, PUBLIC_WEBSITE_ORIGIN,
  getServiceIdentity, getToolResultLink, publicOrigin, tools } from '@packetrove/contracts';
import { ToolError } from '@packetrove/core';
import { executeTool, type ToolExecutor } from './tools';
import { createToolExecutionContext } from './tool-context';
import { logMcpToolExecution, type McpToolExecutionOutcome } from './operational-logs';
import { getMcpTrafficSource } from './automation-source';

export function createMcpServer(context: McpRequestContext, executor: ToolExecutor = executeTool,
  automationToken?: string, websiteOrigin = PUBLIC_WEBSITE_ORIGIN) {
  const server = new McpServer({ ...getServiceIdentity(websiteOrigin), version: PACKETROVE_VERSION });
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
    }, async (request: unknown, callContext: ServerContext): Promise<CallToolResult> => {
      const callRequest = callContext.http?.req ?? context.requestInfo;
      const source = getMcpTrafficSource(callRequest, automationToken);
      let outcome: McpToolExecutionOutcome = { outcome: 'success' };
      try {
        const executionContext = createToolExecutionContext(callRequest, callContext.mcpReq.signal);
        const result = await executor(tool.page, request, executionContext);
        return { structuredContent: result, content: [
          { type: 'text', text: JSON.stringify(result) }, getToolResultLink(tool, websiteOrigin),
        ] };
      } catch (error) {
        const failure = error instanceof ToolError ? error
          : new ToolError('INTERNAL_ERROR', 'An unexpected error occurred.');
        outcome = { outcome: 'error', error_code: failure.code };
        return { isError: true, content: [{ type: 'text', text: JSON.stringify(failure.toResponse()) }] };
      } finally {
        // Count executions, including errors and retries, without passing request data.
        logMcpToolExecution(tool.id, outcome, source);
      }
    });
  }
  return server;
}

export function createPacketroveMcpHandler(executor: ToolExecutor = executeTool, automationToken?: string,
  apiOrigin = PUBLIC_API_ORIGIN, websiteOrigin = PUBLIC_WEBSITE_ORIGIN) {
  const allowedHostnames = ['localhost', '127.0.0.1', '[::1]', new URL(publicOrigin(apiOrigin)).hostname];
  const origin = publicOrigin(websiteOrigin);
  return createMcpHandler(context => createMcpServer(context, executor, automationToken, origin), {
    route: MCP_PATH, responseMode: 'json',
    allowedHostnames,
    allowedOriginHostnames: [...allowedHostnames, new URL(origin).hostname],
  });
}
