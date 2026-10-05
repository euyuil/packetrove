import { X509Certificate as NodeCertificate } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CertificateBundleInputError as BundleInputError, checkCertificateBundle as checkBundle, matchesDnsName, MAX_CERTIFICATES, MAX_PEM_BYTES, normalizeHostname } from './certificate-bundle';
import { certificateFixtures as fixtures, CERTIFICATE_BUNDLE_EXAMPLES, CertificateBundleResultSchema } from '@packetrove/contracts';
const bundle = (...names: Array<keyof typeof fixtures>) => names.map(name => fixtures[name]).join('\n');

const clock = new Date('2026-10-04T06:00:00Z');
const inspect = (pem: string, hostname?: string, leafIndex?: number) => checkBundle({
  pem, ...(hostname === undefined ? {} : { hostname }), ...(leafIndex === undefined ? {} : { leafIndex }),
}, clock);
afterEach(() => vi.restoreAllMocks());

describe('certificate bundle diagnostics', () => {
  it.each(CERTIFICATE_BUNDLE_EXAMPLES)('reproduces the fixed-clock shared documentation result for $name', async example => {
    expect(CertificateBundleResultSchema.parse(await checkBundle(example.request, new Date(example.result.evaluatedAt)))).toEqual(example.result);
  });
  it('verifies links and fingerprints independently of the certificate parser', async () => {
    const result = await inspect(bundle('leaf', 'intermediate', 'rootA'), 'service.example.com');
    expect(result.evaluatedAt).toBe(clock.toISOString());
    expect(result.relationships).toEqual([
      { childIndex: 0, issuerIndex: 1, signature: 'verified', issuerEligible: true, keyIdentifierMatch: true },
      { childIndex: 1, issuerIndex: 2, signature: 'verified', issuerEligible: true, keyIdentifierMatch: true },
    ]);
    expect(result.hostname?.status).toBe('matched');
    expect(new NodeCertificate(fixtures.leaf).verify(new NodeCertificate(fixtures.intermediate).publicKey)).toBe(true);
    expect(result.certificates[0]!.fingerprintSha256).toBe(new NodeCertificate(fixtures.leaf).fingerprint256);
    expect(result.findings.filter(finding => finding.severity === 'error')).toEqual([]);
  });

  it('verifies an RSA SHA-256 issuer and an EC leaf with independent Node verification', async () => {
    const result = await inspect(bundle('rsaLeaf', 'rsaRoot'), 'rsa.example.com');
    expect(result.relationships[0]).toMatchObject({ signature: 'verified', issuerEligible: true, keyIdentifierMatch: null });
    expect(result.certificates[0]!.signatureAlgorithm).toBe('RSASSA-PKCS1-v1_5 / SHA-256');
    expect(result.certificates[1]!.selfSignature).toBe('verified');
    expect(result.hostname?.status).toBe('matched');
    expect(new NodeCertificate(fixtures.rsaLeaf).verify(new NodeCertificate(fixtures.rsaRoot).publicKey)).toBe(true);
  });

  it('retains a missing Common Name while matching the DNS SAN', async () => {
    const result = await inspect(bundle('noCommonName', 'intermediate'), 'service.example.com');
    expect(result.certificates[0]!.commonName).toBeNull();
    expect(result.hostname?.status).toBe('matched');
  });

  it('never initiates a lookup or upload while inspecting certificates', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network permitted'));
    await inspect(bundle('leaf', 'intermediate'), 'service.example.com');
    expect(network).not.toHaveBeenCalled();
  });

  it('preserves original positions in unordered bundles', async () => {
    const result = await inspect(bundle('rootA', 'leaf', 'intermediate'));
    expect(result.certificates.map(certificate => certificate.index)).toEqual([0, 1, 2]);
    expect(result.relationships.map(link => [link.childIndex, link.issuerIndex])).toEqual([[1, 2], [2, 0]]);
    expect(result.selectedLeafIndex).toBe(1);
  });

  it('reports an omitted root as information without declaring a broken chain', async () => {
    const result = await inspect(bundle('leaf', 'intermediate'));
    const finding = result.findings.find(finding => finding.code === 'ISSUER_NOT_IN_BUNDLE');
    expect(finding).toMatchObject({ severity: 'info', certificateIndexes: [1] });
    expect(result.relationships[0]!.signature).toBe('verified');
  });

  it('reports a missing intermediate without testing an unrelated root as its issuer', async () => {
    const result = await inspect(bundle('leaf', 'rootA', 'rootB'));
    expect(result.relationships).toEqual([]);
    expect(result.findings.some(finding => finding.code === 'CANDIDATE_SIGNATURE_FAILED')).toBe(false);
    expect(result.findings.find(finding => finding.code === 'LEAF_ISSUER_NOT_IN_BUNDLE')).toMatchObject({ severity: 'warning', certificateIndexes: [0] });
    expect(result.findings.some(finding => finding.severity === 'error')).toBe(false);
  });

  it('keeps unselected leaves informational and follows the chosen original duplicate position', async () => {
    const pem = bundle('leaf', 'leafTwo', 'leaf');
    expect((await inspect(pem)).findings.filter(finding => finding.code === 'ISSUER_NOT_IN_BUNDLE')).toHaveLength(2);
    const result = await inspect(pem, undefined, 2);
    expect(result.selectedLeafIndex).toBe(2);
    expect(result.findings.find(finding => finding.code === 'LEAF_ISSUER_NOT_IN_BUNDLE')).toMatchObject({ severity: 'warning', certificateIndexes: [2] });
    expect(result.findings.find(finding => finding.code === 'ISSUER_NOT_IN_BUNDLE')?.certificateIndexes).toEqual([1]);
  });

  it('keeps a viable issuer link when a same-name candidate has the wrong key', async () => {
    const result = await inspect(bundle('leaf', 'wrongIntermediate', 'intermediate', 'rootA'));
    expect(result.relationships.filter(link => link.childIndex === 0).map(link => link.signature)).toEqual(['failed', 'verified']);
    expect(new NodeCertificate(fixtures.leaf).verify(new NodeCertificate(fixtures.wrongIntermediate).publicKey)).toBe(false);
    expect(result.findings.find(finding => finding.code === 'CANDIDATE_SIGNATURE_FAILED')?.certificateIndexes).toEqual([0, 1]);
    expect(result.findings.filter(finding => finding.severity === 'error')).toEqual([]);
  });

  it('separates valid signatures from rejected CA and Key Usage constraints', async () => {
    for (const [leaf, issuer, code] of [
      ['nonCaLeaf', 'nonCaIssuer', 'ISSUER_NOT_CA'],
      ['restrictedLeaf', 'noSigningIssuer', 'ISSUER_KEY_USAGE_REJECTED'],
    ] as const) {
      const result = await inspect(bundle(leaf, issuer, 'rootA'));
      expect(result.relationships[0]).toMatchObject({ signature: 'verified', issuerEligible: false });
      expect(result.findings.some(finding => finding.code === code)).toBe(true);
    }
  });

  it.each([
    { names: ['leaf', 'wrongIntermediate', 'rootA'], failedSignatureCount: 1, rejectedIssuerCount: 0 },
    { names: ['nonCaLeaf', 'nonCaIssuer', 'rootA'], failedSignatureCount: 0, rejectedIssuerCount: 1 },
    { names: ['restrictedLeaf', 'noSigningIssuer', 'rootA'], failedSignatureCount: 0, rejectedIssuerCount: 1 },
  ] as const)('reports rejection of all supplied selected-leaf candidates with counts (%#)', async ({ names, failedSignatureCount, rejectedIssuerCount }) => {
    const result = await inspect(bundle(...names), 'service.example.com', 0);
    expect(result.hostname?.status).toBe('matched');
    expect(result.findings.find(finding => finding.code === 'LEAF_ISSUER_CANDIDATES_REJECTED')).toMatchObject({
      severity: 'error', certificateIndexes: [0, 1], evidence: { candidateCount: 1, failedSignatureCount, rejectedIssuerCount },
    });
    expect(result.findings.filter(finding => finding.certificateIndexes.length === 2 && finding.code !== 'LEAF_ISSUER_CANDIDATES_REJECTED')
      .every(finding => finding.severity === 'warning')).toBe(true);
    expect(CertificateBundleResultSchema.parse(result)).toEqual(result);
  });

  it('evaluates candidate rejections only for the selected leaf and retains duplicate selections', async () => {
    const pem = bundle('leaf', 'wrongIntermediate', 'leafTwo', 'intermediate', 'restrictedLeaf', 'noSigningIssuer', 'rootA', 'restrictedLeaf');
    const unselected = await inspect(pem, 'service.example.com');
    expect(unselected.findings.some(finding => finding.code === 'LEAF_ISSUER_CANDIDATES_REJECTED')).toBe(false);
    expect((await inspect(pem, 'service.example.com', 0)).findings.some(finding => finding.code === 'LEAF_ISSUER_CANDIDATES_REJECTED')).toBe(false);
    const rejected = await inspect(pem, 'service.example.com', 7);
    expect(rejected.findings.find(finding => finding.code === 'LEAF_ISSUER_CANDIDATES_REJECTED')).toMatchObject({
      severity: 'error', certificateIndexes: [7, 5],
    });
  });

  it('keeps an unknown alternative from turning a failed candidate into a confirmed rejection', async () => {
    const importKey = crypto.subtle.importKey.bind(crypto.subtle);
    vi.spyOn(crypto.subtle, 'importKey').mockImplementationOnce(importKey)
      .mockRejectedValueOnce(new DOMException('Unsupported algorithm', 'NotSupportedError'));
    const result = await inspect(bundle('leaf', 'wrongIntermediate', 'intermediate'));
    expect(result.relationships.map(link => link.signature)).toEqual(['failed', 'unsupported']);
    expect(result.findings.some(finding => finding.code === 'LEAF_ISSUER_CANDIDATES_REJECTED')).toBe(false);
  });

  it('does not require a self-signature on a valid self-issued key-rollover certificate', async () => {
    const result = await inspect(bundle('rollover', 'rolloverRoot'));
    expect(new NodeCertificate(fixtures.rollover).verify(new NodeCertificate(fixtures.rolloverRoot).publicKey)).toBe(true);
    expect(new NodeCertificate(fixtures.rollover).verify(new NodeCertificate(fixtures.rollover).publicKey)).toBe(false);
    expect(result.certificates[0]!.selfSignature).toBe('failed');
    expect(result.relationships.find(link => link.childIndex === 0)).toMatchObject({ signature: 'verified', issuerEligible: true, keyIdentifierMatch: true });
    expect(result.findings.find(finding => finding.code === 'SELF_ISSUED_CERTIFICATE')).toMatchObject({ severity: 'info', certificateIndexes: [0, 1] });
    expect(result.findings.some(finding => finding.code === 'SELF_SIGNATURE_FAILED' && finding.certificateIndexes[0] === 0)).toBe(false);
    expect((await inspect(fixtures.rollover)).findings.find(finding => finding.code === 'SELF_SIGNATURE_FAILED')).toMatchObject({ severity: 'warning', certificateIndexes: [0] });
    expect(CertificateBundleResultSchema.parse(result)).toEqual(result);
  });

  it('reports a verified key rollover across public-key algorithms as information', async () => {
    const result = await inspect(bundle('mixedRollover', 'mixedRolloverRoot'));
    const certificate = new NodeCertificate(fixtures.mixedRollover);
    expect(certificate.publicKey.asymmetricKeyType).toBe('rsa');
    expect(new NodeCertificate(fixtures.mixedRolloverRoot).publicKey.asymmetricKeyType).toBe('ec');
    expect(certificate.verify(new NodeCertificate(fixtures.mixedRolloverRoot).publicKey)).toBe(true);
    expect(certificate.verify(certificate.publicKey)).toBe(false);
    expect(['failed', 'unsupported', 'unavailable']).toContain(result.certificates[0]!.selfSignature);
    expect(result.relationships.find(link => link.childIndex === 0)).toMatchObject({ signature: 'verified', issuerEligible: true, keyIdentifierMatch: true });
    expect(result.findings.find(finding => finding.code === 'SELF_ISSUED_CERTIFICATE')).toMatchObject({ severity: 'info', certificateIndexes: [0, 1] });
    expect(result.findings.some(finding => finding.certificateIndexes.length === 1 && finding.certificateIndexes[0] === 0
      && ['SELF_SIGNATURE_FAILED', 'SIGNATURE_UNSUPPORTED', 'SIGNATURE_CHECK_UNAVAILABLE'].includes(finding.code))).toBe(false);
    expect(CertificateBundleResultSchema.parse(result)).toEqual(result);
  });

  it.each([
    { name: 'NotSupportedError', status: 'unsupported' },
    { name: 'OperationError', status: 'unavailable' },
  ] as const)('retains an incomplete own-key result when another supplied issuer verifies ($status)', async ({ name, status }) => {
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValueOnce(new DOMException('Own-key test interrupted', name));
    const result = await inspect(bundle('rollover', 'rolloverRoot'));
    expect(result.certificates[0]!.selfSignature).toBe(status);
    expect(result.relationships.find(link => link.childIndex === 0)!.signature).toBe('verified');
    expect(result.findings.find(finding => finding.code === 'SELF_ISSUED_CERTIFICATE')).toMatchObject({ severity: 'info', certificateIndexes: [0, 1] });
    expect(result.findings.some(finding => finding.certificateIndexes.length === 1 && finding.certificateIndexes[0] === 0
      && ['SIGNATURE_UNSUPPORTED', 'SIGNATURE_CHECK_UNAVAILABLE'].includes(finding.code))).toBe(false);
  });

  it('does not treat a key-identifier mismatch alone as confirmed selected-leaf rejection', async () => {
    const result = await inspect(bundle('keyIdMismatch', 'rolloverRoot'), 'service.example.com');
    expect(new NodeCertificate(fixtures.keyIdMismatch).verify(new NodeCertificate(fixtures.rolloverRoot).publicKey)).toBe(true);
    expect(result.relationships[0]).toMatchObject({ signature: 'verified', issuerEligible: true, keyIdentifierMatch: false });
    expect(result.findings.find(finding => finding.code === 'ISSUER_KEY_ID_MISMATCH')?.severity).toBe('warning');
    expect(result.findings.some(finding => finding.code === 'LEAF_ISSUER_CANDIDATES_REJECTED')).toBe(false);
  });

  it('retains a verified self-signature on a selected leaf despite a failed same-name candidate', async () => {
    const result = await inspect(bundle('selfSignedLeaf', 'rolloverRoot'), 'service.example.com');
    expect(result.certificates[0]!.selfSignature).toBe('verified');
    expect(result.relationships[0]!.signature).toBe('failed');
    expect(result.findings.some(finding => finding.code === 'LEAF_ISSUER_CANDIDATES_REJECTED')).toBe(false);
    expect(result.hostname?.status).toBe('matched');
  });

  it.each([
    { name: 'NotSupportedError', status: 'unsupported', code: 'SIGNATURE_UNSUPPORTED' },
    { name: 'OperationError', status: 'unavailable', code: 'SIGNATURE_CHECK_UNAVAILABLE' },
  ] as const)('does not reject all leaf alternatives when the own-key test is $status', async ({ name, status, code }) => {
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValueOnce(new DOMException('Own-key test interrupted', name));
    const result = await inspect(bundle('selfSignedLeaf', 'rolloverRoot'), 'service.example.com');
    expect(result.certificates[0]!.selfSignature).toBe(status);
    expect(result.relationships.find(link => link.childIndex === 0)!.signature).toBe('failed');
    expect(result.findings.find(finding => finding.code === code && finding.certificateIndexes.length === 1))
      .toMatchObject({ severity: 'warning', certificateIndexes: [0], evidence: { signature: status } });
    expect(result.findings.find(finding => finding.code === 'CANDIDATE_SIGNATURE_FAILED'))
      .toMatchObject({ severity: 'warning', certificateIndexes: [0, 1] });
    expect(result.findings.some(finding => finding.code === 'LEAF_ISSUER_CANDIDATES_REJECTED')).toBe(false);
    expect(result.hostname?.status).toBe('matched');
  });

  it('reports all rejected leaf candidates when the own-key test also fails', async () => {
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValueOnce(new DOMException('Own-key import rejected', 'DataError'));
    const result = await inspect(bundle('selfSignedLeaf', 'rolloverRoot'), 'service.example.com');
    expect(result.certificates[0]!.selfSignature).toBe('failed');
    expect(result.findings.find(finding => finding.code === 'SELF_SIGNATURE_FAILED'))
      .toMatchObject({ severity: 'warning', certificateIndexes: [0] });
    expect(result.findings.find(finding => finding.code === 'LEAF_ISSUER_CANDIDATES_REJECTED')).toMatchObject({
      severity: 'error', certificateIndexes: [0, 1], evidence: { candidateCount: 1, failedSignatureCount: 1, rejectedIssuerCount: 0 },
    });
  });

  it('retains both cross-signed issuer alternatives without choosing a trust path', async () => {
    const result = await inspect(bundle('rootB', 'crossSigned', 'leaf', 'rootA', 'intermediate'));
    expect(result.relationships.filter(link => link.childIndex === 2).map(link => link.issuerIndex)).toEqual([1, 4]);
    expect(result.findings.find(finding => finding.code === 'MULTIPLE_ISSUERS')?.certificateIndexes).toEqual([2, 1, 4]);
  });

  it('requires a leaf selection even when only one leaf matches the requested name', async () => {
    const pem = bundle('leaf', 'leafTwo', 'intermediate');
    const ambiguous = await inspect(pem, 'service.example.com');
    expect(ambiguous.hostname?.status).toBe('ambiguous');
    expect(ambiguous.selectedLeafIndex).toBeNull();
    expect(ambiguous.findings.some(finding => finding.code === 'HOSTNAME_MATCH')).toBe(false);
    expect(ambiguous.findings.find(finding => finding.code === 'LEAF_SELECTION_REQUIRED')?.severity).toBe('warning');
    expect((await inspect(pem)).findings.find(finding => finding.code === 'LEAF_SELECTION_REQUIRED')?.severity).toBe('info');
    expect((await inspect(pem, 'service.example.com', 0)).hostname?.status).toBe('matched');
    expect((await inspect(pem, 'service.example.com', 1)).hostname?.status).toBe('mismatched');
  });

  it('retains duplicate positions without introducing leaf ambiguity', async () => {
    const result = await inspect(bundle('leaf', 'intermediate', 'leaf'), 'service.example.com');
    expect(result.certificates).toHaveLength(3);
    expect(result.leafIndexes).toEqual([0]);
    expect(result.findings.find(finding => finding.code === 'DUPLICATE_CERTIFICATE')?.certificateIndexes).toEqual([0, 2]);
    expect(result.hostname?.status).toBe('matched');
  });

  it('checks fixed-clock expiry separately from signatures and includes validity boundaries', async () => {
    const expired = await inspect(bundle('expired', 'intermediate'));
    expect(expired.findings.find(finding => finding.code === 'CERTIFICATE_EXPIRED')).toMatchObject({
      severity: 'error', evidence: { evaluatedAt: clock.toISOString(), notAfter: '2021-01-01T00:00:00.000Z' },
    });
    expect(expired.relationships[0]!.signature).toBe('verified');
    expect((await inspect(bundle('future', 'intermediate'))).findings.some(finding => finding.code === 'CERTIFICATE_NOT_YET_VALID')).toBe(true);
    const boundary = await checkBundle({ pem: fixtures.expired }, new Date('2021-01-01T00:00:00Z'));
    expect(boundary.findings.some(finding => finding.code === 'CERTIFICATE_EXPIRED')).toBe(false);
  });

  it('checks DNS SANs without a Common Name fallback', async () => {
    expect((await inspect(bundle('leaf', 'intermediate'), 'wrong.example.org')).hostname?.status).toBe('mismatched');
    expect((await inspect(bundle('cnOnly', 'intermediate'), 'service.example.com')).hostname?.status).toBe('mismatched');
    expect((await inspect(bundle('leaf', 'intermediate'), 'one.example.net')).hostname?.status).toBe('matched');
    expect((await inspect(bundle('leaf', 'intermediate'), 'two.one.example.net')).hostname?.status).toBe('mismatched');
  });

  it('reports unsupported checks separately from invalid signatures', async () => {
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValue(new DOMException('Unsupported algorithm', 'NotSupportedError'));
    const result = await inspect(bundle('leaf', 'intermediate'));
    expect(result.relationships[0]!.signature).toBe('unsupported');
    expect(result.findings.some(finding => finding.code === 'SIGNATURE_UNSUPPORTED')).toBe(true);
    expect(result.findings.some(finding => finding.code === 'CANDIDATE_SIGNATURE_FAILED')).toBe(false);
    expect(result.findings.some(finding => finding.code === 'LEAF_ISSUER_CANDIDATES_REJECTED')).toBe(false);
  });

  it('reports unexpected verification failures as incomplete checks', async () => {
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValue(new Error('Provider interrupted'));
    const result = await inspect(bundle('leaf', 'intermediate'));
    expect(result.relationships[0]!.signature).toBe('unavailable');
    expect(result.findings.some(finding => finding.code === 'SIGNATURE_CHECK_UNAVAILABLE')).toBe(true);
    expect(result.findings.some(finding => finding.code === 'LEAF_ISSUER_CANDIDATES_REJECTED')).toBe(false);
  });
});

describe('strict input boundaries', () => {
  it.each(['', ' ', '-----BEGIN CERTIFICATE-----\nnot-base64\n-----END CERTIFICATE-----',
    '-----BEGIN CERTIFICATE-----\nMAA=\n-----END CERTIFICATE-----', fixtures.leaf + '\ntrailing material'])('rejects empty or malformed material without returning a partial result', async pem => {
    await expect(inspect(pem)).rejects.toBeInstanceOf(BundleInputError);
  });

  it('locates and rejects a private-key block after a valid certificate without echoing it', async () => {
    const type = 'PRIVATE KEY';
    const input = fixtures.leaf + `\n-----BEGIN ${type}-----\nDO-NOT-ECHO\n-----END ${type}-----`;
    try { await inspect(input); expect.fail('Expected input rejection'); } catch (error) {
      expect(error).toMatchObject({ reason: 'PRIVATE_KEY_REJECTED', location: { offset: fixtures.leaf.length + 1 } });
      expect(String(error)).not.toContain('DO-NOT-ECHO');
    }
  });

  it('rejects unsupported PEM types and nested or unmatched boundaries', async () => {
    await expect(inspect('-----BEGIN CERTIFICATE REQUEST-----\nMAA=\n-----END CERTIFICATE REQUEST-----')).rejects.toMatchObject({ reason: 'UNSUPPORTED_PEM_BLOCK' });
    await expect(inspect('-----BEGIN CERTIFICATE-----\nMAA=')).rejects.toMatchObject({ reason: 'INVALID_PEM' });
    await expect(inspect('-----BEGIN CERTIFICATE-----\n' + fixtures.leaf)).rejects.toMatchObject({ reason: 'INVALID_PEM' });
  });

  it('rejects trailing DER bytes rather than accepting the first certificate', async () => {
    const der = new NodeCertificate(fixtures.leaf).raw;
    const encoded = Buffer.concat([der, Buffer.from([0])]).toString('base64');
    await expect(inspect(`-----BEGIN CERTIFICATE-----\n${encoded}\n-----END CERTIFICATE-----`)).rejects.toMatchObject({ reason: 'INVALID_CERTIFICATE' });
  });

  it('accepts CRLF and surrounding whitespace', async () => {
    const result = await inspect(' \n' + fixtures.leaf.replace(/\n/g, '\r\n') + '\n\t');
    expect(result.certificates[0]!.line).toBe(2);
  });

  it('accepts the exact UTF-8 byte boundary and rejects the next byte', async () => {
    const exact = fixtures.leaf + ' '.repeat(MAX_PEM_BYTES - new TextEncoder().encode(fixtures.leaf).length);
    expect((await inspect(exact)).certificates).toHaveLength(1);
    await expect(inspect(exact + ' ')).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('sanitizes caller-controlled schema keys and preserves a general issue location', async () => {
    try {
      await checkBundle({ pem: fixtures.leaf, 'PRIVATE-UNKNOWN-FIELD': 'PRIVATE-PAYLOAD' });
      expect.fail('Expected strict request rejection');
    } catch (error) {
      const failure = (error as BundleInputError).toResponse();
      expect(failure.error.issues?.[0]?.path).toEqual([]);
      expect(JSON.stringify(failure)).not.toContain('PRIVATE-');
    }
  });

  it('rejects non-minimal DER length encodings around an otherwise valid certificate', async () => {
    const der = new NodeCertificate(fixtures.leaf).raw;
    expect(der[1]).toBe(0x82);
    const encoded = Buffer.concat([Buffer.from([0x30, 0x83, 0]), der.subarray(2)]).toString('base64');
    await expect(inspect(`-----BEGIN CERTIFICATE-----\n${encoded}\n-----END CERTIFICATE-----`)).rejects.toMatchObject({ reason: 'INVALID_CERTIFICATE' });
  });

  it('honors cancellation without exposing the caller-supplied abort reason', async () => {
    const controller = new AbortController();
    controller.abort('PRIVATE-CANCELLATION-REASON');
    await expect(checkBundle({ pem: fixtures.leaf }, clock, controller.signal)).rejects.toMatchObject({ name: 'AbortError', message: 'Certificate check cancelled.' });
  });

  it('enforces byte and certificate limits without silent truncation', async () => {
    await expect(inspect('🔥'.repeat(MAX_PEM_BYTES / 4 + 1))).rejects.toMatchObject({ reason: 'INPUT_TOO_LARGE' });
    await expect(inspect(Array(MAX_CERTIFICATES + 1).fill(fixtures.rootA).join('\n'))).rejects.toMatchObject({ reason: 'TOO_MANY_CERTIFICATES' });
    expect((await inspect(Array(MAX_CERTIFICATES).fill(fixtures.rootA).join('\n'))).certificates).toHaveLength(MAX_CERTIFICATES);
  });

  it.each([-1, 20, 1, 0.5])('rejects an invalid or CA leaf selection at position %s', async leafIndex => {
    await expect(inspect(bundle('leaf', 'intermediate'), 'service.example.com', leafIndex)).rejects.toMatchObject({
      code: 'INVALID_INPUT', issues: [{ path: ['leafIndex'] }],
    });
  });

  it('reports a CA-only bundle without inventing a leaf', async () => {
    const result = await inspect(fixtures.rootA, 'service.example.com');
    expect(result.hostname?.status).toBe('no-leaf');
    expect(result.findings.find(finding => finding.code === 'NO_LEAF_CERTIFICATE')?.severity).toBe('warning');
    expect((await inspect(fixtures.rootA)).findings.find(finding => finding.code === 'NO_LEAF_CERTIFICATE')?.severity).toBe('info');
  });
});

describe('documented DNS matching rules', () => {
  it('normalizes ASCII case and a trailing dot', () => expect(normalizeHostname(' Service.Example.Com. ')).toBe('service.example.com'));
  it.each(['https://example.com', 'example.com:443', '203.0.113.1', '2001:db8::1', '*.example.com', '中文.example', '-bad.example', 'bad_.example'])('rejects %s', value => {
    expect(() => normalizeHostname(value)).toThrow(BundleInputError);
  });
  it('allows a complete wildcard label to match exactly one label', () => {
    expect(matchesDnsName('a.example.com', '*.example.com')).toBe(true);
    expect(matchesDnsName('example.com', '*.example.com')).toBe(false);
    expect(matchesDnsName('a.b.example.com', '*.example.com')).toBe(false);
    expect(matchesDnsName('a.example.com', 'a*.example.com')).toBe(false);
    expect(matchesDnsName('a.example.com', '*.*.com')).toBe(false);
  });
});
