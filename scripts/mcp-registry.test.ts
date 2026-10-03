import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PACKETROVE_IDENTITY, PACKETROVE_VERSION } from '../packages/contracts/src/index';
import { McpRegistryManifestSchema } from '../packages/contracts/src/registry';
import { createMcpRegistryJson, createMcpRegistryManifest } from './mcp-registry-manifest';

afterEach(() => vi.unstubAllGlobals());

describe('MCP Registry manifest', () => {
  it('checks the committed manifest offline against shared identity and the product version', () => {
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Manifest generation must be offline.'); }));
    expect(createMcpRegistryJson()).toBe(readFileSync('server.json', 'utf8'));
    expect(createMcpRegistryManifest()).toMatchObject({
      name: 'io.github.euyuil/packetrove', version: PACKETROVE_VERSION,
      title: PACKETROVE_IDENTITY.title, description: PACKETROVE_IDENTITY.description,
      websiteUrl: PACKETROVE_IDENTITY.websiteUrl, icons: PACKETROVE_IDENTITY.icons,
      repository: { url: 'https://github.com/euyuil/packetrove', source: 'github' },
      remotes: [{ type: 'streamable-http', url: 'https://api.packetrove.com/mcp' }],
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['0.3.0', '0.3.1', '1.0.0'])('generates candidate formal release %s without changing identity', version => {
    expect(createMcpRegistryManifest(version)).toEqual({ ...createMcpRegistryManifest(), version });
  });
  it.each(['0.3.0-registry.1', '0.3.0+metadata', 'v0.3.0', 'latest', '01.3.0'])('rejects non-product version %s', version => {
    expect(() => createMcpRegistryManifest(version)).toThrow('stable Packetrove release tag');
  });
  it.each([
    { packages: [{ identifier: '@packetrove/cli' }] },
    { description: 'x'.repeat(101) },
    { title: '' },
    { name: 'io.github.other/packetrove' },
    { $schema: 'https://example.com/obsolete.schema.json' },
    { websiteUrl: 'http://example.com' },
    { icons: [{ src: 'data:image/png;base64,example' }] },
    { icons: [{ src: 'https://example.com/icon.png', sizes: ['small'] }] },
    { remotes: [{ type: 'sse', url: 'https://example.com/mcp' }] },
    { remotes: [{ type: 'streamable-http', url: 'https://example.com/mcp', headers: [] }] },
    { remotes: [{ type: 'streamable-http', url: 'https://example.com/{tenant}/mcp', variables: {} }] },
    { remotes: [] },
  ])('rejects metadata outside the anonymous remote-only manifest subset: %j', override => {
    expect(McpRegistryManifestSchema.safeParse({ ...createMcpRegistryManifest(), ...override }).success).toBe(false);
  });
});
