import { describe, expect, it } from 'vitest';
import { createOpenApiDocument } from './openapi';
import { toolCatalog, tools } from './index';

describe('shared tool catalog contracts', () => {
  it('keeps interface identifiers unique and website names outside short locale prefixes', () => {
    for (const values of [tools.map(tool => tool.id), tools.map(tool => tool.webPath),
      tools.map(tool => tool.api.path), tools.map(tool => tool.mcp.name)]) {
      expect(new Set(values).size).toBe(values.length);
    }
    for (const tool of tools) expect(tool.webPath.split('/')[1]!.split('-')[0]!.length).toBeGreaterThanOrEqual(4);
    for (const [page, tool] of Object.entries(toolCatalog)) expect(tool.page).toBe(page);
  });
  it('documents exactly the catalog tool endpoints alongside platform metadata', () => {
    const document = createOpenApiDocument();
    expect(Object.keys(document.paths!).sort()).toEqual([...tools.map(tool => tool.api.path), '/health', '/openapi.json'].sort());
    for (const tool of tools) {
      expect(document.paths![tool.api.path]?.[tool.api.method]?.operationId).toBe(tool.api.operationId);
    }
  });
  it.each(tools)('uses schema-valid examples for $id', tool => {
    expect(tool.examples).toContain(tool.example);
    for (const example of tool.examples) {
      expect(tool.inputSchema.safeParse(example.request).success).toBe(true);
      expect(tool.outputSchema.safeParse(example.result).success).toBe(true);
    }
  });
});
