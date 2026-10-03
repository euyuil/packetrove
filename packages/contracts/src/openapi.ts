import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { ErrorResponseSchema, HealthResultSchema, PACKETROVE_VERSION, tools, type ToolApiDefinition } from './index';

extendZodWithOpenApi(z);

export function createOpenApiDocument(catalog: readonly ToolApiDefinition[] = tools) {
  const registry = new OpenAPIRegistry();
  // Clone after extending Zod so documentation metadata stays out of runtime schemas.
  const error = registry.register('ErrorResponse', ErrorResponseSchema.clone());
  const health = registry.register('HealthResult', HealthResultSchema.clone());
  const errorResponse = (description: string) => ({
    description, content: { 'application/json': { schema: error } },
  });
  for (const tool of catalog) {
    const result = registry.register(tool.schemaName + 'Result', tool.outputSchema.clone());
    const exampleResults = Object.fromEntries(tool.examples.map((example, index) => [
      `example${index + 1}`, { summary: example.name, value: example.result },
    ]));
    const request = tool.api.method === 'post'
      ? registry.register(tool.schemaName + 'Request', tool.inputSchema.clone()) : undefined;
    const response = tool.api.response;
    const text = response.text;
    registry.registerPath({
      method: tool.api.method, path: tool.api.path, operationId: tool.api.operationId, tags: [tool.api.tag],
      summary: tool.api.summary, description: tool.api.description, security: [],
      ...(request ? { request: { body: { required: true, content: { 'application/json': {
        schema: request,
        examples: Object.fromEntries(tool.examples.map((example, index) => [
          `example${index + 1}`, { summary: example.name, value: example.request },
        ])),
      } } } } } : {}),
      responses: {
        200: { description: response.description,
          ...(response.headers ? { headers: Object.fromEntries(Object.entries(response.headers).map(([name, header]) => [
            name, { description: header.description, schema: { type: 'string' as const, const: header.value } },
          ])) } : {}),
          content: {
          'application/json': { schema: result, examples: exampleResults },
          ...(text ? { 'text/plain': {
            schema: { type: 'string' as const, description: text.description },
            examples: Object.fromEntries(tool.examples.map(example => [
              example.name.toLowerCase(), { value: text.format(example.result) },
            ])),
          } } : {}),
        } },
        ...Object.fromEntries(Object.entries(tool.api.errors).map(([status, description]) => [status, errorResponse(description)])),
        ...(request ? {
          413: errorResponse('Request body exceeds 64 KiB.'),
          415: errorResponse('Expected an application/json request body.'),
        } : {}),
        405: errorResponse('Method is not supported for this endpoint.'),
        500: errorResponse('Unexpected internal failure.'),
      },
    });
  }
  registry.registerPath({
    method: 'get', path: '/health', operationId: 'getHealth', tags: ['Platform'],
    summary: 'Check service health', security: [],
    responses: { 200: { description: 'Service is healthy.', content: { 'application/json': { schema: health } } },
      405: errorResponse('Method is not supported for this endpoint.'),
      500: errorResponse('Unexpected internal failure.') },
  });
  registry.registerPath({
    method: 'get', path: '/openapi.json', operationId: 'getOpenApiSpecification', tags: ['Platform'],
    summary: 'Read the OpenAPI specification', security: [],
    responses: { 200: { description: 'The OpenAPI 3.1.0 document.', content: { 'application/json': {
      schema: { type: 'object', additionalProperties: true },
    } } }, 405: errorResponse('Method is not supported for this endpoint.'),
      500: errorResponse('Unexpected internal failure.') },
  });
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: { title: 'Packetrove API', version: PACKETROVE_VERSION,
      license: { name: 'MIT', url: 'https://opensource.org/license/mit/' },
      description: 'Network tools for humans and agents, including local calculations and request-based diagnostics. Address counts are decimal strings for exact IPv6 representation.' },
    servers: [{ url: '/', description: 'The host serving this specification' }],
    tags: [...new Map(catalog.map(tool => [tool.api.tag, { name: tool.api.tag, description: tool.api.tagDescription }])).values(),
      { name: 'Platform', description: 'Service metadata.' }],
    security: [],
  });
}
