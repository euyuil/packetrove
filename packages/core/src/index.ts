import {
  CidrCoverRequestSchema,
  ErrorResponseSchema, PublicIpResultSchema, type PublicIpResult,
  type CidrCoverResult, type InputIssue,
} from '@packetrove/contracts';
import { ToolError, type InputIssueDetail } from './errors';
import { formatAddress, parseInput, unionAddressCount, type ParsedInput } from './ip-range';
import { BodyLimitError, readBoundedText } from './bounded-text';

export { ToolError, type InputIssueDetail } from './errors';
export { BodyLimitError, readBoundedText } from './bounded-text';
export { subtractCidrs } from './subtract';
export { rangeToCidrs } from './range-to-cidrs';

// Public IP results and service errors are small; allow formatting headroom
// without accepting an unbounded response from a misconfigured endpoint.
export const MAX_PUBLIC_IP_RESPONSE_BYTES = 64 * 1_024;

/** Calculate a single enclosing CIDR without enumerating addresses. */
export function smallestCoveringCidr(value: unknown): CidrCoverResult {
  const request = CidrCoverRequestSchema.safeParse(value);
  if (!request.success) {
    throw new ToolError('INVALID_INPUT', 'Invalid calculation input.', request.error.issues.map(issue => {
      const index = issue.path[0] === 'inputs' && typeof issue.path[1] === 'number' ? issue.path[1] : undefined;
      return { ...(index === undefined ? {} : { index }), message: issue.message };
    }), request.error.issues.map((issue): InputIssueDetail => {
      if (issue.path[0] === 'inputs' && issue.code === 'too_small' && issue.path.length === 1) {
        return { reason: 'EMPTY_INPUTS' };
      }
      if (issue.path[0] === 'inputs' && issue.code === 'too_big') {
        return { reason: issue.path.length === 1 ? 'TOO_MANY_INPUTS' : 'INPUT_TOO_LONG', limit: Number(issue.maximum) };
      }
      return { reason: 'INVALID_INPUT' };
    }));
  }
  const parsed: ParsedInput[] = [];
  const issues: InputIssue[] = [];
  const details: InputIssueDetail[] = [];
  for (const [index, input] of request.data.inputs.entries()) {
    try {
      parsed.push(parseInput(input, index));
    } catch (error) {
      if (!(error instanceof ToolError) || error.code !== 'INVALID_INPUT' || !error.issues?.length) throw error;
      issues.push(...error.issues);
      details.push(...error.issues.map((_, index) => error.details?.[index] || { reason: 'INVALID_INPUT' as const }));
    }
  }
  if (issues.length) {
    throw new ToolError('INVALID_INPUT', 'Expected valid IP addresses or CIDRs.', issues, details);
  }
  const { family, width } = parsed[0]!;
  const differentFamily = parsed.findIndex(entry => entry.family !== family);
  if (differentFamily !== -1) {
    throw new ToolError('MIXED_ADDRESS_FAMILIES', 'Use either IPv4 or IPv6 throughout one calculation.', [
      { index: differentFamily, message: `Expected ${family === 'ipv4' ? 'IPv4' : 'IPv6'} to match the first input.` },
    ], [{ reason: 'EXPECTED_FAMILY', family }]);
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
  const request = new AbortController();
  const cancel = () => request.abort(signal?.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener('abort', cancel, { once: true });
  // Use one cancellable budget for headers and body without newer AbortSignal helpers.
  const timeout = setTimeout(() => request.abort(new DOMException('The operation timed out.', 'TimeoutError')), 10_000);
  let response: Response;
  let text: string;
  const invalidResponseMessage = 'The IP lookup service returned an invalid response. Please try again.';
  try {
    const options = {
      headers: { accept: 'application/json' },
      cache: 'no-store', credentials: 'omit', redirect: 'error',
      signal: request.signal,
    } as const;
    response = await fetch(endpoint, options);
    text = await readBoundedText(response.body, MAX_PUBLIC_IP_RESPONSE_BYTES);
  } catch (error) {
    if (error instanceof BodyLimitError && !request.signal.aborted) {
      throw new ToolError('INVALID_RESPONSE', invalidResponseMessage);
    }
    throw new ToolError('NETWORK_ERROR', 'Unable to reach the IP lookup service. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
  let body: unknown;
  try { body = JSON.parse(text) as unknown; } catch {
    throw new ToolError('INVALID_RESPONSE', invalidResponseMessage);
  }
  if (!response.ok) {
    const failure = ErrorResponseSchema.safeParse(body);
    if (failure.success) throw new ToolError(failure.data.error.code, failure.data.error.message);
    throw new ToolError('NETWORK_ERROR', `The IP lookup service returned HTTP ${response.status}. Please try again.`);
  }
  const result = PublicIpResultSchema.safeParse(body);
  if (!result.success) {
    throw new ToolError('INVALID_RESPONSE', invalidResponseMessage);
  }
  return result.data;
}
