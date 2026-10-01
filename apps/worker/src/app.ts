import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CIDR_COVER_PATH, type ErrorResponse } from '@packetrove/contracts';
import { createOpenApiDocument } from '@packetrove/contracts/openapi';
import { smallestCoveringCidr, ToolError } from '@packetrove/core';
import { readJsonBody } from './body';

export type WorkerBindings = { ASSETS?: Fetcher };

export function createApp() {
  const app = new Hono<{ Bindings: WorkerBindings }>();
  const specification = createOpenApiDocument();
  app.use('/api/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }));
  app.onError((error, context) => {
    if (error instanceof ToolError) {
      const status = error.code === 'PAYLOAD_TOO_LARGE' ? 413
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
  app.get('/health', context => context.json({ status: 'ok' }));
  app.get('/api/openapi.json', context => context.json(specification));
  for (const [path, allowed] of [[CIDR_COVER_PATH, 'POST'], ['/health', 'GET, HEAD'], ['/api/openapi.json', 'GET, HEAD']]) {
    app.all(path!, context => {
      context.header('Allow', allowed!);
      return context.json({ error: {
        code: 'METHOD_NOT_ALLOWED', message: `Use ${allowed} for this endpoint.`,
      } } satisfies ErrorResponse, 405);
    });
  }
  app.notFound(context => {
    if (!context.req.path.startsWith('/api/') && context.env?.ASSETS) {
      return context.env.ASSETS.fetch(context.req.raw);
    }
    return context.json({ error: {
      code: 'NOT_FOUND', message: 'Endpoint not found.',
    } } satisfies ErrorResponse, 404);
  });
  return app;
}
