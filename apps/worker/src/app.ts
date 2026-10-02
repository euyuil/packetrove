import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CIDR_COVER_PATH, PUBLIC_IP_PATH, type ErrorResponse } from '@packetrove/contracts';
import { smallestCoveringCidr, ToolError } from '@packetrove/core';
import { readJsonBody } from './body';
import { mcpHandler } from './mcp';
import { getPublicIp } from './ip';

export function createApp() {
  const app = new Hono<{ Bindings: Cloudflare.Env }>();
  for (const path of ['/v1/*', '/health', '/openapi.json']) {
    app.use(path, cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }));
  }
  app.use(PUBLIC_IP_PATH, async (context, next) => {
    context.header('Cache-Control', 'no-store');
    await next();
  });
  app.onError((error, context) => {
    if (error instanceof ToolError) {
      const status = error.code === 'CLIENT_IP_UNAVAILABLE' ? 503 : error.code === 'PAYLOAD_TOO_LARGE' ? 413
        : error.code === 'UNSUPPORTED_MEDIA_TYPE' ? 415 : 400;
      return context.json(error.toResponse(), status);
    }
    console.error('Unexpected request failure:', error);
    return context.json({ error: {
      code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.',
    } } satisfies ErrorResponse, 500);
  });
  app.post(CIDR_COVER_PATH, async context => {
    const body = await readJsonBody(context.req.raw);
    return context.json(smallestCoveringCidr(body));
  });
  app.get(PUBLIC_IP_PATH, context => context.json(getPublicIp(context.req.raw.headers)));
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
  for (const [path, allowed] of [[CIDR_COVER_PATH, 'POST'], [PUBLIC_IP_PATH, 'GET, HEAD'], ['/health', 'GET, HEAD'], ['/openapi.json', 'GET, HEAD']]) {
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
