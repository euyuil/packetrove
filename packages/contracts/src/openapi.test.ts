import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createOpenApiDocument } from './openapi';
import type { ToolApiDefinition } from './tools';

describe('tool-defined API documentation', () => {
  it('documents a JSON-only GET without IP-specific assumptions', () => {
    const example = { name: 'Metadata', request: {}, result: { version: 'example' } };
    const tool: ToolApiDefinition = {
      schemaName: 'ExampleMetadata', inputSchema: z.strictObject({}), outputSchema: z.strictObject({ version: z.string() }),
      examples: [example], example,
      api: {
        method: 'get', path: '/v1/example-metadata', operationId: 'example-metadata',
        tag: 'Metadata', tagDescription: 'Example metadata.', summary: 'Read metadata', description: 'A test-only endpoint.',
        response: { description: 'Service metadata.' }, errors: { 503: 'Metadata is unavailable.' },
      },
    };
    const document = createOpenApiDocument([tool]);
    const endpoint = document.paths!['/v1/example-metadata']!.get!;
    expect(endpoint.requestBody).toBeUndefined();
    expect(endpoint.responses?.['200']).toMatchObject({ description: 'Service metadata.', content: {
      'application/json': { examples: { example1: { value: example.result } } },
    } });
    expect(Object.keys((endpoint.responses?.['200'] as { content: object }).content)).toEqual(['application/json']);
    expect(endpoint.responses?.['503']).toMatchObject({ description: 'Metadata is unavailable.' });
    expect(endpoint.responses?.['413']).toBeUndefined();
    expect(document.tags).toContainEqual({ name: 'Metadata', description: 'Example metadata.' });
  });
  it('documents a non-address POST with its own result and domain failures', () => {
    const example = { name: 'Text', request: { text: 'hello' }, result: { characters: 5 } };
    const tool: ToolApiDefinition = {
      schemaName: 'ExampleText', inputSchema: z.strictObject({ text: z.string() }), outputSchema: z.strictObject({ characters: z.number().int() }),
      examples: [example], example,
      api: {
        method: 'post', path: '/v1/example-text', operationId: 'example-text', tag: 'Text', tagDescription: 'Example text processing.',
        summary: 'Measure text', description: 'A test-only endpoint.',
        response: { description: 'The character count.' }, errors: { 400: 'Invalid text.' },
      },
    };
    const endpoint = createOpenApiDocument([tool]).paths!['/v1/example-text']!.post!;
    expect(endpoint.requestBody).toMatchObject({ required: true, content: { 'application/json': {
      examples: { example1: { value: example.request } },
    } } });
    expect(endpoint.responses?.['200']).toMatchObject({ description: 'The character count.' });
    expect(endpoint.responses?.['400']).toMatchObject({ description: 'Invalid text.' });
    expect(endpoint.responses?.['413']).toBeDefined();
    expect(endpoint.responses?.['415']).toBeDefined();
    expect(JSON.stringify(endpoint)).not.toMatch(/CIDR|address counts|IPv[46]/);
  });
});
