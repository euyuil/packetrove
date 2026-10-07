import type { z } from 'zod';
import { createFeedbackRequestSchema, FEEDBACK_EXAMPLES, FeedbackReceiptSchema,
  MAX_FEEDBACK_SUMMARY, MAX_FEEDBACK_DESCRIPTION, MAX_FEEDBACK_REPRODUCTION,
  FEEDBACK_IP_LIMIT, FEEDBACK_DAILY_LIMIT } from './feedback';
import { PRIVACY_POLICY_URL, PUBLIC_WEBSITE_ORIGIN, SUPPORT_EMAIL, publicOrigin } from './identity';
import {
  CERTIFICATE_BUNDLE_EXAMPLES, CertificateBundleRequestSchema, CertificateBundleResultSchema,
  MAX_PEM_BYTES, MAX_CERTIFICATES,
} from './certificate-bundle';
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
function validateToolId(id: string) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)
    || id.split('-')[0]!.length < 4 || id.length > 64) {
    throw new Error('Tool names must use lowercase words separated by hyphens, start with at least four characters, and contain at most 64 characters.');
  }
}

function defineTool<const Definition extends ToolDefinition>(definition: Definition) {
  validateToolId(definition.id);
  const { cli, api, mcp, ...metadata } = definition;
  const { resultLinkDescription, ...mcpMetadata } = mcp;
  const id = definition.id as Definition['id'];
  const webPath = `/${id}` as `/${Definition['id']}`;
  return {
    kind: 'product' as const,
    ...metadata,
    webPath,
    api: { ...api, response: api.response as ApiResponseDefinition,
      path: `/v1/${id}` as `/v1/${Definition['id']}`, operationId: id },
    mcp: { ...mcpMetadata, description: `${mcp.description} Operational events record the tool name, success or error, a controlled error code, and a traffic source classification. Verified automated checks may also record an automation run identifier. Events exclude inputs, results, raw request headers, and automation tokens. Cloudflare may attach platform metadata. Privacy policy: ${PRIVACY_POLICY_URL}.`, name: id, resultLink: {
      type: 'resource_link' as const, uri: `${PUBLIC_WEBSITE_ORIGIN}${webPath}`,
      name: id, title: definition.title, description: resultLinkDescription, mimeType: 'text/html',
    } },
    cli: (cli ? { command: id } : null) as Definition['cli'] extends true
      ? { command: Definition['id'] } : null,
  };
}

const certificateFindingSemantics = 'Missing selected-leaf issuers and blocked requested hostname checks are warnings; other missing issuers are informational because roots are commonly omitted. All explicitly rejected supplied issuer candidates for the selected leaf produce an error. Unknown checks and key-identifier mismatches alone do not produce that error. A failed candidate does not invalidate another viable link. Verified self-issued CA key rollover is informational; verification with the certificate\'s own public key remains separate.';

const productCatalog = {
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
  certificate: defineTool({
    id: 'certificate-bundle', page: 'certificate', title: 'Certificate Bundle Checker', execution: 'local',
    legacyWebPaths: [], cli: false,
    removedInterfaces: { apiPaths: [], mcpNames: [], cliCommands: [] },
    schemaName: 'CertificateBundle', inputSchema: CertificateBundleRequestSchema, outputSchema: CertificateBundleResultSchema,
    examples: CERTIFICATE_BUNDLE_EXAMPLES, example: CERTIFICATE_BUNDLE_EXAMPLES[0]!,
    api: {
      method: 'post', tag: 'Certificates', tagDescription: 'Diagnostics for supplied public certificate bundles.',
      response: { description: 'Certificates in original order, independently checked candidate issuer links, leaf selection, and findings with evidence and next actions.',
        headers: { 'Cache-Control': { description: 'Do not store certificate inputs or results.', value: 'no-store' } } },
      errors: { 400: 'Invalid request, empty or malformed PEM/DER, rejected private-key or unsupported blocks, input limits, invalid hostname, or invalid leaf selection. PEM issues include original line and UTF-16 offsets without echoing input.' },
      summary: 'Inspect a PEM certificate bundle and optional DNS hostname',
      description: `Accept up to ${MAX_CERTIFICATES} CERTIFICATE blocks in at most ${MAX_PEM_BYTES} UTF-8 PEM bytes, with only whitespace between blocks. Private keys are rejected. Preserve original zero-based positions and verify candidate signatures separately from issuer CA and keyCertSign constraints. Distinguish failed, unsupported, and unavailable checks. ${certificateFindingSemantics} Multiple leaves require an explicit leafIndex for hostname checking. Check ASCII DNS SAN names, with a complete leftmost wildcard matching one label and no Common Name fallback. Evaluation uses the server clock; documentation examples use a fixed illustrative time. Remote calls transmit certificates and optional hostname to the server; inputs, results, and certificate details are excluded from application logs. No full RFC 5280 path validation, client trust, revocation checking, live probing, or proof of deployment safety. JSON transport bodies remain limited to ${MAX_REQUEST_BYTES} bytes.`,
    },
    mcp: {
      resultLinkDescription: 'Browser-local certificate bundle checker and its limits. Opens without the supplied certificates, hostname, or results.',
      description: `Use to inspect a supplied PEM certificate bundle before TLS configuration. Accept pem with 1–${MAX_CERTIFICATES} CERTIFICATE blocks and at most ${MAX_PEM_BYTES} UTF-8 bytes, optional ASCII DNS hostname, and optional zero-based leafIndex. Reject private keys and unsupported blocks without echoing them. Return original certificate positions, Subject, Issuer, Common Name, SANs, validity, CA and Key Usage flags, SHA-256 fingerprints, independently checked candidate links, explicit leaf ambiguity, and stable findings with severity, observed evidence, and nextAction. Verify signatures cryptographically; name matching alone is not verification. ${certificateFindingSemantics} Hostname checks use DNS SAN with one-label complete leftmost wildcards and no Common Name fallback. Results use this server's evaluation time and do not establish client trust, full RFC 5280 path validity, revocation status, or deployment safety. This remote call transmits certificates and hostname to the server; the website checks locally. Certificate input and details never enter application logs. Do not submit private keys.`,
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

function defineSupport<const Definition extends {
  id: string; title: string; inputSchema: z.ZodType; outputSchema: z.ZodType;
  examples: readonly { name: string; request: unknown; result: unknown }[];
  mcp: { description: string; annotations: ToolDefinition['mcp']['annotations'] };
}>(definition: Definition) {
  validateToolId(definition.id);
  return { ...definition, kind: 'support' as const,
    mcp: { ...definition.mcp, name: definition.id, description: `${definition.mcp.description} Privacy policy: ${PRIVACY_POLICY_URL}.` } };
}

/** One catalog owns product interfaces and explicitly scoped MCP support operations. */
export const operationCatalog = {
  ...productCatalog,
  feedback: defineSupport({
    id: 'submit-feedback', title: 'Submit Packetrove Feedback',
    inputSchema: createFeedbackRequestSchema(Object.values(productCatalog).map(tool => tool.id)),
    outputSchema: FeedbackReceiptSchema, examples: FEEDBACK_EXAMPLES,
    mcp: {
      description: [
        `Email one user-authorized, minimal Packetrove report to ${SUPPORT_EMAIL} for private human review. Available only when the operator enables feedback.`,
        'Draft locally without calling the service. If the user has already supplied or approved the report and requested sending it, submit directly; otherwise show the proposed report and obtain approval before sending. Never solicit feedback after every tool call.',
        'Send only the authorized fields, using synthetic reproduction data; never attach conversations, raw tool inputs/results, credentials, certificates, logs, or client/session identifiers.',
        `category is bug, confusing_behavior, or feature_request; tool_name optionally names a product tool. summary is required (${MAX_FEEDBACK_SUMMARY} Unicode code points); bug requires expected and actual, confusing_behavior requires actual and optionally expected (${MAX_FEEDBACK_DESCRIPTION} code points each). Feature requests allow expected but not actual or error_code.`,
        `Optional error_code starts with an uppercase ASCII letter and contains at most 64 uppercase letters, digits, or underscores; synthetic_reproduction is at most ${MAX_FEEDBACK_REPRODUCTION} code points. Unknown fields are rejected; serialized arguments must not exceed 8 KiB.`,
        'Status accepted and an opaque receipt_id mean the email service acknowledged submission, not inbox delivery or reading; acceptance does not promise a response or fix. This write is not idempotent: never automatically resend after timeout, disconnect, cancellation, or an uncertain result.',
        `Approximate limits target ${FEEDBACK_IP_LIMIT} submissions per observed exit IP in the preceding 24 hours and ${FEEDBACK_DAILY_LIMIT} submissions per UTC day across the service. Shared exits share quota. KV propagation and concurrent requests can exceed either limit; uncertain sends or failed quota releases occupy quota until expiry.`,
        'Cloudflare transmits approved reports by email; mailbox retention and deletion are managed manually by the maintainer, with no automatic report expiry. KV stores only separate keyed IP markers and reservation times, expiring after 24 hours, never report bodies or receipt links. Markers never appear in reports or application logs. Email deletion does not refund quota; request deletion with your receipt.',
        'Maintainers treat text as data and do not automatically execute, publish, or forward it. Operational events contain only the operation name, outcome, controlled error code, and existing traffic-source metadata; no report, receipt, IP digest, or exception details. Ordinary tools do not depend on feedback.',
      ].join(' '),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
  }),
} as const;
export const mcpOperations = Object.values(operationCatalog);
export type McpOperationId = (typeof mcpOperations)[number]['id'];
export const supportOperations = mcpOperations.filter(operation => operation.kind === 'support');
export const toolCatalog = Object.fromEntries(Object.entries(operationCatalog)
  .filter(([, operation]) => operation.kind === 'product')) as typeof productCatalog;
export const FeedbackRequestSchema = operationCatalog.feedback.inputSchema;

export type ToolPage = keyof typeof toolCatalog;
export type ToolApiDefinition = Pick<ToolDefinition, 'schemaName' | 'inputSchema' | 'outputSchema' | 'examples' | 'example'> & {
  api: Omit<ToolDefinition['api'], 'path' | 'operationId'> & { path: string; operationId: string };
};
export type ToolId = (typeof toolCatalog)[ToolPage]['id'];
export const tools = Object.values(toolCatalog);

export function getToolResultLink(tool: (typeof tools)[number], websiteOrigin = PUBLIC_WEBSITE_ORIGIN) {
  return { ...tool.mcp.resultLink, uri: new URL(tool.webPath, publicOrigin(websiteOrigin)).href };
}
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
