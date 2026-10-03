import {
  CidrSubtractRequestSchema, MAX_SUBTRACTION_INPUTS, MAX_SUBTRACTION_OUTPUTS,
  type CidrSubtractResult, type InputIssue,
} from '@packetrove/contracts';
import { ToolError } from './errors';
import { isIpInputIssueDetail, type IpInputIssueDetail } from './ip-input-errors';
import {
  addressCount, intervalsToCidrs, mergeIntervals, parseInput,
  type Family, type Interval, type ParsedInput,
} from './ip-range';

type SubtractIssueDetail = IpInputIssueDetail & { list?: 'include' | 'exclude' };

function subtractIntervals(include: Interval[], exclude: Interval[]): Interval[] {
  const remaining: Interval[] = [];
  let excludeIndex = 0;
  for (const interval of include) {
    let cursor = interval.first;
    while (excludeIndex < exclude.length && exclude[excludeIndex]!.last < cursor) excludeIndex++;
    let index = excludeIndex;
    while (index < exclude.length && exclude[index]!.first <= interval.last) {
      const exclusion = exclude[index]!;
      if (exclusion.first > cursor) remaining.push({ first: cursor, last: exclusion.first - 1n });
      if (exclusion.last >= cursor) cursor = exclusion.last + 1n;
      // Keep this exclusion available if it also spans a later included interval.
      if (cursor > interval.last) break;
      index++;
    }
    if (cursor <= interval.last) remaining.push({ first: cursor, last: interval.last });
    excludeIndex = index;
  }
  return remaining;
}

function subtractionCidrs(intervals: Interval[], family: Family, width: number): string[] {
  const cidrs: string[] = [];
  for (const cidr of intervalsToCidrs(intervals, family, width)) {
    if (cidrs.length === MAX_SUBTRACTION_OUTPUTS) {
      throw new ToolError<SubtractIssueDetail>('INVALID_INPUT', 'The result contains too many CIDRs.', [{
        message: `The complete result exceeds ${MAX_SUBTRACTION_OUTPUTS} CIDRs. Use fewer exclusions or smaller included ranges. No partial result is returned.`,
      }], [{ reason: 'TOO_MANY_OUTPUTS', limit: MAX_SUBTRACTION_OUTPUTS }]);
    }
    cidrs.push(cidr);
  }
  return cidrs;
}

/** Return the minimal exact CIDR representation of union(include) - union(exclude). */
export function subtractCidrs(value: unknown): CidrSubtractResult {
  const request = CidrSubtractRequestSchema.safeParse(value);
  if (!request.success) {
    const details: SubtractIssueDetail[] = request.error.issues.map(issue => {
      const list = issue.path[0] === 'include' || issue.path[0] === 'exclude' ? issue.path[0] : undefined;
      if (list && issue.code === 'too_small' && issue.path.length === 1) {
        return { reason: 'EMPTY_INPUTS', list };
      }
      if (list && issue.code === 'too_big') {
        return { reason: issue.path.length === 1 ? 'TOO_MANY_INPUTS' : 'INPUT_TOO_LONG',
          limit: Number(issue.maximum), list };
      }
      return { reason: 'INVALID_INPUT', ...(list ? { list } : {}) };
    });
    throw new ToolError<SubtractIssueDetail>('INVALID_INPUT', 'Invalid calculation input.', request.error.issues.map(issue => {
      const index = typeof issue.path[1] === 'number' ? issue.path[1] : undefined;
      const list = issue.path[0] === 'include' || issue.path[0] === 'exclude' ? issue.path[0] : undefined;
      return { ...(index === undefined ? {} : { index }), ...(list ? { list } : {}), message: issue.message };
    }), details);
  }
  if (request.data.include.length + request.data.exclude.length > MAX_SUBTRACTION_INPUTS) {
    throw new ToolError<SubtractIssueDetail>('INVALID_INPUT', 'Too many entries across the include and exclude lists.', [{
      message: `Use at most ${MAX_SUBTRACTION_INPUTS} entries across both lists.`,
    }], [{ reason: 'TOO_MANY_INPUTS', limit: MAX_SUBTRACTION_INPUTS }]);
  }
  const parsed: Record<'include' | 'exclude', ParsedInput[]> = { include: [], exclude: [] };
  const issues: InputIssue[] = [];
  const details: SubtractIssueDetail[] = [];
  for (const list of ['include', 'exclude'] as const) {
    for (const [index, input] of request.data[list].entries()) {
      try {
        parsed[list].push(parseInput(input, index));
      } catch (error) {
        if (!(error instanceof ToolError) || !error.issues?.length) throw error;
        issues.push(...error.issues.map(issue => ({ ...issue, list })));
        details.push(...error.issues.map((_, issueIndex): SubtractIssueDetail => {
          const detail = error.details?.[issueIndex];
          return { ...(isIpInputIssueDetail(detail) ? detail : { reason: 'INVALID_INPUT' as const }), list };
        }));
      }
    }
  }
  if (issues.length) {
    throw new ToolError<SubtractIssueDetail>('INVALID_INPUT', 'Expected valid IP addresses or CIDRs.', issues, details);
  }
  const { family, width } = parsed.include[0]!;
  for (const list of ['include', 'exclude'] as const) {
    for (const [index, entry] of parsed[list].entries()) {
      if (entry.family !== family) {
        issues.push({ list, index, message: `Expected ${family === 'ipv4' ? 'IPv4' : 'IPv6'} to match the first included entry.` });
        details.push({ reason: 'EXPECTED_FAMILY', family, list });
      }
    }
  }
  if (issues.length) {
    throw new ToolError<SubtractIssueDetail>('MIXED_ADDRESS_FAMILIES', 'Use either IPv4 or IPv6 throughout one calculation.', issues, details);
  }
  const include = mergeIntervals(parsed.include);
  const remaining = subtractIntervals(include, mergeIntervals(parsed.exclude));
  const includedAddressCount = addressCount(include);
  const remainingAddressCount = addressCount(remaining);
  return {
    family,
    normalizedInclude: parsed.include.map(entry => entry.cidr),
    normalizedExclude: parsed.exclude.map(entry => entry.cidr),
    cidrs: subtractionCidrs(remaining, family, width),
    includedAddressCount: includedAddressCount.toString(),
    removedAddressCount: (includedAddressCount - remainingAddressCount).toString(),
    remainingAddressCount: remainingAddressCount.toString(),
  };
}
