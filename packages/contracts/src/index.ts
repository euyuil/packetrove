import manifest from '../package.json' with { type: 'json' };
import { toolCatalog } from './tools';

export * from './schemas';
export * from './tools';
export * from './identity';
export * from './input-issues';
export * from './certificate-bundle';

export const PACKETROVE_VERSION = manifest.version;
export const MCP_PATH = '/mcp';
export const PUBLIC_API_ORIGIN = 'https://api.packetrove.com';

// Preserve the existing exports while deriving interface names from the catalog.
export const CIDR_COVER_PATH = toolCatalog.cidr.api.path;
export const CIDR_SUBTRACT_PATH = toolCatalog.subtract.api.path;
export const MCP_TOOL_NAME = toolCatalog.cidr.mcp.name;
export const CIDR_SUBTRACT_TOOL_NAME = toolCatalog.subtract.mcp.name;
export const PUBLIC_IP_NAME = toolCatalog.ip.id;
export const PUBLIC_IP_PATH = toolCatalog.ip.api.path;
export const PUBLIC_IP_TOOL_NAME = toolCatalog.ip.mcp.name;
