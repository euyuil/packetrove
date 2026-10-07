import { describe, expect, it } from 'vitest';
import { createOpenApiDocument } from './openapi';
import { cliTools, legacyToolPagePaths, PUBLIC_WEBSITE_ORIGIN, toolCatalog, tools, mcpOperations, supportOperations } from './index';

describe('shared tool catalog contracts', () => {
  it('separates cataloged support operations from every product interface', () => {
    expect(new Set(mcpOperations.map(operation => operation.id)).size).toBe(mcpOperations.length);
    expect(mcpOperations.filter(operation => operation.kind === 'product')).toEqual(tools);
    for (const operation of supportOperations) {
      expect(operation.mcp.name).toBe(operation.id);
      expect(operation.id).toMatch(/^[a-z]{4,}(?:-[a-z0-9]+)*$/);
      expect(operation).not.toHaveProperty('webPath');
      expect(operation).not.toHaveProperty('api');
      expect(operation).not.toHaveProperty('cli');
      expect(operation.mcp.annotations).toEqual({ readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true });
      for (const example of operation.examples) {
        expect(operation.inputSchema.safeParse(example.request).success).toBe(true);
        expect(operation.outputSchema.safeParse(example.result).success).toBe(true);
      }
    }
  });
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
  it.each(tools)('links $id results to its canonical English tool page with no payload', tool => {
    const link = tool.mcp.resultLink;
    expect(link).toMatchObject({
      type: 'resource_link', name: tool.id, title: tool.title, mimeType: 'text/html',
    });
    expect(link.description.length).toBeGreaterThan(0);
    const uri = new URL(link.uri);
    expect(uri.protocol).toBe('https:');
    expect(uri.origin).toBe(PUBLIC_WEBSITE_ORIGIN);
    expect(uri.pathname).toBe(tool.webPath);
    expect(uri.search).toBe('');
    expect(uri.hash).toBe('');
    expect(uri.username).toBe('');
    expect(uri.password).toBe('');
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
