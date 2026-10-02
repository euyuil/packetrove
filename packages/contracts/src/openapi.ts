import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  CIDR_COVER_EXAMPLES, CIDR_COVER_PATH, CidrCoverRequestSchema,
  CidrCoverResultSchema, ErrorResponseSchema, HealthResultSchema, MAX_REQUEST_BYTES,
  PACKETROVE_VERSION, PUBLIC_IP_PATH, PublicIpResultSchema,
} from './index';

extendZodWithOpenApi(z);

export function createOpenApiDocument() {
  const registry = new OpenAPIRegistry();
  // Clone after extending Zod so documentation metadata stays out of runtime schemas.
  const request = registry.register('CidrCoverRequest', CidrCoverRequestSchema.clone());
  const result = registry.register('CidrCoverResult', CidrCoverResultSchema.clone());
  const error = registry.register('ErrorResponse', ErrorResponseSchema.clone());
  const health = registry.register('HealthResult', HealthResultSchema.clone());
  const publicIp = registry.register('PublicIpResult', PublicIpResultSchema.clone());
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
    method: 'get', path: PUBLIC_IP_PATH, operationId: 'getPublicIp', tags: ['IP'],
    summary: 'Get the IP address observed for the current request',
    description: 'Returns one IPv4 or IPv6 address from the current connection to Packetrove. Request Accept: text/plain for the address followed by a newline; JSON is the default. Errors remain structured JSON in either format. With a VPN or proxy this is its exit address. A hosted caller observes its own connection, not a user device behind it. It does not discover local addresses or separately probe both address families. The Cloudflare deployment reads edge-provided connection headers, including preserved IPv6 when Pseudo IPv4 overwrites headers. Results and errors are not cached; the application does not store or log the returned IP address.',
    security: [],
    responses: {
      200: {
        description: 'The observed address as JSON with its address family, or as plain text when requested.',
        headers: {
          'Cache-Control': { description: 'Do not store this per-request result.', schema: { type: 'string', const: 'no-store' } },
          Vary: { description: 'The response format depends on the Accept header.', schema: { type: 'string', const: 'Accept' } },
        },
        content: {
          'application/json': { schema: publicIp, examples: {
            ipv4: { value: { ip: '203.0.113.1', family: 'ipv4' } },
            ipv6: { value: { ip: '2001:db8::1', family: 'ipv6' } },
          } },
          'text/plain': {
            schema: { type: 'string', description: 'One IPv4 or IPv6 address followed by a newline.' },
            examples: { ipv4: { value: '203.0.113.1\n' }, ipv6: { value: '2001:db8::1\n' } },
          },
        },
      },
      503: errorResponse('CLIENT_IP_UNAVAILABLE: edge connection information is missing or invalid. No guessed or caller-supplied forwarded address is returned.'),
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
