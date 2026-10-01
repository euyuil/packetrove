import { describe, expect, it } from 'vitest';
import { CIDR_COVER_EXAMPLES, CidrCoverRequestSchema, CidrCoverResultSchema, PublicIpResultSchema } from './index';

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
