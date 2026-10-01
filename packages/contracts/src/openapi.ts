import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  CIDR_COVER_EXAMPLES, CIDR_COVER_PATH, CidrCoverRequestSchema,
  CidrCoverResultSchema, ErrorResponseSchema, HealthResultSchema, MAX_REQUEST_BYTES,
} from './index';

extendZodWithOpenApi(z);

export function createOpenApiDocument() {
  const registry = new OpenAPIRegistry();
  // Clone after extending Zod so documentation metadata stays out of runtime schemas.
  const request = registry.register('CidrCoverRequest', CidrCoverRequestSchema.clone());
  const result = registry.register('CidrCoverResult', CidrCoverResultSchema.clone());
  const error = registry.register('ErrorResponse', ErrorResponseSchema.clone());
  const health = registry.register('HealthResult', HealthResultSchema.clone());
  const errorResponse = (description: string) => ({
    description, content: { 'application/json': { schema: error } },
  });
  registry.registerPath({
    method: 'post', path: CIDR_COVER_PATH, operationId: 'smallestCoveringCidr', tags: ['CIDR'],
    summary: 'Find the smallest single CIDR covering all inputs',
    description: `Accepts IPv4 or IPv6 addresses and CIDRs from one address family. The output maximizes the prefix length while covering every input address, and may include additional addresses. Overlapping inputs are counted once. CIDRs with host bits are normalized. The request body must not exceed ${MAX_REQUEST_BYTES} bytes. This is a stateless calculation and does not modify firewall rules.`,
    security: [],
    request: { body: { required: true, content: { 'application/json': {
      schema: request,
      examples: Object.fromEntries(CIDR_COVER_EXAMPLES.map((example, index) => [
        `example${index + 1}`, { summary: example.name, value: example.request },
      ])),
    } } } },
    responses: {
      200: { description: 'The covering CIDR and exact address counts.', content: { 'application/json': {
        schema: result,
        examples: Object.fromEntries(CIDR_COVER_EXAMPLES.map((example, index) => [
          `example${index + 1}`, { summary: example.name, value: example.result },
        ])),
      } } },
      400: errorResponse('Invalid JSON, invalid input, or mixed address families. Entry-specific issues include a zero-based input index.'),
      413: errorResponse('Request body exceeds 64 KiB.'),
      415: errorResponse('Expected an application/json request body.'),
      405: errorResponse('Method is not supported for this endpoint.'),
      500: errorResponse('Unexpected internal failure.'),
    },
  });
  registry.registerPath({
    method: 'get', path: '/health', operationId: 'getHealth', tags: ['Platform'],
    summary: 'Check service health', security: [],
    responses: { 200: { description: 'Service is healthy.', content: { 'application/json': { schema: health } } },
      405: errorResponse('Method is not supported for this endpoint.'),
      500: errorResponse('Unexpected internal failure.') },
  });
  registry.registerPath({
    method: 'get', path: '/api/openapi.json', operationId: 'getOpenApiSpecification', tags: ['Platform'],
    summary: 'Read the OpenAPI specification', security: [],
    responses: { 200: { description: 'The OpenAPI 3.1.0 document.', content: { 'application/json': {
      schema: { type: 'object', additionalProperties: true },
    } } }, 405: errorResponse('Method is not supported for this endpoint.'),
      500: errorResponse('Unexpected internal failure.') },
  });
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: { title: 'Packetrove API', version: '0.1.0',
      description: 'Deterministic network tools for humans and agents. Address counts are decimal strings for exact IPv6 representation.' },
    servers: [{ url: '/', description: 'The host serving this specification' }],
    tags: [{ name: 'CIDR', description: 'IP address and CIDR calculations.' },
      { name: 'Platform', description: 'Service metadata.' }],
    security: [],
  });
}
