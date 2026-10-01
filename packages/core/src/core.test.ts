import { describe, expect, it } from 'vitest';
import { CIDR_COVER_EXAMPLES, CidrCoverResultSchema } from '@packetrove/contracts';
import { smallestCoveringCidr, ToolError } from './index';

describe('smallest covering CIDR', () => {
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
  it.each([{}, { inputs: [] }, { inputs: [42] }, { inputs: ['::1'], extra: true },
    { inputs: new Array(1001).fill('::1') }])('rejects malformed requests %j', request => {
    expect(() => smallestCoveringCidr(request)).toThrow(ToolError);
  });
  it('accepts the maximum input count', () => {
    expect(smallestCoveringCidr({ inputs: new Array(1000).fill('::1') }).inputAddressCount).toBe('1');
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
