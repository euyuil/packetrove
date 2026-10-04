import { X509Certificate as NodeCertificate } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BundleInputError, checkBundle, matchesDnsName, MAX_CERTIFICATES, MAX_PEM_BYTES, normalizeHostname } from './checker';
import { bundle, fixtures } from './examples';

const clock = new Date('2026-10-04T06:00:00Z');
const inspect = (pem: string, hostname?: string, leafIndex?: number) => checkBundle({
  pem, ...(hostname === undefined ? {} : { hostname }), ...(leafIndex === undefined ? {} : { leafIndex }),
}, clock);
afterEach(() => vi.restoreAllMocks());

describe('certificate bundle diagnostics', () => {
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
    expect(result.findings.find(finding => finding.code === 'ISSUER_NOT_IN_BUNDLE')?.certificateIndexes).toEqual([0]);
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
  });

  it('reports unexpected verification failures as incomplete checks', async () => {
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValue(new Error('Provider interrupted'));
    const result = await inspect(bundle('leaf', 'intermediate'));
    expect(result.relationships[0]!.signature).toBe('unavailable');
    expect(result.findings.some(finding => finding.code === 'SIGNATURE_CHECK_UNAVAILABLE')).toBe(true);
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
      expect(error).toMatchObject({ code: 'PRIVATE_KEY_REJECTED', location: { offset: fixtures.leaf.length + 1 } });
      expect(String(error)).not.toContain('DO-NOT-ECHO');
    }
  });

  it('rejects unsupported PEM types and nested or unmatched boundaries', async () => {
    await expect(inspect('-----BEGIN CERTIFICATE REQUEST-----\nMAA=\n-----END CERTIFICATE REQUEST-----')).rejects.toMatchObject({ code: 'UNSUPPORTED_PEM_BLOCK' });
    await expect(inspect('-----BEGIN CERTIFICATE-----\nMAA=')).rejects.toMatchObject({ code: 'INVALID_PEM' });
    await expect(inspect('-----BEGIN CERTIFICATE-----\n' + fixtures.leaf)).rejects.toMatchObject({ code: 'INVALID_PEM' });
  });

  it('rejects trailing DER bytes rather than accepting the first certificate', async () => {
    const der = new NodeCertificate(fixtures.leaf).raw;
    const encoded = Buffer.concat([der, Buffer.from([0])]).toString('base64');
    await expect(inspect(`-----BEGIN CERTIFICATE-----\n${encoded}\n-----END CERTIFICATE-----`)).rejects.toMatchObject({ code: 'INVALID_CERTIFICATE' });
  });

  it('accepts CRLF and surrounding whitespace', async () => {
    const result = await inspect(' \n' + fixtures.leaf.replace(/\n/g, '\r\n') + '\n\t');
    expect(result.certificates[0]!.line).toBe(2);
  });

  it('enforces byte and certificate limits without silent truncation', async () => {
    await expect(inspect('🔥'.repeat(MAX_PEM_BYTES / 4 + 1))).rejects.toMatchObject({ code: 'INPUT_TOO_LARGE' });
    await expect(inspect(Array(MAX_CERTIFICATES + 1).fill(fixtures.rootA).join('\n'))).rejects.toMatchObject({ code: 'TOO_MANY_CERTIFICATES' });
    expect((await inspect(Array(MAX_CERTIFICATES).fill(fixtures.rootA).join('\n'))).certificates).toHaveLength(MAX_CERTIFICATES);
  });

  it.each([-1, 20, 1, 0.5])('rejects an invalid or CA leaf selection at position %s', async leafIndex => {
    await expect(inspect(bundle('leaf', 'intermediate'), 'service.example.com', leafIndex)).rejects.toMatchObject({ code: 'INVALID_LEAF_SELECTION' });
  });

  it('reports a CA-only bundle without inventing a leaf', async () => {
    expect((await inspect(fixtures.rootA, 'service.example.com')).hostname?.status).toBe('no-leaf');
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
