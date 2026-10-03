import { MCP_PATH, PACKETROVE_IDENTITY, PACKETROVE_VERSION, PUBLIC_API_ORIGIN } from '../packages/contracts/src/index';
import { MCP_REGISTRY_SCHEMA_URL, MCP_REGISTRY_SERVER_NAME, McpRegistryManifestSchema } from '../packages/contracts/src/registry';
import { releaseVersion } from './cli-release';

export function createMcpRegistryManifest(productVersion = PACKETROVE_VERSION) {
  return McpRegistryManifestSchema.parse({
    $schema: MCP_REGISTRY_SCHEMA_URL,
    name: MCP_REGISTRY_SERVER_NAME,
    title: PACKETROVE_IDENTITY.title,
    description: PACKETROVE_IDENTITY.description,
    version: releaseVersion(productVersion),
    repository: { url: 'https://github.com/euyuil/packetrove', source: 'github' },
    websiteUrl: PACKETROVE_IDENTITY.websiteUrl,
    icons: PACKETROVE_IDENTITY.icons,
    remotes: [{ type: 'streamable-http', url: new URL(MCP_PATH, PUBLIC_API_ORIGIN).href }],
  });
}

export function createMcpRegistryJson(productVersion?: string): string {
  return `${JSON.stringify(createMcpRegistryManifest(productVersion), null, 2)}\n`;
}
