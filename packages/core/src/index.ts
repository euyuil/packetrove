import ipaddr from 'ipaddr.js';
import {
  CidrCoverRequestSchema,
  ErrorResponseSchema, PublicIpResultSchema, type PublicIpResult,
  type CidrCoverResult, type ErrorCode, type ErrorResponse, type InputIssue,
} from '@packetrove/contracts';

export class ToolError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly issues?: InputIssue[],
  ) {
    super(message);
    this.name = 'ToolError';
  }

  toResponse(): ErrorResponse {
    return { error: {
      code: this.code, message: this.message,
      ...(this.issues ? { issues: this.issues } : {}),
    } };
  }
}

type Family = CidrCoverResult['family'];
type Interval = { first: bigint; last: bigint };
type ParsedInput = Interval & { family: Family; width: number; cidr: string };

function formatAddress(value: bigint, family: Family): string {
  const byteCount = family === 'ipv4' ? 4 : 16;
  const bytes = new Array<number>(byteCount);
  for (let index = byteCount - 1; index >= 0; index--) {
    bytes[index] = Number(value & 255n);
    value >>= 8n;
  }
  const address = ipaddr.fromByteArray(bytes);
  return address.kind() === 'ipv4'
    ? address.toString()
    : (address as ipaddr.IPv6).toRFC5952String();
}

function parseInput(input: string, index: number): ParsedInput {
  const fail = () => new ToolError('INVALID_INPUT', 'Expected valid IP addresses or CIDRs.', [
    { index, message: 'Use a standard IPv4 or IPv6 address with an optional valid CIDR prefix. Zone identifiers and IPv4 leading zeros are not supported.' },
  ]);
  const entry = input.trim();
  const parts = entry.split('/');
  const text = parts[0]!;
  if (!text || parts.length > 2 || text.includes('%')) throw fail();
  // Embedded IPv4 addresses follow the same strict decimal-octet rules.
  if (text.includes('.')) {
    const dotted = text.slice(text.lastIndexOf(':') + 1);
    if (!/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(dotted)) throw fail();
  }
  if (!text.includes(':') && !text.includes('.')) throw fail();
  let address: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    // ipaddr.js rewrites ::d.d.d.d to ::ffff:d.d.d.d. Expand only this
    // spelling so parsing preserves the original 128-bit address instead.
    const addressText = /^::\d+\./.test(text) ? `0:0:0:0:0:0:${text.slice(2)}` : text;
    address = ipaddr.parse(addressText);
  } catch {
    throw fail();
  }
  const family = address.kind();
  const width = family === 'ipv4' ? 32 : 128;
  const prefixText = parts[1];
  if (prefixText !== undefined && !/^(0|[1-9]\d*)$/.test(prefixText)) throw fail();
  const prefix = prefixText === undefined ? width : Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > width) throw fail();
  const value = address.toByteArray().reduce((sum, byte) => (sum << 8n) | BigInt(byte), 0n);
  const hostBits = BigInt(width - prefix);
  const first = (value >> hostBits) << hostBits;
  const last = first + (1n << hostBits) - 1n;
  return { first, last, family, width, cidr: `${formatAddress(first, family)}/${prefix}` };
}

function unionAddressCount(intervals: Interval[]): bigint {
  const sorted = [...intervals].sort((left, right) =>
    left.first < right.first ? -1 : left.first > right.first ? 1 : 0);
  let { first, last } = sorted[0]!;
  let total = 0n;
  for (const next of sorted.slice(1)) {
    if (next.first <= last + 1n) {
      if (next.last > last) last = next.last;
    } else {
      total += last - first + 1n;
      ({ first, last } = next);
    }
  }
  return total + last - first + 1n;
}

/** Calculate a single enclosing CIDR without enumerating addresses. */
export function smallestCoveringCidr(value: unknown): CidrCoverResult {
  const request = CidrCoverRequestSchema.safeParse(value);
  if (!request.success) {
    throw new ToolError('INVALID_INPUT', 'Invalid calculation input.', request.error.issues.map(issue => {
      const index = issue.path[0] === 'inputs' && typeof issue.path[1] === 'number' ? issue.path[1] : undefined;
      return { ...(index === undefined ? {} : { index }), message: issue.message };
    }));
  }
  const parsed: ParsedInput[] = [];
  const issues: InputIssue[] = [];
  for (const [index, input] of request.data.inputs.entries()) {
    try {
      parsed.push(parseInput(input, index));
    } catch (error) {
      if (!(error instanceof ToolError) || error.code !== 'INVALID_INPUT' || !error.issues?.length) throw error;
      issues.push(...error.issues);
    }
  }
  if (issues.length) {
    throw new ToolError('INVALID_INPUT', 'Expected valid IP addresses or CIDRs.', issues);
  }
  const { family, width } = parsed[0]!;
  const differentFamily = parsed.findIndex(entry => entry.family !== family);
  if (differentFamily !== -1) {
    throw new ToolError('MIXED_ADDRESS_FAMILIES', 'Use either IPv4 or IPv6 throughout one calculation.', [
      { index: differentFamily, message: `Expected ${family === 'ipv4' ? 'IPv4' : 'IPv6'} to match the first input.` },
    ]);
  }
  let minimum = parsed[0]!.first;
  let maximum = parsed[0]!.last;
  for (const entry of parsed) {
    if (entry.first < minimum) minimum = entry.first;
    if (entry.last > maximum) maximum = entry.last;
  }
  let differingBits = minimum ^ maximum;
  let hostBits = 0;
  while (differingBits !== 0n) {
    hostBits++;
    differingBits >>= 1n;
  }
  const first = (minimum >> BigInt(hostBits)) << BigInt(hostBits);
  const covered = 1n << BigInt(hostBits);
  const last = first + covered - 1n;
  const original = unionAddressCount(parsed);
  return {
    family,
    normalizedInputs: parsed.map(entry => entry.cidr),
    cidr: `${formatAddress(first, family)}/${width - hostBits}`,
    range: { first: formatAddress(first, family), last: formatAddress(last, family) },
    inputAddressCount: original.toString(),
    coveredAddressCount: covered.toString(),
    additionalAddressCount: (covered - original).toString(),
  };
}

/** Query an IP endpoint without persisting its per-request result. */
export async function lookupPublicIp(endpoint: string | URL, signal?: AbortSignal): Promise<PublicIpResult> {
  let response: Response;
  let text: string;
  try {
    const options = {
      headers: { accept: 'application/json' },
      cache: 'no-store', credentials: 'omit', redirect: 'error',
      signal: AbortSignal.any([AbortSignal.timeout(10_000), ...(signal ? [signal] : [])]),
    } as const;
    response = await fetch(endpoint, options);
    text = await response.text();
  } catch {
    throw new ToolError('NETWORK_ERROR', 'Unable to reach the IP lookup service. Check your connection and try again.');
  }
  let body: unknown;
  try { body = JSON.parse(text) as unknown; } catch {
    throw new ToolError('INVALID_RESPONSE', 'The IP lookup service returned an invalid response. Please try again.');
  }
  if (!response.ok) {
    const failure = ErrorResponseSchema.safeParse(body);
    if (failure.success) throw new ToolError(failure.data.error.code, failure.data.error.message);
    throw new ToolError('NETWORK_ERROR', `The IP lookup service returned HTTP ${response.status}. Please try again.`);
  }
  const result = PublicIpResultSchema.safeParse(body);
  if (!result.success) {
    throw new ToolError('INVALID_RESPONSE', 'The IP lookup service returned an invalid response. Please try again.');
  }
  return result.data;
}
