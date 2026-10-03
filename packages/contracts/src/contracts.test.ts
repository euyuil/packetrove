import { describe, expect, it } from 'vitest';
import { CIDR_COVER_EXAMPLES, CidrCoverRequestSchema, CidrCoverResultSchema, PublicIpResultSchema,
  RANGE_TO_CIDRS_EXAMPLES, RangeToCidrsRequestSchema, RangeToCidrsResultSchema, ErrorResponseSchema, inputIssuePath } from './index';

describe('generic input issue locations', () => {
  const message = 'Check this input.';
  it('accepts tool-defined fields, lists, and nested input paths without changing legacy locations', () => {
    const issues = [
      { field: 'hostname', message }, { list: 'records', index: 2, message },
      { path: ['records', 2, 'hostname'], message }, { path: [], message },
      { field: 'start', message }, { list: 'exclude', index: 1, message },
    ];
    expect(ErrorResponseSchema.parse({ error: { code: 'INVALID_INPUT', message, issues } }).error.issues).toEqual(issues);
  });
  it.each([[''], [-1], [0.5], [true], [null]])('rejects invalid path segments: %j', (...path) => {
    expect(ErrorResponseSchema.safeParse({ error: { code: 'INVALID_INPUT', message, issues: [{ path, message }] } }).success).toBe(false);
  });
  it('prefers an explicit path, including the whole request, over legacy locations', () => {
    expect(inputIssuePath({ message, field: 'start', list: 'exclude', index: 3, path: ['records', 2] })).toEqual(['records', 2]);
    expect(inputIssuePath({ message, list: 'exclude', path: [] })).toEqual([]);
    expect(inputIssuePath({ message, field: 'start', list: 'exclude', index: 3 })).toEqual(['start']);
    expect(inputIssuePath({ message, list: 'exclude', index: 3 })).toEqual(['exclude', 3]);
    expect(inputIssuePath({ message, list: 'include' })).toEqual(['include']);
    expect(inputIssuePath({ message, index: 0 })).toEqual([0]);
    expect(inputIssuePath({ message })).toBeUndefined();
  });
});

describe('public contract examples', () => {
  it.each(CIDR_COVER_EXAMPLES)('validates $name', ({ request, result }) => {
    expect(CidrCoverRequestSchema.safeParse(request).success).toBe(true);
    expect(CidrCoverResultSchema.safeParse(result).success).toBe(true);
    expect(BigInt(result.coveredAddressCount) - BigInt(result.inputAddressCount))
      .toBe(BigInt(result.additionalAddressCount));
  });
  it('rejects numeric address counts to prevent lossy IPv6 serialization', () => {
    const result = CIDR_COVER_EXAMPLES[2]!.result;
    expect(CidrCoverResultSchema.safeParse({ ...result, coveredAddressCount: Number(result.coveredAddressCount) }).success).toBe(false);
  });
});

describe('range conversion contracts', () => {
  it.each(RANGE_TO_CIDRS_EXAMPLES)('validates the shared $name pair and result', ({ request, result }) => {
    expect(RangeToCidrsRequestSchema.parse(request)).toEqual(request);
    expect(RangeToCidrsResultSchema.parse(result)).toEqual(result);
  });
  it('requires exactly one pair and exact decimal-string counts', () => {
    const { request, result } = RANGE_TO_CIDRS_EXAMPLES[0]!;
    for (const value of [{ start: request.start }, { ...request, ranges: [request] }, { start: [request.start], end: request.end }]) {
      expect(RangeToCidrsRequestSchema.safeParse(value).success).toBe(false);
    }
    for (const addressCount of [13, '13.0', '-1', '013']) {
      expect(RangeToCidrsResultSchema.safeParse({ ...result, addressCount }).success).toBe(false);
    }
  });
  it('preserves endpoint field locations in structured errors', () => {
    expect(ErrorResponseSchema.parse({ error: { code: 'INVALID_INPUT', message: 'Invalid range.', issues: [
      { field: 'start', message: 'Enter an address.' }, { field: 'end', message: 'Remove the prefix.' },
    ] } }).error.issues?.map(issue => issue.field)).toEqual(['start', 'end']);
  });
});

describe('public IP result contract', () => {
  it.each([
    { ip: '203.0.113.1', family: 'ipv4' },
    { ip: '2001:db8::1', family: 'ipv6' },
    { ip: '::ffff:203.0.113.1', family: 'ipv6' },
  ])('accepts matching IP addresses and families: $ip', result => {
    expect(PublicIpResultSchema.safeParse(result).success).toBe(true);
  });
  it.each([
    { ip: '2001:db8::1', family: 'ipv4' },
    { ip: '203.0.113.1', family: 'ipv6' },
    { ip: '203.0.113.1/32', family: 'ipv4' },
    { ip: '203.000.113.1', family: 'ipv4' },
    { ip: 'fe80::1%eth0', family: 'ipv6' },
    { ip: 'invalid', family: 'ipv4' },
    { ip: '203.0.113.1', family: 'ipv4', headers: {} },
  ])('rejects invalid or mismatched results: $ip / $family', result => {
    expect(PublicIpResultSchema.safeParse(result).success).toBe(false);
  });
});
