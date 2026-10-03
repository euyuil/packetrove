import ipaddr from 'ipaddr.js';
import { describe, expect, it } from 'vitest';
import { RANGE_TO_CIDRS_EXAMPLES, RangeToCidrsResultSchema } from '@packetrove/contracts';
import { rangeToCidrs, ToolError } from './index';

describe('inclusive IP range conversion', () => {
  it.each(RANGE_TO_CIDRS_EXAMPLES)('matches the shared $name example', ({ request, result }) => {
    expect(RangeToCidrsResultSchema.parse(rangeToCidrs(request))).toEqual(result);
  });
  it.each([
    ['203.0.113.11', '203.0.113.11', ['203.0.113.11/32'], '1'],
    ['2001:db8::b', '2001:db8::b', ['2001:db8::b/128'], '1'],
    ['203.0.113.0', '203.0.113.255', ['203.0.113.0/24'], '256'],
    ['2001:db8::', '2001:db8::f', ['2001:db8::/124'], '16'],
    ['203.0.113.0', '203.0.113.1', ['203.0.113.0/31'], '2'],
    ['203.0.113.1', '203.0.113.2', ['203.0.113.1/32', '203.0.113.2/32'], '2'],
    ['2001:db8::1', '2001:db8::2', ['2001:db8::1/128', '2001:db8::2/128'], '2'],
    ['203.0.113.127', '203.0.113.128', ['203.0.113.127/32', '203.0.113.128/32'], '2'],
    ['2001:db8::ffff', '2001:db8::1:0', ['2001:db8::ffff/128', '2001:db8::1:0/128'], '2'],
    ['0.0.0.0', '0.0.0.0', ['0.0.0.0/32'], '1'],
    ['255.255.255.255', '255.255.255.255', ['255.255.255.255/32'], '1'],
    ['::', '::', ['::/128'], '1'],
    ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/128'], '1'],
    ['0.0.0.0', '255.255.255.255', ['0.0.0.0/0'], '4294967296'],
    ['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', ['::/0'], '340282366920938463463374607431768211456'],
    ['2001:db8::', '2001:db8::ffff:ffff:ffff:ffff', ['2001:db8::/64'], '18446744073709551616'],
  ] as const)('converts %s through %s exactly', (start, end, cidrs, count) => {
    const result = rangeToCidrs({ start, end });
    expect(result.cidrs).toEqual(cidrs);
    expect(result.cidrCount).toBe(cidrs.length);
    expect(result.addressCount).toBe(count);
    expect(result.range).toEqual({ first: start, last: end });
    expect(RangeToCidrsResultSchema.safeParse(result).success).toBe(true);
  });
  it('canonicalizes whitespace, expanded IPv6 and compatible dotted tails without changing their values', () => {
    expect(rangeToCidrs({ start: ' 2001:DB8:0:0:0:0:0:B ', end: '2001:DB8::17' })).toEqual(RANGE_TO_CIDRS_EXAMPLES[1]!.result);
    expect(rangeToCidrs({ start: '::192.0.2.1', end: '::c000:201' })).toMatchObject({
      family: 'ipv6', range: { first: '::c000:201', last: '::c000:201' }, cidrs: ['::c000:201/128'], addressCount: '1',
    });
    expect(rangeToCidrs({ start: '::ffff:192.0.2.1', end: '::ffff:c000:201' }).family).toBe('ipv6');
  });
  it.each([
    ['0.0.0.1', '255.255.255.254', 62, '4294967294'],
    ['::1', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:fffe', 254, '340282366920938463463374607431768211454'],
  ] as const)('handles the largest decomposition of %s through %s without enumerating addresses', (start, end, count, addresses) => {
    const result = rangeToCidrs({ start, end });
    expect(result.cidrs).toHaveLength(count);
    expect(result.addressCount).toBe(addresses);
    expect(RangeToCidrsResultSchema.safeParse(result).success).toBe(true);
  });
});

describe('endpoint validation', () => {
  it.each([
    ['', 'EMPTY_ENDPOINT'], ['   ', 'EMPTY_ENDPOINT'], ['bad', 'INVALID_ENDPOINT'],
    ['203.0.113.01', 'INVALID_ENDPOINT'], ['203.0.113.256', 'INVALID_ENDPOINT'], ['fe80::1%eth0', 'INVALID_ENDPOINT'],
    ['203.0.113.1/32', 'ENDPOINT_CIDR'], ['2001:db8::/128', 'ENDPOINT_CIDR'],
    ['203.0.113.1,203.0.113.2', 'INVALID_ENDPOINT'], ['::1 ::2', 'INVALID_ENDPOINT'],
  ])('rejects %j with errors identifying both affected fields', (address, reason) => {
    expect(() => rangeToCidrs({ start: address, end: address })).toThrowError(expect.objectContaining({
      code: 'INVALID_INPUT', issues: [{ field: 'start', message: expect.any(String) }, { field: 'end', message: expect.any(String) }],
      details: [{ reason, field: 'start' }, { reason, field: 'end' }],
    }));
  });
  it.each(['start', 'end'] as const)('identifies an absent %s field', field => {
    const request: Record<string, string> = { start: '203.0.113.1', end: '203.0.113.2' };
    delete request[field];
    expect(() => rangeToCidrs(request)).toThrowError(expect.objectContaining({ issues: [{ field, message: expect.any(String) }] }));
  });
  it.each([null, [], {}, { start: ['::1'], end: '::2' }, { start: '::1', end: '::2', extra: true }])('rejects malformed request %j', request => {
    expect(() => rangeToCidrs(request)).toThrow(ToolError);
  });
  it.each([
    ['203.0.113.1', '2001:db8::1', 'ipv4'], ['2001:db8::1', '203.0.113.1', 'ipv6'],
    ['203.0.113.1', '::ffff:203.0.113.1', 'ipv4'],
  ])('rejects mixed families in %s through %s', (start, end, family) => {
    expect(() => rangeToCidrs({ start, end })).toThrowError(expect.objectContaining({
      code: 'MIXED_ADDRESS_FAMILIES', details: [{ reason: 'EXPECTED_FAMILY', family, field: 'end' }],
    }));
  });
  it.each([['203.0.113.23', '203.0.113.11'], ['2001:db8::17', '2001:db8::b']])('rejects reversed endpoints without swapping them', (start, end) => {
    expect(() => rangeToCidrs({ start, end })).toThrowError(expect.objectContaining({
      code: 'INVALID_INPUT', details: [{ reason: 'REVERSED_RANGE', field: 'end' }],
    }));
  });
  it('enforces raw endpoint lengths before parsing and does not expose presentation details', () => {
    try { rangeToCidrs({ start: 'x'.repeat(65), end: 'x'.repeat(65) }); }
    catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      expect((error as ToolError).details).toEqual([
        { reason: 'INPUT_TOO_LONG', limit: 64, field: 'start' }, { reason: 'INPUT_TOO_LONG', limit: 64, field: 'end' },
      ]);
      expect((error as ToolError).toResponse().error).not.toHaveProperty('details');
      return;
    }
    throw new Error('Expected endpoint length validation.');
  });
});

function numericCidr(cidr: string) {
  const [address, prefix] = ipaddr.parseCIDR(cidr);
  const first = address.toByteArray().reduce((value, byte) => (value << 8n) | BigInt(byte), 0n);
  const width = address.kind() === 'ipv4' ? 32 : 128;
  return { first, last: first + (1n << BigInt(width - prefix)) - 1n, prefix };
}

describe('independent exhaustive small-range oracle', () => {
  it.each(['ipv4', 'ipv6'] as const)('matches membership and recursive minimal partitions for every pair in a 64-address %s block', family => {
    const width = family === 'ipv4' ? 32 : 128;
    const base = numericCidr(family === 'ipv4' ? '203.0.113.0/26' : '2001:db8::/122').first;
    const endpoint = (offset: number) => family === 'ipv4' ? `203.0.113.${offset}` : `2001:db8::${offset.toString(16)}`;
    for (let start = 0; start < 64; start++) {
      for (let end = start; end < 64; end++) {
        const expected: ReturnType<typeof numericCidr>[] = [];
        // Split a binary address tree according to explicit membership, not greedy interval decomposition.
        const partition = (offset: number, size: number, prefix: number) => {
          const members = Array.from({ length: size }, (_, index) => offset + index >= start && offset + index <= end);
          if (members.every(Boolean)) expected.push({ first: base + BigInt(offset), last: base + BigInt(offset + size - 1), prefix });
          else if (members.some(Boolean)) {
            partition(offset, size / 2, prefix + 1);
            partition(offset + size / 2, size / 2, prefix + 1);
          }
        };
        partition(0, 64, width - 6);
        const result = rangeToCidrs({ start: endpoint(start), end: endpoint(end) });
        expect(result.cidrs.map(numericCidr)).toEqual(expected);
        expect(result.addressCount).toBe((end - start + 1).toString());
        expect(result.cidrCount).toBe(expected.length);
      }
    }
  });
});
