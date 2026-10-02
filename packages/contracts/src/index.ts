import { z } from 'zod';

export const MAX_INPUTS = 1_000;
export const MAX_INPUT_LENGTH = 64;
export const MAX_REQUEST_BYTES = 64 * 1_024;
export const CIDR_COVER_PATH = '/v1/cidr/cover';
export const MCP_TOOL_NAME = 'smallest_covering_cidr';
export const MCP_PATH = '/mcp';
export const PUBLIC_IP_NAME = 'public-ip';
export const PUBLIC_IP_PATH = `/v1/${PUBLIC_IP_NAME}`;
export const PUBLIC_IP_TOOL_NAME = PUBLIC_IP_NAME;
export const PUBLIC_API_ORIGIN = 'https://api.packetrove.com';

export const PublicIpRequestSchema = z.strictObject({});
export const PublicIpResultSchema = z.discriminatedUnion('family', [
  z.strictObject({ family: z.literal('ipv4'), ip: z.ipv4() }),
  z.strictObject({ family: z.literal('ipv6'), ip: z.ipv6() }),
]).describe('The IP address observed for this request. A VPN, proxy, or hosted client can change whose exit address is observed. One request observes one address family.');
export type PublicIpResult = z.infer<typeof PublicIpResultSchema>;

export const CidrCoverRequestSchema = z.strictObject({
  inputs: z.array(z.string().min(1).max(MAX_INPUT_LENGTH))
    .min(1).max(MAX_INPUTS)
    .describe('IP addresses or CIDRs from one address family. Surrounding whitespace is ignored during parsing; CIDRs with host bits are normalized.'),
});

const AddressCountSchema = z.string().regex(/^(0|[1-9][0-9]*)$/)
  .describe('Exact number of addresses as a base-10 string, including network and broadcast addresses.');

export const CidrCoverResultSchema = z.strictObject({
  family: z.enum(['ipv4', 'ipv6']),
  normalizedInputs: z.array(z.string().min(1).max(MAX_INPUT_LENGTH)).min(1).max(MAX_INPUTS)
    .describe('Canonical CIDRs in input order. Individual addresses become /32 or /128. Duplicates are retained here.'),
  cidr: z.string().min(1).max(MAX_INPUT_LENGTH)
    .describe('The smallest single canonical CIDR containing every input address.'),
  range: z.strictObject({ first: z.string().min(1), last: z.string().min(1) }),
  inputAddressCount: AddressCountSchema.describe('Number of distinct addresses in the union of the inputs.'),
  coveredAddressCount: AddressCountSchema.describe('Number of all addresses in the resulting CIDR.'),
  additionalAddressCount: AddressCountSchema.describe('Covered address count minus input address count.'),
});

export const ErrorCodeSchema = z.enum([
  'INVALID_INPUT', 'MIXED_ADDRESS_FAMILIES', 'INVALID_JSON',
  'PAYLOAD_TOO_LARGE', 'UNSUPPORTED_MEDIA_TYPE', 'NOT_FOUND',
  'METHOD_NOT_ALLOWED', 'INTERNAL_ERROR', 'CLIENT_IP_UNAVAILABLE',
  'NETWORK_ERROR', 'INVALID_RESPONSE',
]);

export const ErrorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: ErrorCodeSchema,
    message: z.string(),
    issues: z.array(z.strictObject({
      index: z.number().int().nonnegative().optional()
        .describe('Zero-based index in the inputs array, when an entry is responsible for the error.'),
      message: z.string(),
    })).optional(),
  }),
});

export const HealthResultSchema = z.strictObject({ status: z.literal('ok') });

export type CidrCoverRequest = z.infer<typeof CidrCoverRequestSchema>;
export type CidrCoverResult = z.infer<typeof CidrCoverResultSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type InputIssue = NonNullable<ErrorResponse['error']['issues']>[number];

export const CIDR_COVER_EXAMPLES: Array<{
  name: string;
  request: CidrCoverRequest;
  result: CidrCoverResult;
}> = [
  {
    name: 'Adjacent IPv4 ranges without expansion',
    request: { inputs: ['203.0.113.0/25', '203.0.113.128/25'] },
    result: {
      family: 'ipv4', normalizedInputs: ['203.0.113.0/25', '203.0.113.128/25'],
      cidr: '203.0.113.0/24', range: { first: '203.0.113.0', last: '203.0.113.255' },
      inputAddressCount: '256', coveredAddressCount: '256', additionalAddressCount: '0',
    },
  },
  {
    name: 'Multiple IPv4 addresses with expansion',
    request: { inputs: ['203.0.113.1', '203.0.113.2', '203.0.113.6'] },
    result: {
      family: 'ipv4', normalizedInputs: ['203.0.113.1/32', '203.0.113.2/32', '203.0.113.6/32'],
      cidr: '203.0.113.0/29', range: { first: '203.0.113.0', last: '203.0.113.7' },
      inputAddressCount: '3', coveredAddressCount: '8', additionalAddressCount: '5',
    },
  },
  {
    name: 'IPv6 counts beyond the JavaScript safe integer range',
    request: { inputs: ['2001:db8::/64', '2001:db8:0:1::/64'] },
    result: {
      family: 'ipv6', normalizedInputs: ['2001:db8::/64', '2001:db8:0:1::/64'],
      cidr: '2001:db8::/63',
      range: { first: '2001:db8::', last: '2001:db8:0:1:ffff:ffff:ffff:ffff' },
      inputAddressCount: '36893488147419103232',
      coveredAddressCount: '36893488147419103232', additionalAddressCount: '0',
    },
  },
];
