import { describe, expect, it } from 'vitest';
import { CIDR_COVER_EXAMPLES, CidrCoverResultSchema, ErrorResponseSchema } from '@packetrove/contracts';
import { smallestCoveringCidr, ToolError } from './index';

describe('smallest covering CIDR', () => {
  it.each([
    { inputs: ['bad'], detail: { reason: 'INVALID_ADDRESS' } },
    { inputs: [], detail: { reason: 'EMPTY_INPUTS' } },
    { inputs: new Array(1001).fill('203.0.113.1'), detail: { reason: 'TOO_MANY_INPUTS', limit: 1000 } },
    { inputs: ['x'.repeat(65)], detail: { reason: 'INPUT_TOO_LONG', limit: 64 } },
    { inputs: ['::1', '203.0.113.1'], detail: { reason: 'EXPECTED_FAMILY', family: 'ipv6' } },
  ])('provides local issue details without changing the serialized error: $detail.reason', ({ inputs, detail }) => {
    try {
      smallestCoveringCidr({ inputs });
      expect.fail('Expected invalid input');
    } catch (failure) {
      expect(failure).toBeInstanceOf(ToolError);
      const error = failure as ToolError;
      expect(error.details).toEqual([detail]);
      expect(ErrorResponseSchema.parse(error.toResponse())).toEqual({ error: {
        code: error.code, message: error.message, issues: error.issues,
      } });
      expect(error.toResponse().error).not.toHaveProperty('details');
    }
  });
  it.each(CIDR_COVER_EXAMPLES)('computes $name', ({ request, result }) => {
    expect(smallestCoveringCidr(request)).toEqual(result);
    expect(CidrCoverResultSchema.safeParse(result).success).toBe(true);
  });
  it.each([
    [['203.0.113.1'], '203.0.113.1/32', '1', '1'],
    [['::1'], '::1/128', '1', '1'],
    [['203.0.113.1', '203.0.113.2'], '203.0.113.0/30', '2', '4'],
    [['203.0.113.7/24', '203.0.113.1', '203.0.113.128/25'], '203.0.113.0/24', '256', '256'],
    [['2001:DB8::7/126', '2001:db8::4'], '2001:db8::4/126', '4', '4'],
    [['::1', '::4'], '::/125', '2', '8'],
    [['0.0.0.0', '255.255.255.255'], '0.0.0.0/0', '2', '4294967296'],
    [['0.0.0.0/0'], '0.0.0.0/0', '4294967296', '4294967296'],
    [['::/0', '::1', '::/0'], '::/0', '340282366920938463463374607431768211456', '340282366920938463463374607431768211456'],
    [['::ffff:192.0.2.1'], '::ffff:c000:201/128', '1', '1'],
  ])('handles %j', (inputs, cidr, original, covered) => {
    const result = smallestCoveringCidr({ inputs });
    expect(result.cidr).toBe(cidr);
    expect(result.inputAddressCount).toBe(original);
    expect(result.coveredAddressCount).toBe(covered);
    expect(BigInt(result.additionalAddressCount)).toBe(BigInt(covered) - BigInt(original));
  });
  it('preserves normalized input order and duplicates', () => {
    expect(smallestCoveringCidr({ inputs: [' 203.0.113.7/24 ', '203.0.113.1', '203.0.113.1'] }).normalizedInputs)
      .toEqual(['203.0.113.0/24', '203.0.113.1/32', '203.0.113.1/32']);
  });
  it.each(['', ' ', 'hello', '999.0.0.1', '127.1', '0x7f000001', '192.168.001.1',
    '1.2.3.4/33', '1.2.3.4/-1', '1.2.3.4/1/2', '1.2.3.4/01', '1.2.3.4/',
    '::/129', 'fe80::1%en0', '::ffff:192.168.001.1'])('rejects %j with an input index', entry => {
    try {
      smallestCoveringCidr({ inputs: ['203.0.113.1', entry] });
      expect.fail('Expected invalid input');
    } catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      expect((error as ToolError).toResponse().error.issues?.[0]?.index).toBe(1);
    }
  });
  it('rejects mixed address families without converting mapped IPv6', () => {
    expect(() => smallestCoveringCidr({ inputs: ['192.0.2.1', '::ffff:192.0.2.1'] }))
      .toThrowError(expect.objectContaining({ code: 'MIXED_ADDRESS_FAMILIES' }));
  });
  it('reports every invalid entry in input order without returning a partial calculation', () => {
    expect(() => smallestCoveringCidr({ inputs: ['203.0.113.1', 'bad', '203.0.113.2', '::/129'] }))
      .toThrowError(expect.objectContaining({
        code: 'INVALID_INPUT', message: 'Expected valid IP addresses or CIDRs.',
        issues: [{ index: 1, message: expect.any(String) }, { index: 3, message: expect.any(String) }],
      }));
  });
  it('keeps parse errors ahead of the existing mixed-family check', () => {
    expect(() => smallestCoveringCidr({ inputs: ['::1', 'bad', '203.0.113.1', '::/129'] }))
      .toThrowError(expect.objectContaining({
        code: 'INVALID_INPUT',
        issues: [{ index: 1, message: expect.any(String) }, { index: 3, message: expect.any(String) }],
      }));
    expect(() => smallestCoveringCidr({ inputs: ['::1', '203.0.113.1', '203.0.113.2'] }))
      .toThrowError(expect.objectContaining({
        code: 'MIXED_ADDRESS_FAMILIES', issues: [{ index: 1, message: expect.any(String) }],
      }));
  });
  it('preserves request validation before parsing entries', () => {
    expect(() => smallestCoveringCidr({ inputs: ['bad', ''] }))
      .toThrowError(expect.objectContaining({
        code: 'INVALID_INPUT', message: 'Invalid calculation input.',
        issues: [{ index: 1, message: expect.any(String) }],
      }));
    expect(() => smallestCoveringCidr({ inputs: new Array(1001).fill('bad') }))
      .toThrowError(expect.objectContaining({
        code: 'INVALID_INPUT', message: 'Invalid calculation input.',
        issues: [{ message: expect.any(String) }],
      }));
  });
  it('reports all invalid entries at the maximum input count', () => {
    try {
      smallestCoveringCidr({ inputs: new Array(1000).fill('bad') });
      expect.fail('Expected invalid input');
    } catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      expect((error as ToolError).code).toBe('INVALID_INPUT');
      expect((error as ToolError).issues?.map(issue => issue.index))
        .toEqual(Array.from({ length: 1000 }, (_, index) => index));
    }
  });
  it.each([{}, { inputs: [] }, { inputs: [42] }, { inputs: ['::1'], extra: true },
    { inputs: new Array(1001).fill('::1') }])('rejects malformed requests %j', request => {
    expect(() => smallestCoveringCidr(request)).toThrow(ToolError);
  });
  it('accepts the maximum input count', () => {
    expect(smallestCoveringCidr({ inputs: new Array(1000).fill('::1') }).inputAddressCount).toBe('1');
  });
  it('keeps exact IPv6 counts and dotted-tail values at the maximum input count', () => {
    const inputs = ['::/0', ...new Array<string>(999).fill('::192.0.2.1')];
    const result = smallestCoveringCidr({ inputs });
    expect(result.normalizedInputs).toHaveLength(1000);
    expect(result.normalizedInputs.slice(0, 2)).toEqual(['::/0', '::c000:201/128']);
    expect(result.cidr).toBe('::/0');
    expect(result.inputAddressCount).toBe('340282366920938463463374607431768211456');
    expect(result.coveredAddressCount).toBe(result.inputAddressCount);
    expect(result.additionalAddressCount).toBe('0');
  });
});

describe('IPv6 addresses with dotted IPv4 tails', () => {
  it('preserves the address instead of silently converting it to an IPv4-mapped address', () => {
    expect(smallestCoveringCidr({ inputs: ['::192.0.2.1'] })).toEqual({
      family: 'ipv6', normalizedInputs: ['::c000:201/128'], cidr: '::c000:201/128',
      range: { first: '::c000:201', last: '::c000:201' },
      inputAddressCount: '1', coveredAddressCount: '1', additionalAddressCount: '0',
    });
  });

  it.each([
    ['::192.0.2.1', '::c000:201'],
    ['::0:192.0.2.1', '::c000:201'],
    ['0:0:0:0:0:0:192.0.2.1', '::c000:201'],
    ['::ffff:192.0.2.1', '::ffff:c000:201'],
    ['2001:db8::192.0.2.1', '2001:db8::c000:201'],
  ])('counts equivalent forms %s and %s as one address', (dotted, hexadecimal) => {
    const result = smallestCoveringCidr({ inputs: [dotted, hexadecimal] });
    expect(result.normalizedInputs).toEqual([`${hexadecimal}/128`, `${hexadecimal}/128`]);
    expect(result.cidr).toBe(`${hexadecimal}/128`);
    expect(result.range).toEqual({ first: hexadecimal, last: hexadecimal });
    expect(result.inputAddressCount).toBe('1');
    expect(result.coveredAddressCount).toBe('1');
    expect(result.additionalAddressCount).toBe('0');
  });

  it.each([0, 1, 64, 80, 95, 96, 97, 112, 120, 127, 128])(
    'preserves the full dotted-tail CIDR range and exact counts for /%s', prefix => {
      const dotted = smallestCoveringCidr({ inputs: [`::192.0.2.129/${prefix}`, '::c000:281'] });
      const hexadecimal = smallestCoveringCidr({ inputs: [`::c000:281/${prefix}`, '::c000:281'] });
      expect(dotted).toEqual(hexadecimal);
      expect(dotted.cidr).toMatch(new RegExp(`/${prefix}$`));
      const count = (1n << BigInt(128 - prefix)).toString();
      expect(dotted.inputAddressCount).toBe(count);
      expect(dotted.coveredAddressCount).toBe(count);
      expect(dotted.additionalAddressCount).toBe('0');
    },
  );

  it('keeps compatible and mapped addresses distinct with exact expansion counts', () => {
    const result = smallestCoveringCidr({ inputs: ['::192.0.2.1', '::ffff:192.0.2.1'] });
    expect(result.normalizedInputs).toEqual(['::c000:201/128', '::ffff:c000:201/128']);
    expect(result.cidr).toBe('::/80');
    expect(result.range).toEqual({ first: '::', last: '::ffff:ffff:ffff' });
    expect(result.inputAddressCount).toBe('2');
    expect(result.coveredAddressCount).toBe('281474976710656');
    expect(result.additionalAddressCount).toBe('281474976710654');
  });

  it.each(['::192.0.002.1', '::192.0.2.256', '::192.0.2.1%eth0',
    '::192.0.2.1/129', '::192.0.2.1/01'])('still rejects invalid embedded input %s', input => {
    expect(() => smallestCoveringCidr({ inputs: [input] }))
      .toThrowError(expect.objectContaining({ code: 'INVALID_INPUT', issues: [{ index: 0, message: expect.any(String) }] }));
  });

  it('does not merge dotted-tail IPv6 into the IPv4 address family', () => {
    expect(() => smallestCoveringCidr({ inputs: ['::192.0.2.1', '192.0.2.1'] }))
      .toThrowError(expect.objectContaining({ code: 'MIXED_ADDRESS_FAMILIES' }));
  });
});

describe('covering and union properties against a small exhaustive oracle', () => {
  it('matches enumeration, has a maximal prefix, and is invariant to order and duplicates', () => {
    let seed = 12345;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
    for (let sample = 0; sample < 150; sample++) {
      const addresses = new Set<number>();
      const entries: string[] = [];
      for (let item = 0; item < 2 + random() % 7; item++) {
        const value = random() % 256;
        const hostBits = random() % 5;
        const first = Math.floor(value / 2 ** hostBits) * 2 ** hostBits;
        for (let address = first; address < first + 2 ** hostBits; address++) addresses.add(address);
        entries.push(`203.0.113.${value}/${32 - hostBits}`);
      }
      const sorted = [...addresses].sort((a, b) => a - b);
      const first = sorted[0]!;
      const last = sorted.at(-1)!;
      let oracleHostBits = 0;
      while (Math.floor(first / 2 ** oracleHostBits) !== Math.floor(last / 2 ** oracleHostBits)) oracleHostBits++;
      const oracleFirst = Math.floor(first / 2 ** oracleHostBits) * 2 ** oracleHostBits;
      const result = smallestCoveringCidr({ inputs: entries });
      expect(result.cidr).toBe(`203.0.113.${oracleFirst}/${32 - oracleHostBits}`);
      expect(result.inputAddressCount).toBe(String(addresses.size));
      expect(Number(result.coveredAddressCount)).toBe(2 ** oracleHostBits);
      const changed = smallestCoveringCidr({ inputs: [...entries].reverse().concat(entries[0]!) });
      const { normalizedInputs: _originalInputs, ...originalResult } = result;
      const { normalizedInputs: _changedInputs, ...changedResult } = changed;
      expect(changedResult).toEqual(originalResult);
    }
  });
});
