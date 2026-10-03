import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { ErrorResponseSchema, HealthResultSchema, PACKETROVE_VERSION, tools } from './index';

extendZodWithOpenApi(z);

export function createOpenApiDocument() {
  const registry = new OpenAPIRegistry();
  // Clone after extending Zod so documentation metadata stays out of runtime schemas.
  const error = registry.register('ErrorResponse', ErrorResponseSchema.clone());
  const health = registry.register('HealthResult', HealthResultSchema.clone());
  const errorResponse = (description: string) => ({
    description, content: { 'application/json': { schema: error } },
  });
  for (const tool of tools) {
    const result = registry.register(tool.schemaName + 'Result', tool.outputSchema.clone());
    const exampleResults = Object.fromEntries(tool.examples.map((example, index) => [
      `example${index + 1}`, { summary: example.name, value: example.result },
    ]));
    if (tool.api.method === 'post') {
      const request = registry.register(tool.schemaName + 'Request', tool.inputSchema.clone());
      registry.registerPath({
        method: tool.api.method, path: tool.api.path, operationId: tool.api.operationId, tags: [tool.api.tag],
        summary: tool.api.summary, description: tool.api.description, security: [],
        request: { body: { required: true, content: { 'application/json': {
          schema: request,
          examples: Object.fromEntries(tool.examples.map((example, index) => [
            `example${index + 1}`, { summary: example.name, value: example.request },
          ])),
        } } } },
        responses: {
          200: { description: 'The calculated result and exact address counts.', content: {
            'application/json': { schema: result, examples: exampleResults },
          } },
          400: errorResponse(tool.page === 'subtract'
            ? 'Invalid JSON, invalid input, mixed address families, or output limit exceeded. Entry issues include a zero-based index and identify the include/exclude list.'
            : tool.page === 'range' ? 'Invalid JSON, invalid endpoints, mixed address families, or reversed range. Issues identify the start or end field.'
            : 'Invalid JSON, invalid input, or mixed address families. Input issues include a zero-based index.'),
          413: errorResponse('Request body exceeds 64 KiB.'),
          415: errorResponse('Expected an application/json request body.'),
          405: errorResponse('Method is not supported for this endpoint.'),
          500: errorResponse('Unexpected internal failure.'),
        },
      });
    } else if (tool.page === 'ip') {
      registry.registerPath({
        method: tool.api.method, path: tool.api.path, operationId: tool.api.operationId, tags: [tool.api.tag],
        summary: tool.api.summary, description: tool.api.description, security: [],
        responses: {
          200: {
            description: 'The observed address as JSON with its address family, or as plain text when requested.',
            headers: {
              'Cache-Control': { description: 'Do not store this per-request result.', schema: { type: 'string', const: 'no-store' } },
              Vary: { description: 'The response format depends on the Accept header.', schema: { type: 'string', const: 'Accept' } },
            },
            content: {
              'application/json': { schema: result, examples: exampleResults },
              'text/plain': {
                schema: { type: 'string', description: 'One IPv4 or IPv6 address followed by a newline.' },
                examples: Object.fromEntries(tool.examples.map(example => [
                  example.name.toLowerCase(), { value: example.result.ip + '\n' },
                ])),
              },
            },
          },
          503: errorResponse('CLIENT_IP_UNAVAILABLE: edge connection information is missing or invalid. No guessed or caller-supplied forwarded address is returned.'),
          405: errorResponse('Method is not supported for this endpoint.'),
          500: errorResponse('Unexpected internal failure.'),
        },
      });
    }
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
    tags: [{ name: 'CIDR', description: 'IP address and CIDR calculations.' },
      { name: 'IP', description: 'Request-based IP address diagnostics.' },
      { name: 'Platform', description: 'Service metadata.' }],
    security: [],
  });
}
