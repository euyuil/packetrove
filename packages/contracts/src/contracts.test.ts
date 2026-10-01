import { describe, expect, it } from 'vitest';
import { CIDR_COVER_EXAMPLES, CidrCoverRequestSchema, CidrCoverResultSchema } from './index';

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
