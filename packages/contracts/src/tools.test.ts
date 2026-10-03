import { describe, expect, it } from 'vitest';
import { createOpenApiDocument } from './openapi';
import { cliTools, legacyToolPagePaths, toolCatalog, tools } from './index';

describe('shared tool catalog contracts', () => {
  it('keeps interface identifiers unique and website names outside short locale prefixes', () => {
    for (const values of [tools.map(tool => tool.id), tools.map(tool => tool.webPath),
      tools.map(tool => tool.api.path), tools.map(tool => tool.api.operationId), tools.map(tool => tool.mcp.name),
      cliTools.map(tool => tool.cli.command)]) {
      expect(new Set(values).size).toBe(values.length);
    }
    for (const tool of tools) expect(tool.webPath.split('/')[1]!.split('-')[0]!.length).toBeGreaterThanOrEqual(4);
    for (const [page, tool] of Object.entries(toolCatalog)) expect(tool.page).toBe(page);
  });
  it.each(tools)('uses one flat public name across every implemented interface for $id', tool => {
    expect(tool.id).toMatch(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
    expect(tool.id.length).toBeLessThanOrEqual(64);
    expect(tool.webPath).toBe('/' + tool.id);
    expect(tool.webPath.split('/')).toHaveLength(2);
    expect(tool.api.path).toBe('/v1/' + tool.id);
    expect(tool.api.operationId).toBe(tool.id);
    expect(tool.mcp.name).toBe(tool.id);
    if (tool.cli) expect(tool.cli.command).toBe(tool.id);
  });
  it('records website compatibility paths separately from canonical and removed interfaces', () => {
    const previousPaths = tools.flatMap(tool => [...tool.legacyWebPaths]);
    expect(new Set(previousPaths).size).toBe(previousPaths.length);
    expect(Object.keys(legacyToolPagePaths)).toEqual(previousPaths);
    for (const tool of tools) {
      for (const path of tool.legacyWebPaths) {
        expect(legacyToolPagePaths[path]).toBe(tool.webPath);
        expect(tools.map(candidate => candidate.webPath)).not.toContain(path);
      }
      for (const path of tool.removedInterfaces.apiPaths) expect(tools.map(candidate => candidate.api.path)).not.toContain(path);
      for (const name of tool.removedInterfaces.mcpNames) expect(tools.map(candidate => candidate.mcp.name)).not.toContain(name);
      for (const command of tool.removedInterfaces.cliCommands) expect(cliTools.map(candidate => candidate.cli.command)).not.toContain(command);
    }
    expect(toolCatalog.subtract.cli).toBeNull();
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
