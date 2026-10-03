import type { z } from 'zod';
import { PUBLIC_WEBSITE_ORIGIN } from './identity';
import {
  CIDR_COVER_EXAMPLES, CIDR_SUBTRACT_EXAMPLES, PUBLIC_IP_EXAMPLES,
  CidrCoverRequestSchema, CidrCoverResultSchema, CidrSubtractRequestSchema, CidrSubtractResultSchema,
  PublicIpRequestSchema, PublicIpResultSchema,
  RangeToCidrsRequestSchema, RangeToCidrsResultSchema, RANGE_TO_CIDRS_EXAMPLES,
  MAX_INPUTS, MAX_INPUT_LENGTH, MAX_SUBTRACTION_INPUTS, MAX_SUBTRACTION_OUTPUTS, MAX_REQUEST_BYTES,
} from './schemas';

export type ApiResponseDefinition = {
  description: string;
  headers?: Readonly<Record<string, { description: string; value: string }>>;
  text?: { description: string; format: (result: unknown) => string };
};

type ToolDefinition = {
  id: string;
  page: string;
  webPath?: never;
  legacyWebPaths: readonly `/${string}`[];
  removedInterfaces: {
    apiPaths: readonly string[];
    mcpNames: readonly string[];
    cliCommands: readonly string[];
  };
  cli: boolean;
  title: string;
  execution: 'local' | 'connection';
  schemaName: string;
  inputSchema: z.ZodType;
  outputSchema: z.ZodType;
  examples: ReadonlyArray<{ name: string; request: unknown; result: unknown }>;
  example: { name: string; request: unknown; result: unknown };
  api: {
    method: 'post' | 'get'; path?: never; operationId?: never;
    tag: string; tagDescription: string; summary: string; description: string;
    response: ApiResponseDefinition;
    errors: Readonly<Record<number, string>>;
  };
  mcp: {
    name?: never;
    description: string;
    resultLinkDescription: string;
    annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean };
  };
};

/** Declare one public name and derive every interface identifier from it. */
function defineTool<const Definition extends ToolDefinition>(definition: Definition) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(definition.id)
    || definition.id.split('-')[0]!.length < 4 || definition.id.length > 64) {
    throw new Error('Tool names must use lowercase words separated by hyphens, start with at least four characters, and contain at most 64 characters.');
  }
  const { cli, api, mcp, ...metadata } = definition;
  const { resultLinkDescription, ...mcpMetadata } = mcp;
  const id = definition.id as Definition['id'];
  const webPath = `/${id}` as `/${Definition['id']}`;
  return {
    ...metadata,
    webPath,
    api: { ...api, response: api.response as ApiResponseDefinition,
      path: `/v1/${id}` as `/v1/${Definition['id']}`, operationId: id },
    mcp: { ...mcpMetadata, name: id, resultLink: {
      type: 'resource_link' as const, uri: `${PUBLIC_WEBSITE_ORIGIN}${webPath}`,
      name: id, title: definition.title, description: resultLinkDescription, mimeType: 'text/html',
    } },
    cli: (cli ? { command: id } : null) as Definition['cli'] extends true
      ? { command: Definition['id'] } : null,
  };
}

export const toolCatalog = {
  cidr: defineTool({
    id: 'cidr-cover', page: 'cidr', title: 'Smallest Covering CIDR', execution: 'local',
    legacyWebPaths: ['/cidr'], cli: true,
    removedInterfaces: { apiPaths: ['/v1/cidr/cover'], mcpNames: ['smallest_covering_cidr'], cliCommands: ['cidr cover'] },
    schemaName: 'CidrCover', inputSchema: CidrCoverRequestSchema, outputSchema: CidrCoverResultSchema,
    examples: CIDR_COVER_EXAMPLES, example: CIDR_COVER_EXAMPLES[1]!,
    api: {
      method: 'post', tag: 'CIDR', tagDescription: 'IP address and CIDR calculations.',
      response: { description: 'The calculated result and exact address counts.' },
      errors: { 400: 'Invalid JSON, invalid input, or mixed address families. Input issues include a zero-based index.' },
      summary: 'Find the smallest single CIDR covering all inputs',
      description: `Accepts IPv4 or IPv6 addresses and CIDRs from one address family. The output maximizes the prefix length while covering every input address, and may include additional addresses. Overlapping inputs are counted once. CIDRs with host bits are normalized. The request body must not exceed ${MAX_REQUEST_BYTES} bytes. This is a stateless calculation and does not modify firewall rules.`,
    },
    mcp: {
      resultLinkDescription: 'Browser calculator and explanation of additional address coverage. Opens without your MCP inputs or result.',
      description: `Use when combining a selected group of firewall allowlist or blocklist entries into one smallest covering CIDR, or when checking the exact extra coverage. Accept 1 to ${MAX_INPUTS.toLocaleString('en')} IP addresses or CIDRs from one address family, up to ${MAX_INPUT_LENGTH} characters each; normalize host bits and count overlaps once. Return the canonical CIDR, inclusive range, and exact decimal-string counts, including additionalAddressCount. The range may allow or block additional addresses. This computes one CIDR for the supplied inputs; it does not optimize an entire list against an entry limit or change firewall rules. Remote MCP calls submit inputs to this server; the calculation makes no outbound network requests.`,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
  }),
  subtract: defineTool({
    id: 'cidr-subtract', page: 'subtract', title: 'CIDR Subtraction', execution: 'local',
    legacyWebPaths: ['/cidr/subtract'], cli: false,
    removedInterfaces: { apiPaths: ['/v1/cidr/subtract'], mcpNames: ['subtract_cidrs'], cliCommands: [] },
    schemaName: 'CidrSubtract', inputSchema: CidrSubtractRequestSchema, outputSchema: CidrSubtractResultSchema,
    examples: CIDR_SUBTRACT_EXAMPLES, example: CIDR_SUBTRACT_EXAMPLES[0]!,
    api: {
      method: 'post', tag: 'CIDR', tagDescription: 'IP address and CIDR calculations.',
      response: { description: 'The calculated result and exact address counts.' },
      errors: { 400: 'Invalid JSON, invalid input, mixed address families, or output limit exceeded. Entry issues include a zero-based index and identify the include/exclude list.' },
      summary: 'Subtract excluded networks from included address space exactly',
      description: `Return the minimal sorted canonical CIDR list for union(include) minus union(exclude), without adding addresses. Use one address family and at most ${MAX_SUBTRACTION_INPUTS} entries across both lists, with at most ${MAX_INPUT_LENGTH} characters per entry. Include must be nonempty; exclude may be empty. Overlaps count once and host bits are normalized. Results include exact decimal-string counts; complete removal succeeds with an empty list. Results exceeding ${MAX_SUBTRACTION_OUTPUTS} CIDRs fail without returning a partial list. The request body must not exceed ${MAX_REQUEST_BYTES} bytes. Calls send inputs to the server; no firewall or WireGuard configuration is changed and remaining ranges do not prove live availability.`,
    },
    mcp: {
      resultLinkDescription: 'Browser calculator for exact CIDR subtraction and its limits. Opens without your MCP inputs or result.',
      description: `Use to prepare WireGuard AllowedIPs exceptions or calculate remaining address space relative to supplied include and exclude lists. Compute union(include) minus union(exclude) as a minimal sorted canonical CIDR list, without adding addresses. Use one address family, a nonempty include list, and at most ${MAX_SUBTRACTION_INPUTS} entries across both lists, up to ${MAX_INPUT_LENGTH} characters each. Exclude may be empty. Normalize host bits and count overlaps once. Return cidrs, normalizedInclude, normalizedExclude, and exact decimal-string includedAddressCount, removedAddressCount, remainingAddressCount. Complete removal returns an empty list; more than ${MAX_SUBTRACTION_OUTPUTS} output CIDRs returns an error without a partial result. Error issues identify include or exclude and the zero-based entry index. Remote calls submit inputs to this server; the browser calculates locally. This does not inspect live allocation, configure WireGuard, or change firewall rules.`,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
  }),
  range: defineTool({
    id: 'range-to-cidrs', page: 'range', title: 'IP Range to CIDRs', execution: 'local',
    legacyWebPaths: [], cli: false,
    removedInterfaces: { apiPaths: [], mcpNames: [], cliCommands: [] },
    schemaName: 'RangeToCidrs', inputSchema: RangeToCidrsRequestSchema, outputSchema: RangeToCidrsResultSchema,
    examples: RANGE_TO_CIDRS_EXAMPLES, example: RANGE_TO_CIDRS_EXAMPLES[0]!,
    api: {
      method: 'post', tag: 'CIDR', tagDescription: 'IP address and CIDR calculations.',
      response: { description: 'The calculated result and exact address counts.' },
      errors: { 400: 'Invalid JSON, invalid endpoints, mixed address families, or reversed range. Issues identify the start or end field.' },
      summary: 'Convert an inclusive IP range to its minimal exact CIDR list',
      description: `Accept exactly one start and one end IP address of the same family, without CIDR prefixes, at most ${MAX_INPUT_LENGTH} characters each. Both endpoints are inclusive; end must be at or after start and endpoints are never swapped. Return canonical endpoints and the minimal sorted non-overlapping CIDR list covering exactly that range, with cidrCount and an exact decimal-string addressCount. Every address counts, including IPv4 network and broadcast addresses. Calculations do not enumerate addresses. The request body must not exceed ${MAX_REQUEST_BYTES} bytes. Calls submit inputs to the server; no live allocation or firewall configuration is inspected or changed.`,
    },
    mcp: {
      resultLinkDescription: 'Browser calculator for exact inclusive IP range conversion and its limits. Opens without your MCP inputs or result.',
      description: `Use to prepare an exact CIDR allowlist from one inclusive start/end IPv4 or IPv6 range. Pass start and end IP addresses of the same family, without CIDR prefixes, at most ${MAX_INPUT_LENGTH} characters each; end must be at or after start. Return canonical range.first and range.last, minimal sorted cidrs, cidrCount, and exact decimal-string addressCount, without adding addresses. Equal endpoints return one /32 or /128; complete address spaces return /0. Invalid inputs identify the start or end field; reversed endpoints are never swapped. Browser calculations stay local; remote MCP calls submit endpoints to this server. This does not inspect live address usage, modify firewall rules, or export vendor-specific ACLs.`,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
  }),
  ip: defineTool({
    id: 'public-ip', page: 'ip', title: 'Current Public IP', execution: 'connection',
    legacyWebPaths: ['/ip'], cli: true,
    removedInterfaces: { apiPaths: ['/v1/ip'], mcpNames: ['get_public_ip'], cliCommands: ['ip'] },
    schemaName: 'PublicIp', inputSchema: PublicIpRequestSchema, outputSchema: PublicIpResultSchema,
    examples: PUBLIC_IP_EXAMPLES, example: PUBLIC_IP_EXAMPLES[0]!,
    api: {
      method: 'get', tag: 'IP', tagDescription: 'Request-based IP address diagnostics.',
      response: {
        description: 'The observed address as JSON with its address family, or as plain text when requested.',
        headers: {
          'Cache-Control': { description: 'Do not store this per-request result.', value: 'no-store' },
          Vary: { description: 'The response format depends on the Accept header.', value: 'Accept' },
        },
        text: { description: 'One IPv4 or IPv6 address followed by a newline.',
          format: result => PublicIpResultSchema.parse(result).ip + '\n' },
      },
      errors: { 503: 'CLIENT_IP_UNAVAILABLE: edge connection information is missing or invalid. No guessed or caller-supplied forwarded address is returned.' },
      summary: 'Get the IP address observed for the current request',
      description: 'Returns one IPv4 or IPv6 address from the current connection to Packetrove. Request Accept: text/plain for the address followed by a newline; JSON is the default. Errors remain structured JSON in either format. With a VPN or proxy this is its exit address. A hosted caller observes its own connection, not a user device behind it. It does not discover local addresses or separately probe both address families. The Cloudflare deployment reads edge-provided connection headers, including preserved IPv6 when Pseudo IPv4 overwrites headers. Results and errors are not cached; the application does not store or log the returned IP address.',
    },
    mcp: {
      resultLinkDescription: 'Checks a new connection from your browser, which may differ from the MCP caller connection.',
      description: 'Use to inspect the public IPv4 or IPv6 address observed for the connection making this MCP tool call. Takes an empty object and returns ip and family. This is the MCP client connection: a hosted AI client may observe its own exit address, not the user device address. If the user needs their browser or computer connection, direct them to the web tool or a CLI running on that machine. A VPN or proxy changes the observed path. One call observes one address family; it does not discover private local addresses, an address before a proxy, or both address families. The application does not store or log results, and no firewall rules are changed. Cloudflare Worker subrequests can have platform-specific address semantics; the result is not an identity proof.',
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
  }),
} as const;

export type ToolPage = keyof typeof toolCatalog;
export type ToolApiDefinition = Pick<ToolDefinition, 'schemaName' | 'inputSchema' | 'outputSchema' | 'examples' | 'example'> & {
  api: Omit<ToolDefinition['api'], 'path' | 'operationId'> & { path: string; operationId: string };
};
export type ToolId = (typeof toolCatalog)[ToolPage]['id'];
export const tools = Object.values(toolCatalog);
export type CliToolPage = {
  [Page in ToolPage]: (typeof toolCatalog)[Page]['cli'] extends null ? never : Page;
}[ToolPage];
export const cliTools = tools.filter((tool): tool is (typeof toolCatalog)[CliToolPage] => tool.cli !== null);
export const legacyToolPagePaths: Readonly<Record<string, string>> = Object.fromEntries(
  tools.flatMap(tool => tool.legacyWebPaths.map(path => [path, tool.webPath])),
);
export function isToolPage(page: string): page is ToolPage {
  return Object.hasOwn(toolCatalog, page);
}
export const toolPagePaths = Object.fromEntries(tools.map(tool => [tool.page, tool.webPath])) as {
  readonly [Page in ToolPage]: (typeof toolCatalog)[Page]['webPath'];
};
