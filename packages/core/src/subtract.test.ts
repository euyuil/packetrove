import ipaddr from 'ipaddr.js';
import { describe, expect, it } from 'vitest';
import { CidrSubtractResultSchema, MAX_SUBTRACTION_OUTPUTS } from '@packetrove/contracts';
import { subtractCidrs, ToolError } from './index';

describe('exact CIDR subtraction', () => {
  it('subtracts a subnet without widening the included set', () => {
    const result = subtractCidrs({ include: ['203.0.113.0/24'], exclude: ['203.0.113.64/26'] });
    expect(CidrSubtractResultSchema.parse(result)).toEqual({
      family: 'ipv4', normalizedInclude: ['203.0.113.0/24'], normalizedExclude: ['203.0.113.64/26'],
      cidrs: ['203.0.113.0/26', '203.0.113.128/25'],
      includedAddressCount: '256', removedAddressCount: '64', remainingAddressCount: '192',
    });
  });

  it.each([
    { include: ['203.0.113.0/25', '203.0.113.128/25'], exclude: [], cidrs: ['203.0.113.0/24'], removed: '0', remaining: '256' },
    { include: ['203.0.113.128/26', '203.0.113.0/26'], exclude: [], cidrs: ['203.0.113.0/26', '203.0.113.128/26'], removed: '0', remaining: '128' },
    { include: ['203.0.113.7/24', '203.0.113.128/25', '203.0.113.0/24'], exclude: ['203.0.113.64/26', '203.0.113.64/27', '203.0.113.64/26'], cidrs: ['203.0.113.0/26', '203.0.113.128/25'], removed: '64', remaining: '192' },
    { include: ['203.0.113.0/26'], exclude: ['198.51.100.0/24'], cidrs: ['203.0.113.0/26'], removed: '0', remaining: '64' },
    { include: ['203.0.113.0/26'], exclude: ['203.0.113.0/24'], cidrs: [], removed: '64', remaining: '0' },
    { include: ['203.0.113.0/26'], exclude: ['203.0.113.0/26'], cidrs: [], removed: '64', remaining: '0' },
    { include: ['203.0.113.0/26', '203.0.113.128/26'], exclude: ['203.0.113.0/24'], cidrs: [], removed: '128', remaining: '0' },
    { include: ['203.0.113.0/24'], exclude: ['203.0.113.0/26', '203.0.113.64/26'], cidrs: ['203.0.113.128/25'], removed: '128', remaining: '128' },
    { include: ['203.0.113.0/25', '203.0.113.192/26'], exclude: ['203.0.113.64/26', '203.0.113.128/25'], cidrs: ['203.0.113.0/26'], removed: '128', remaining: '64' },
    { include: ['203.0.113.1', '203.0.113.2', '203.0.113.3'], exclude: [], cidrs: ['203.0.113.1/32', '203.0.113.2/31'], removed: '0', remaining: '3' },
    { include: ['2001:db8::/124', '2001:db8::/125', '2001:db8::/124'], exclude: ['2001:db8::4/126', '2001:db8::4/127', '2001:db8::4/126'], cidrs: ['2001:db8::/126', '2001:db8::8/125'], removed: '4', remaining: '12' },
  ])('handles overlaps, gaps and complete removal: $include minus $exclude', ({ include, exclude, cidrs, removed, remaining }) => {
    const result = subtractCidrs({ include, exclude });
    expect(result.cidrs).toEqual(cidrs);
    expect(result.removedAddressCount).toBe(removed);
    expect(result.remainingAddressCount).toBe(remaining);
    expect(BigInt(result.includedAddressCount)).toBe(BigInt(removed) + BigInt(remaining));
  });

  it('preserves normalized input order and duplicates on each side', () => {
    const result = subtractCidrs({ include: [' 2001:DB8::7/124 ', '2001:db8::/124'], exclude: ['2001:db8::5/126', '2001:db8::4/126'] });
    expect(result.normalizedInclude).toEqual(['2001:db8::/124', '2001:db8::/124']);
    expect(result.normalizedExclude).toEqual(['2001:db8::4/126', '2001:db8::4/126']);
  });

  it.each([
    ['0.0.0.0/0', '4294967296'], ['::/0', '340282366920938463463374607431768211456'],
    ['255.255.255.255/32', '1'], ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/128', '1'],
  ])('handles boundary prefix %s with exact counts', (cidr, count) => {
    const result = subtractCidrs({ include: [cidr], exclude: [] });
    expect(result.cidrs).toEqual([cidr]);
    expect(result.remainingAddressCount).toBe(count);
    expect(subtractCidrs({ include: [cidr], exclude: [cidr] }).cidrs).toEqual([]);
  });

  it.each([
    ['0.0.0.0/0', '192.0.2.1/32', 32, '4294967295'],
    ['::/0', '2001:db8::1/128', 128, '340282366920938463463374607431768211455'],
  ])('splits %s around one host without enumerating its addresses', (parent, host, blocks, count) => {
    const result = subtractCidrs({ include: [parent], exclude: [host] });
    expect(result.cidrs).toHaveLength(blocks as number);
    expect(result.removedAddressCount).toBe('1');
    expect(result.remainingAddressCount).toBe(count);
  });

  it.each([
    ['0.0.0.0/0', ['0.0.0.0/32', '255.255.255.255/32'], '4294967294'],
    ['::/0', ['::/128', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/128'], '340282366920938463463374607431768211454'],
  ] as const)('handles exclusions at both ends of %s', (parent, exclude, count) => {
    const result = subtractCidrs({ include: [parent], exclude: [...exclude] });
    expect(result.remainingAddressCount).toBe(count);
    expect(result.removedAddressCount).toBe('2');
  });

  it('preserves dotted-tail IPv6 values and treats mapped IPv6 as IPv6', () => {
    expect(subtractCidrs({ include: ['::192.0.2.1', '::c000:201', '::ffff:192.0.2.1'], exclude: ['::c000:201'] }).cidrs)
      .toEqual(['::ffff:c000:201/128']);
  });

  it('returns the same canonical result regardless of input order', () => {
    const include = ['203.0.113.0/24', '198.51.100.0/24'];
    const exclude = ['203.0.113.64/26', '198.51.100.128/25'];
    expect(subtractCidrs({ include, exclude }).cidrs)
      .toEqual(subtractCidrs({ include: [...include].reverse(), exclude: [...exclude].reverse() }).cidrs);
  });
});

describe('subtraction validation and limits', () => {
  it('identifies every malformed entry by list and index without returning a partial result', () => {
    expect(() => subtractCidrs({ include: ['bad', '203.0.113.1'], exclude: ['::/129', '203.0.113.01/32'] }))
      .toThrowError(expect.objectContaining({
        code: 'INVALID_INPUT', issues: [
          { index: 0, message: expect.any(String) }, { index: 0, message: expect.any(String) }, { index: 1, message: expect.any(String) },
        ], details: [
          { reason: 'INVALID_ADDRESS', list: 'include' }, { reason: 'INVALID_ADDRESS', list: 'exclude' }, { reason: 'INVALID_ADDRESS', list: 'exclude' },
        ],
      }));
  });
  it.each(['include', 'exclude'] as const)('identifies a mixed family in the %s list', list => {
    const request = { include: ['203.0.113.0/24'], exclude: [] as string[] };
    request[list].push('::ffff:192.0.2.1');
    expect(() => subtractCidrs(request)).toThrowError(expect.objectContaining({
      code: 'MIXED_ADDRESS_FAMILIES', details: [{ reason: 'EXPECTED_FAMILY', family: 'ipv4', list }],
    }));
  });
  it('reports parse errors before family errors', () => {
    expect(() => subtractCidrs({ include: ['::1'], exclude: ['203.0.113.1', 'bad'] }))
      .toThrowError(expect.objectContaining({ code: 'INVALID_INPUT', issues: [{ index: 1, message: expect.any(String) }] }));
  });
  it('rejects an empty include list and locates the error', () => {
    expect(() => subtractCidrs({ include: [], exclude: [] })).toThrowError(expect.objectContaining({
      details: [{ reason: 'EMPTY_INPUTS', list: 'include' }],
    }));
  });
  it.each([{}, null, { include: ['::1'] }, { include: ['::1'], exclude: [42] }, { include: ['::1'], exclude: [], extra: true }])(
    'rejects malformed request %j', value => {
      expect(() => subtractCidrs(value)).toThrow(ToolError);
    },
  );
  it('enforces the length limit on both sides', () => {
    expect(() => subtractCidrs({ include: ['x'.repeat(65)], exclude: ['x'.repeat(65)] }))
      .toThrowError(expect.objectContaining({ details: [
        { reason: 'INPUT_TOO_LONG', limit: 64, list: 'include' }, { reason: 'INPUT_TOO_LONG', limit: 64, list: 'exclude' },
      ] }));
  });
  it('accepts 1,000 total entries and rejects 1,001 before parsing them', () => {
    expect(subtractCidrs({ include: new Array(500).fill('::1'), exclude: new Array(500).fill('::2') }).remainingAddressCount).toBe('1');
    expect(() => subtractCidrs({ include: new Array(501).fill('bad'), exclude: new Array(500).fill('bad') }))
      .toThrowError(expect.objectContaining({ details: [{ reason: 'TOO_MANY_INPUTS', limit: 1000 }] }));
    expect(() => subtractCidrs({ include: ['::1'], exclude: new Array(1001).fill('::2') }))
      .toThrowError(expect.objectContaining({ details: [{ reason: 'TOO_MANY_INPUTS', limit: 1000, list: 'exclude' }] }));
  });
  it('allows exactly 10,000 output CIDRs and rejects larger results without truncation', () => {
    // Each isolated /48 minus one /128 needs exactly 80 output CIDRs.
    const request = (count: number) => ({
      include: Array.from({ length: count }, (_, index) => `2001:db8:${(index * 2).toString(16)}::/48`),
      exclude: Array.from({ length: count }, (_, index) => `2001:db8:${(index * 2).toString(16)}::1/128`),
    });
    const result = subtractCidrs(request(125));
    expect(result.cidrs).toHaveLength(MAX_SUBTRACTION_OUTPUTS);
    expect(result.remainingAddressCount).toBe((125n * ((1n << 80n) - 1n)).toString());
    expect(() => subtractCidrs(request(126))).toThrowError(expect.objectContaining({
      details: [{ reason: 'TOO_MANY_OUTPUTS', limit: MAX_SUBTRACTION_OUTPUTS }],
    }));
  });
});

function numericRange(cidr: string) {
  const [address, prefix] = ipaddr.parseCIDR(cidr);
  const value = address.toByteArray().reduce((total, byte) => (total << 8n) | BigInt(byte), 0n);
  const width = address.kind() === 'ipv4' ? 32 : 128;
  const size = 1n << BigInt(width - prefix);
  const first = value / size * size;
  return { first, last: first + size - 1n, prefix };
}

describe('subtraction against an independent small-set oracle', () => {
  it.each(['ipv4', 'ipv6'] as const)('matches set membership and a recursive minimal partition for %s', family => {
    let seed = 39;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed >>> 8; };
    const width = family === 'ipv4' ? 32 : 128;
    const base = numericRange(family === 'ipv4' ? '203.0.113.0/26' : '2001:db8::/122').first;
    const input = (offset: number, hostBits: number) => family === 'ipv4'
      ? `203.0.113.${offset}/${width - hostBits}` : `2001:db8::${offset.toString(16)}/${width - hostBits}`;
    for (let trial = 0; trial < 200; trial++) {
      const include = Array.from({ length: 1 + random() % 6 }, () => input(random() % 64, random() % 7));
      const exclude = Array.from({ length: random() % 7 }, () => input(random() % 192, random() % 7));
      const membership = (entries: string[]) => {
        const ranges = entries.map(numericRange);
        return Array.from({ length: 64 }, (_, index) => ranges.some(range => base + BigInt(index) >= range.first && base + BigInt(index) <= range.last));
      };
      const included = membership(include);
      const excluded = membership(exclude);
      const remaining = included.map((present, index) => present && !excluded[index]);
      const expected: ReturnType<typeof numericRange>[] = [];
      // Recursively retain full blocks and split partial blocks, independently of interval subtraction.
      const partition = (first: number, size: number, prefix: number) => {
        const count = remaining.slice(first, first + size).filter(Boolean).length;
        if (count === size) expected.push({ first: base + BigInt(first), last: base + BigInt(first + size - 1), prefix });
        else if (count > 0) { partition(first, size / 2, prefix + 1); partition(first + size / 2, size / 2, prefix + 1); }
      };
      partition(0, 64, width - 6);
      const result = subtractCidrs({ include, exclude });
      expect(result.cidrs.map(numericRange)).toEqual(expected);
      expect(result.includedAddressCount).toBe(included.filter(Boolean).length.toString());
      expect(result.remainingAddressCount).toBe(remaining.filter(Boolean).length.toString());
      expect(result.removedAddressCount).toBe((included.filter(Boolean).length - remaining.filter(Boolean).length).toString());
    }
  });
});
