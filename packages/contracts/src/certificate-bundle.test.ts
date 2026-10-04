import { describe, expect, it } from 'vitest';
import { CertificateBundleRequestSchema, CertificateBundleResultSchema, CERTIFICATE_BUNDLE_EXAMPLES, MAX_PEM_BYTES, certificateFixtures } from './certificate-bundle';
import { ErrorResponseSchema } from './schemas';

describe('certificate bundle contracts', () => {
  it.each(CERTIFICATE_BUNDLE_EXAMPLES)('validates the shared request and observation for $name', example => {
    expect(CertificateBundleRequestSchema.parse(example.request)).toEqual(example.request);
    expect(CertificateBundleResultSchema.parse(example.result)).toEqual(example.result);
  });
  it.each([null, {}, { pem: 1 }, { pem: certificateFixtures.leaf, evaluationTime: '2020-01-01' },
    { pem: 'a'.repeat(MAX_PEM_BYTES + 1) }, { pem: certificateFixtures.leaf, leafIndex: -1 },
    { pem: certificateFixtures.leaf, leafIndex: 0.5 }, { pem: certificateFixtures.leaf, leafIndex: 16 }])('rejects malformed request shape %#', value => {
    expect(CertificateBundleRequestSchema.safeParse(value).success).toBe(false);
  });
  it('preserves located PEM errors through the common public error contract', () => {
    const error = { error: { code: 'INVALID_INPUT', message: 'Rejected certificate input.',
      issues: [{ field: 'pem', path: ['pem'], message: 'Private-key block rejected.', location: { line: 2, offset: 4, end: 30 } }] } };
    expect(ErrorResponseSchema.parse(error)).toEqual(error);
  });
  it('rejects missing or fabricated check states and invalid original positions', () => {
    const result = CERTIFICATE_BUNDLE_EXAMPLES[0]!.result;
    expect(CertificateBundleResultSchema.safeParse({ ...result, trusted: true }).success).toBe(false);
    expect(CertificateBundleResultSchema.safeParse({ ...result, relationships: [{ ...result.relationships[0], signature: 'trusted' }] }).success).toBe(false);
    expect(CertificateBundleResultSchema.safeParse({ ...result, selectedLeafIndex: 16 }).success).toBe(false);
  });
});
