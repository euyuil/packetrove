import { z } from 'zod';

export const MCP_REGISTRY_SERVER_NAME = 'io.github.euyuil/packetrove';
export const MCP_REGISTRY_SCHEMA_URL = 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json';

const httpsUrl = z.url({ protocol: /^https$/ });

// Packetrove's remote-only subset of the official schema, checked without network access.
// The publisher's separate validation also checks the Registry's current semantic rules.
export const McpRegistryManifestSchema = z.strictObject({
  $schema: z.literal(MCP_REGISTRY_SCHEMA_URL),
  name: z.literal(MCP_REGISTRY_SERVER_NAME),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(100),
  version: z.string().min(1).max(255),
  repository: z.strictObject({ url: httpsUrl, source: z.literal('github') }),
  websiteUrl: httpsUrl,
  icons: z.array(z.strictObject({
    src: httpsUrl.max(255),
    mimeType: z.enum(['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']).optional(),
    sizes: z.array(z.string().regex(/^(\d+x\d+|any)$/)).optional(),
    theme: z.enum(['light', 'dark']).optional(),
  })).min(1),
  remotes: z.tuple([z.strictObject({ type: z.literal('streamable-http'), url: httpsUrl })]),
});
