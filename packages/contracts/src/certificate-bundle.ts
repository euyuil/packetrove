import { z } from 'zod';
import fixtures from './certificate-fixtures.json';
import documentationResults from './certificate-examples.json';

export const MAX_PEM_BYTES = 48 * 1024;
export const MAX_CERTIFICATES = 16;
export const CERTIFICATE_EXAMPLE_TIME = '2026-10-04T06:00:00.000Z';

export const CertificateBundleRequestSchema = z.strictObject({
  pem: z.string().max(MAX_PEM_BYTES).describe('One or more PEM CERTIFICATE blocks, with only whitespace between blocks. At most 48 KiB of UTF-8 and 16 blocks. Private keys and other block types are rejected.'),
  hostname: z.string().max(255).optional().describe('Optional ASCII DNS hostname, including pre-converted IDNA A-labels. No URL, port, IP address, or wildcard. Blank skips identity checking.'),
  leafIndex: z.number().int().min(0).max(MAX_CERTIFICATES - 1).optional().describe('Zero-based original position of a non-CA certificate. Required to resolve multiple possible leaves for hostname checking.'),
});
export const CertificateCheckStatusSchema = z.enum(['verified', 'failed', 'unsupported', 'unavailable']);
export const CertificateFindingCodeSchema = z.enum([
  'DUPLICATE_CERTIFICATE', 'CERTIFICATE_EXPIRED', 'CERTIFICATE_NOT_YET_VALID',
  'SELF_SIGNED_CERTIFICATE', 'SELF_ISSUED_CERTIFICATE', 'SELF_SIGNATURE_FAILED', 'SIGNATURE_UNSUPPORTED',
  'SIGNATURE_CHECK_UNAVAILABLE', 'ISSUER_NOT_IN_BUNDLE', 'LEAF_ISSUER_NOT_IN_BUNDLE',
  'CANDIDATE_SIGNATURE_FAILED', 'LEAF_ISSUER_CANDIDATES_REJECTED',
  'ISSUER_NOT_CA', 'ISSUER_KEY_USAGE_REJECTED', 'ISSUER_KEY_ID_MISMATCH',
  'MULTIPLE_ISSUERS', 'LEAF_SELECTION_REQUIRED', 'NO_LEAF_CERTIFICATE',
  'HOSTNAME_MATCH', 'HOSTNAME_MISMATCH',
]);
const position = z.number().int().min(0).max(MAX_CERTIFICATES - 1);
export const CertificateBundleResultSchema = z.strictObject({
  evaluatedAt: z.iso.datetime().describe('Evaluation time from this runtime clock, not a deployment observation.'),
  certificates: z.array(z.strictObject({
    index: position.describe('Zero-based original input position; duplicates retain their positions.'),
    line: z.number().int().min(1).describe('One-based input line of the BEGIN boundary.'),
    subject: z.string(), issuer: z.string(), commonName: z.string().nullable(), serialNumber: z.string(),
    sans: z.array(z.strictObject({ type: z.string(), value: z.string() })),
    notBefore: z.iso.datetime(), notAfter: z.iso.datetime(), ca: z.boolean(),
    basicConstraintsPresent: z.boolean(), keyCertSign: z.boolean().nullable(),
    fingerprintSha256: z.string().regex(/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/),
    signatureAlgorithm: z.string(), selfSignature: CertificateCheckStatusSchema.nullable()
      .describe('Verification with this certificate\'s own public key when Subject and Issuer names match. Failed or incomplete verification does not exclude a valid self-issued key-rollover certificate signed by a different key.'),
  })).min(1).max(MAX_CERTIFICATES),
  relationships: z.array(z.strictObject({
    childIndex: position, issuerIndex: position, signature: CertificateCheckStatusSchema,
    issuerEligible: z.boolean().describe('basicConstraints CA=true and, if present, Key Usage permits keyCertSign. Does not include validity, trust, or full path constraints.'),
    keyIdentifierMatch: z.boolean().nullable(),
  })).max(MAX_CERTIFICATES * (MAX_CERTIFICATES - 1)),
  leafIndexes: z.array(position).max(MAX_CERTIFICATES).describe('First occurrences of distinct non-CA certificates; these are possible leaves, not a verified deployment selection.'),
  selectedLeafIndex: position.nullable(),
  hostname: z.strictObject({ expected: z.string(), status: z.enum(['matched', 'mismatched', 'ambiguous', 'no-leaf']) }).nullable(),
  findings: z.array(z.strictObject({
    code: CertificateFindingCodeSchema, severity: z.enum(['error', 'warning', 'info'])
      .describe('Error: a confirmed issue with identified certificates or all supplied issuer candidates for the selected leaf. Warning: a candidate issue or an incomplete requested check. Info: a structural or successful observation. No severity establishes client trust or invalidates every possible path.'),
    certificateIndexes: z.array(position).max(MAX_CERTIFICATES), observed: z.string(),
    evidence: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])), nextAction: z.string(),
  })),
}).describe('Structural and cryptographic observations about the supplied bundle. Not full RFC 5280 path validation, client trust, revocation checking, or deployment safety. Candidate failures do not invalidate other paths.');

export type CertificateBundleRequest = z.infer<typeof CertificateBundleRequestSchema>;
export type CertificateBundleResult = z.infer<typeof CertificateBundleResultSchema>;
export type CertificateSummary = CertificateBundleResult['certificates'][number];
export type CertificateFinding = CertificateBundleResult['findings'][number];
export type CertificateFindingCode = CertificateFinding['code'];
export type CertificateCheckStatus = z.infer<typeof CertificateCheckStatusSchema>;
export type CertificateIssuerRelationship = CertificateBundleResult['relationships'][number];

export const certificateFixtures = fixtures;
const bundle = (...names: Array<keyof typeof fixtures>) => names.map(name => fixtures[name]).join('\n');
export const CERTIFICATE_BUNDLE_SAMPLES = [
  { name: 'normal', request: { pem: bundle('leaf', 'intermediate', 'rootA'), hostname: 'service.example.com' } },
  { name: 'omittedRoot', request: { pem: bundle('leaf', 'intermediate'), hostname: 'service.example.com' } },
  { name: 'missingIntermediate', request: { pem: bundle('leaf', 'rootA'), hostname: 'service.example.com' } },
  { name: 'expired', request: { pem: bundle('expired', 'intermediate'), hostname: 'expired.example.com' } },
  { name: 'future', request: { pem: bundle('future', 'intermediate'), hostname: 'future.example.com' } },
  { name: 'hostnameMismatch', request: { pem: bundle('leaf', 'intermediate'), hostname: 'wrong.example.org' } },
  { name: 'multipleLeaves', request: { pem: bundle('leaf', 'leafTwo', 'intermediate'), hostname: 'service.example.com' } },
  { name: 'crossSigning', request: { pem: bundle('rootB', 'crossSigned', 'leaf', 'rootA', 'intermediate'), hostname: 'service.example.com' } },
  { name: 'invalidCandidate', request: { pem: bundle('leaf', 'wrongIntermediate', 'intermediate', 'rootA'), hostname: 'service.example.com' } },
  { name: 'duplicate', request: { pem: bundle('leaf', 'intermediate', 'leaf'), hostname: 'service.example.com' } },
] as const satisfies ReadonlyArray<{ name: string; request: CertificateBundleRequest }>;

/** Public diagnostic inputs for runtime and deployment checks; no frozen time-dependent results. */
export const CERTIFICATE_BUNDLE_DIAGNOSTIC_SAMPLES = [
  ...CERTIFICATE_BUNDLE_SAMPLES.filter(sample => sample.name === 'missingIntermediate' || sample.name === 'multipleLeaves'),
  { name: 'rejectedLeafIssuers', request: { pem: bundle('leaf', 'wrongIntermediate', 'rootA'), hostname: 'service.example.com' } },
  { name: 'caKeyRollover', request: { pem: bundle('rollover', 'rolloverRoot') } },
  { name: 'caAlgorithmRollover', request: { pem: bundle('mixedRollover', 'mixedRolloverRoot') } },
  { name: 'caOnlyHostname', request: { pem: bundle('rootA'), hostname: 'service.example.com' } },
  { name: 'keyIdentifierMismatch', request: { pem: bundle('keyIdMismatch', 'rolloverRoot') } },
] as const satisfies ReadonlyArray<{ name: string; request: CertificateBundleRequest }>;

/** Frozen documentation observations; the runtime always evaluates its current clock. */
export const CERTIFICATE_BUNDLE_EXAMPLES = CERTIFICATE_BUNDLE_SAMPLES.slice(0, 2).map((sample, index) => ({
  name: index === 0 ? 'Synthetic leaf, intermediate, and root' : 'Synthetic served bundle with omitted root',
  request: sample.request, result: documentationResults[index] as CertificateBundleResult,
}));
