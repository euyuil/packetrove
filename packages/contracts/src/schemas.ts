import { z } from 'zod';

export const MAX_INPUTS = 1_000;
export const MAX_INPUT_LENGTH = 64;
export const MAX_SUBTRACTION_INPUTS = 1_000;
export const MAX_SUBTRACTION_OUTPUTS = 10_000;
export const MAX_REQUEST_BYTES = 64 * 1_024;

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

export const RangeToCidrsRequestSchema = z.strictObject({
  start: z.string().min(1).max(MAX_INPUT_LENGTH)
    .describe('Inclusive start IP address. Use IPv4 or IPv6 without a CIDR prefix; surrounding whitespace is ignored.'),
  end: z.string().min(1).max(MAX_INPUT_LENGTH)
    .describe('Inclusive end IP address, in the same family and at or after start. Endpoints are never silently swapped.'),
});

export const RangeToCidrsResultSchema = z.strictObject({
  family: z.enum(['ipv4', 'ipv6']),
  range: z.strictObject({ first: z.string(), last: z.string() })
    .describe('Canonical inclusive start and end IP addresses.'),
  cidrs: z.array(z.string().min(1).max(MAX_INPUT_LENGTH)).min(1).max(254)
    .describe('Complete minimal CIDR list, sorted by network address, with no gaps, overlaps, or additional addresses.'),
  cidrCount: z.number().int().min(1).max(254),
  addressCount: AddressCountSchema,
});

export type RangeToCidrsRequest = z.infer<typeof RangeToCidrsRequestSchema>;
export type RangeToCidrsResult = z.infer<typeof RangeToCidrsResultSchema>;

export const CidrSubtractRequestSchema = z.strictObject({
  include: z.array(z.string().min(1).max(MAX_INPUT_LENGTH))
    .min(1, 'Include at least one IP address or CIDR range.').max(MAX_SUBTRACTION_INPUTS)
    .describe(`The nonempty included address space. Use at most ${MAX_SUBTRACTION_INPUTS.toLocaleString('en')} entries across include and exclude, from one address family.`),
  exclude: z.array(z.string().min(1).max(MAX_INPUT_LENGTH)).max(MAX_SUBTRACTION_INPUTS)
    .describe('Ranges to remove from the included address space. An empty array simplifies the exact include union.'),
});

export const CidrSubtractResultSchema = z.strictObject({
  family: z.enum(['ipv4', 'ipv6']),
  normalizedInclude: z.array(z.string().min(1).max(MAX_INPUT_LENGTH)).min(1).max(MAX_SUBTRACTION_INPUTS),
  normalizedExclude: z.array(z.string().min(1).max(MAX_INPUT_LENGTH)).max(MAX_SUBTRACTION_INPUTS),
  cidrs: z.array(z.string().min(1).max(MAX_INPUT_LENGTH)).max(MAX_SUBTRACTION_OUTPUTS),
  includedAddressCount: AddressCountSchema,
  removedAddressCount: AddressCountSchema,
  remainingAddressCount: AddressCountSchema,
});

export type CidrSubtractRequest = z.infer<typeof CidrSubtractRequestSchema>;
export type CidrSubtractResult = z.infer<typeof CidrSubtractResultSchema>;

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
        .describe('Zero-based index in inputs, or in the identified include/exclude list.'),
      list: z.string().min(1).optional()
        .describe('The input list containing the invalid entry. Existing subtraction errors use include or exclude.'),
      field: z.string().min(1).optional()
        .describe('The input field containing the invalid value. Existing range errors use start or end.'),
      path: z.array(z.union([z.string().min(1), z.number().int().nonnegative()])).optional()
        .describe('Input field names and zero-based array indices, from the request root. An empty path identifies the whole request. Takes precedence over legacy field, list, and index locations.'),
      message: z.string(),
      location: z.strictObject({
        line: z.number().int().min(1), offset: z.number().int().nonnegative(), end: z.number().int().nonnegative(),
      }).optional().describe('Original text location: one-based line and zero-based UTF-16 start/end offsets. Certificate PEM errors use this to identify rejected material without echoing it.'),
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

export const CIDR_SUBTRACT_EXAMPLES: Array<{
  name: string;
  request: CidrSubtractRequest;
  result: CidrSubtractResult;
}> = [
  {
    name: 'IPv4',
    request: { include: ['203.0.113.0/24'], exclude: ['203.0.113.64/26'] },
    result: {
      family: 'ipv4', normalizedInclude: ['203.0.113.0/24'], normalizedExclude: ['203.0.113.64/26'],
      cidrs: ['203.0.113.0/26', '203.0.113.128/25'],
      includedAddressCount: '256', removedAddressCount: '64', remainingAddressCount: '192',
    },
  },
  {
    name: 'IPv6',
    request: { include: ['2001:db8::/124'], exclude: ['2001:db8::4/126'] },
    result: {
      family: 'ipv6', normalizedInclude: ['2001:db8::/124'], normalizedExclude: ['2001:db8::4/126'],
      cidrs: ['2001:db8::/126', '2001:db8::8/125'],
      includedAddressCount: '16', removedAddressCount: '4', remainingAddressCount: '12',
    },
  },
];

export const PUBLIC_IP_EXAMPLES = [
  { name: 'IPv4', request: {}, result: { ip: '203.0.113.1', family: 'ipv4' } },
  { name: 'IPv6', request: {}, result: { ip: '2001:db8::1', family: 'ipv6' } },
] satisfies Array<{ name: string; request: z.infer<typeof PublicIpRequestSchema>; result: PublicIpResult }>;

export const RANGE_TO_CIDRS_EXAMPLES: Array<{
  name: string; request: RangeToCidrsRequest; result: RangeToCidrsResult;
}> = [
  {
    name: 'IPv4', request: { start: '203.0.113.11', end: '203.0.113.23' },
    result: {
      family: 'ipv4', range: { first: '203.0.113.11', last: '203.0.113.23' },
      cidrs: ['203.0.113.11/32', '203.0.113.12/30', '203.0.113.16/29'],
      cidrCount: 3, addressCount: '13',
    },
  },
  {
    name: 'IPv6', request: { start: '2001:db8::b', end: '2001:db8::17' },
    result: {
      family: 'ipv6', range: { first: '2001:db8::b', last: '2001:db8::17' },
      cidrs: ['2001:db8::b/128', '2001:db8::c/126', '2001:db8::10/125'],
      cidrCount: 3, addressCount: '13',
    },
  },
];
