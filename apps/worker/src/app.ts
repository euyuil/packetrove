import { Hono } from 'hono';
import { accepts } from 'hono/accepts';
import { cors } from 'hono/cors';
import { tools, type ErrorResponse } from '@packetrove/contracts';
import { ToolError } from '@packetrove/core';
import { readJsonBody } from './body';
import { createPacketroveMcpHandler } from './mcp';
import { executeTool, type ToolExecutor } from './tools';
import { createToolExecutionContext, ToolExecutionCancelledError } from './tool-context';
import { logUnexpectedRequestFailure } from './operational-logs';

export function createApp(executor: ToolExecutor = executeTool) {
  const app = new Hono<{ Bindings: Cloudflare.Env }>();
  const mcpHandler = createPacketroveMcpHandler(executor);
  for (const path of ['/v1/*', '/health', '/openapi.json']) {
    app.use(path, cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }));
  }
  for (const tool of tools) {
    const headers = tool.api.response.headers;
    if (headers) app.use(tool.api.path, async (context, next) => {
      for (const [name, header] of Object.entries(headers)) {
        context.header(name, header.value, { append: name.toLowerCase() === 'vary' });
      }
      await next();
    });
  }
  app.onError((error, context) => {
    if (error instanceof ToolError) {
      const status = error.code === 'CLIENT_IP_UNAVAILABLE' ? 503 : error.code === 'PAYLOAD_TOO_LARGE' ? 413
        : error.code === 'UNSUPPORTED_MEDIA_TYPE' ? 415 : 400;
      return context.json(error.toResponse(), status);
    }
    if (!(error instanceof ToolExecutionCancelledError)) logUnexpectedRequestFailure();
    return context.json({ error: {
      code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.',
    } } satisfies ErrorResponse, 500);
  });
  for (const tool of tools) {
    app.on(tool.api.method.toUpperCase(), tool.api.path, async context => {
      const body = tool.api.method === 'post' ? await readJsonBody(context.req.raw) : {};
      const result = await executor(tool.page, body, createToolExecutionContext(context.req.raw));
      const text = tool.api.response.text;
      if (text) {
        const format = accepts(context, {
          header: 'Accept', supports: ['application/json', 'text/plain'], default: 'application/json',
        });
        if (format === 'text/plain') return context.text(text.format(result));
      }
      return context.json(result);
    });
  }
  app.get('/health', context => context.json({ status: 'ok' }));
  // Asset-first routing serves normal requests without invoking this handler.
  app.get('/openapi.json', context => context.env.OPENAPI_ASSETS.fetch(context.req.raw));
  app.use('/mcp', async (context, next) => {
    await next();
    context.header('Cache-Control', 'no-store, no-transform');
  });
  app.all('/mcp', async context => {
    if (context.req.method === 'POST') {
      const parsedBody = await readJsonBody(context.req.raw);
      return mcpHandler.fetch(context.req.raw, { parsedBody });
    }
    return mcpHandler.fetch(context.req.raw);
  });
  for (const [path, allowed] of [
    ...tools.map(tool => [tool.api.path, tool.api.method === 'get' ? 'GET, HEAD' : 'POST']),
    ['/health', 'GET, HEAD'], ['/openapi.json', 'GET, HEAD'],
  ]) {
    app.all(path!, context => {
      context.header('Allow', allowed!);
      return context.json({ error: {
        code: 'METHOD_NOT_ALLOWED', message: `Use ${allowed} for this endpoint.`,
      } } satisfies ErrorResponse, 405);
    });
  }
  app.notFound(context => {
    return context.json({ error: {
      code: 'NOT_FOUND', message: 'Endpoint not found.',
    } } satisfies ErrorResponse, 404);
  });
  return app;
}
