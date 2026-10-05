import { McpServer, type McpRequestContext, type CallToolResult, type ServerContext } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import type { z } from 'zod';
import { MCP_PATH, PACKETROVE_VERSION, PUBLIC_API_ORIGIN, PUBLIC_WEBSITE_ORIGIN,
  getServiceIdentity, getToolResultLink, publicOrigin, tools, operationCatalog, supportOperations } from '@packetrove/contracts';
import { ToolError } from '@packetrove/core';
import { executeTool, type ToolExecutor } from './tools';
import { createToolExecutionContext } from './tool-context';
import { logMcpToolExecution, type McpToolExecutionOutcome } from './operational-logs';
import { getMcpTrafficSource } from './automation-source';
import { FeedbackError, type FeedbackExecutor } from './feedback';

export function createMcpServer(context: McpRequestContext, executor: ToolExecutor = executeTool,
  automationToken?: string, websiteOrigin = PUBLIC_WEBSITE_ORIGIN, feedback?: FeedbackExecutor) {
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
  const supportHandlers = { [operationCatalog.feedback.id]: feedback } satisfies
    Record<(typeof supportOperations)[number]['id'], FeedbackExecutor | undefined>;
  for (const operation of supportOperations) {
    const handler = supportHandlers[operation.id];
    if (!handler) continue; // Optional support is absent from discovery until explicitly enabled.
    const inputSchema = { '~standard': { ...operation.inputSchema['~standard'], validate: (value: unknown) => ({ value }) } };
    server.registerTool<z.ZodType, typeof inputSchema>(operation.mcp.name, {
      title: operation.title, description: operation.mcp.description,
      inputSchema, outputSchema: operation.outputSchema, annotations: operation.mcp.annotations,
    }, async (request: unknown, callContext: ServerContext): Promise<CallToolResult> => {
      const callRequest = callContext.http?.req ?? context.requestInfo;
      const source = getMcpTrafficSource(callRequest, automationToken);
      let outcome: McpToolExecutionOutcome = { outcome: 'success' };
      try {
        const result = await handler(request, createToolExecutionContext(callRequest, callContext.mcpReq.signal));
        return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (error) {
        const failure = error instanceof FeedbackError ? error
          : new FeedbackError('DELIVERY_UNCERTAIN', 'The report may have been accepted. Do not automatically resubmit.', 'unknown');
        outcome = { outcome: 'error', error_code: failure.code };
        return { isError: true, content: [{ type: 'text', text: JSON.stringify(failure.toResponse()) }] };
      } finally {
        logMcpToolExecution(operation.id, outcome, source);
      }
    });
  }
  return server;
}

export function createPacketroveMcpHandler(executor: ToolExecutor = executeTool, automationToken?: string,
  apiOrigin = PUBLIC_API_ORIGIN, websiteOrigin = PUBLIC_WEBSITE_ORIGIN, feedback?: FeedbackExecutor) {
  const allowedHostnames = ['localhost', '127.0.0.1', '[::1]', new URL(publicOrigin(apiOrigin)).hostname];
  const origin = publicOrigin(websiteOrigin);
  return createMcpHandler(context => createMcpServer(context, executor, automationToken, origin, feedback), {
    route: MCP_PATH, responseMode: 'json',
    allowedHostnames,
    allowedOriginHostnames: [...allowedHostnames, new URL(origin).hostname],
  });
}
