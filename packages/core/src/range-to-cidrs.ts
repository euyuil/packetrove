import { RangeToCidrsRequestSchema, type InputIssue, type RangeToCidrsResult } from '@packetrove/contracts';
import { ToolError, type InputIssueDetail } from './errors';
import { formatAddress, intervalsToCidrs, parseInput, type ParsedInput } from './ip-range';

/** Convert one inclusive start/end range without enumerating individual addresses. */
export function rangeToCidrs(value: unknown): RangeToCidrsResult {
  const request = RangeToCidrsRequestSchema.safeParse(value);
  if (!request.success) {
    const details: InputIssueDetail[] = request.error.issues.map(issue => {
      const field = issue.path[0] === 'start' || issue.path[0] === 'end' ? issue.path[0] : undefined;
      return issue.code === 'too_big' ? { reason: 'INPUT_TOO_LONG', limit: Number(issue.maximum), ...(field ? { field } : {}) }
        : { reason: field ? 'EMPTY_ENDPOINT' : 'INVALID_INPUT', ...(field ? { field } : {}) };
    });
    throw new ToolError('INVALID_INPUT', 'Expected one start IP and one end IP.',
      details.map(detail => ({ ...(detail.field ? { field: detail.field } : {}), message:
        detail.reason === 'INPUT_TOO_LONG' ? `Use at most ${detail.limit} characters per endpoint.`
          : 'Enter one IPv4 or IPv6 address in each endpoint field; no other fields are accepted.',
      })), details);
  }
  const issues: InputIssue[] = [];
  const details: InputIssueDetail[] = [];
  const parsed: Partial<Record<'start' | 'end', ParsedInput>> = {};
  for (const field of ['start', 'end'] as const) {
    const text = request.data[field].trim();
    const fail = (reason: 'EMPTY_ENDPOINT' | 'INVALID_ENDPOINT' | 'ENDPOINT_CIDR', message: string) => {
      issues.push({ field, message });
      details.push({ reason, field });
    };
    if (!text) fail('EMPTY_ENDPOINT', 'Enter one IPv4 or IPv6 address.');
    else if (text.includes('/')) fail('ENDPOINT_CIDR', 'Enter an IP address without a CIDR prefix.');
    else {
      try { parsed[field] = parseInput(text, 0); }
      catch (error) {
        if (!(error instanceof ToolError) || error.code !== 'INVALID_INPUT') throw error;
        fail('INVALID_ENDPOINT', 'Use a standard IPv4 or IPv6 address without a CIDR prefix. Zone identifiers and IPv4 leading zeros are not supported.');
      }
    }
  }
  if (issues.length) throw new ToolError('INVALID_INPUT', 'Expected valid range endpoints.', issues, details);
  const start = parsed.start!;
  const end = parsed.end!;
  if (start.family !== end.family) {
    throw new ToolError('MIXED_ADDRESS_FAMILIES', 'Use the same address family for both endpoints.', [{
      field: 'end', message: `Use ${start.family === 'ipv4' ? 'IPv4' : 'IPv6'} to match the start IP.`,
    }], [{ reason: 'EXPECTED_FAMILY', family: start.family, field: 'end' }]);
  }
  if (end.first < start.first) {
    throw new ToolError('INVALID_INPUT', 'The end IP precedes the start IP.', [{
      field: 'end', message: 'Enter an end IP at or after the start IP. Endpoints are not automatically swapped.',
    }], [{ reason: 'REVERSED_RANGE', field: 'end' }]);
  }
  const cidrs = Array.from(intervalsToCidrs([{ first: start.first, last: end.first }], start.family, start.width));
  return {
    family: start.family,
    range: { first: formatAddress(start.first, start.family), last: formatAddress(end.first, end.family) },
    cidrs, cidrCount: cidrs.length, addressCount: (end.first - start.first + 1n).toString(),
  };
}
