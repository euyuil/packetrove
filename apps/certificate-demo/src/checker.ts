import 'reflect-metadata';
import {
  AuthorityKeyIdentifierExtension, BasicConstraintsExtension, KeyUsageFlags,
  KeyUsagesExtension, SubjectAlternativeNameExtension, SubjectKeyIdentifierExtension,
  X509Certificate,
} from '@peculiar/x509';

export const MAX_PEM_BYTES = 48 * 1024;
export const MAX_CERTIFICATES = 16;
export type CheckStatus = 'verified' | 'failed' | 'unsupported' | 'unavailable';
export type FindingCode =
  | 'DUPLICATE_CERTIFICATE' | 'CERTIFICATE_EXPIRED' | 'CERTIFICATE_NOT_YET_VALID'
  | 'SELF_SIGNED_CERTIFICATE' | 'SELF_SIGNATURE_FAILED' | 'SIGNATURE_UNSUPPORTED'
  | 'SIGNATURE_CHECK_UNAVAILABLE' | 'ISSUER_NOT_IN_BUNDLE' | 'CANDIDATE_SIGNATURE_FAILED'
  | 'ISSUER_NOT_CA' | 'ISSUER_KEY_USAGE_REJECTED' | 'ISSUER_KEY_ID_MISMATCH'
  | 'MULTIPLE_ISSUERS' | 'LEAF_SELECTION_REQUIRED' | 'NO_LEAF_CERTIFICATE'
  | 'HOSTNAME_MATCH' | 'HOSTNAME_MISMATCH';

export type Finding = {
  code: FindingCode;
  severity: 'error' | 'warning' | 'info';
  certificateIndexes: number[];
  observed: string;
  evidence: Record<string, string | number | boolean | null>;
  nextAction: string;
};
export type CertificateSummary = {
  index: number;
  line: number;
  subject: string;
  issuer: string;
  serialNumber: string;
  sans: Array<{ type: string; value: string }>;
  notBefore: string;
  notAfter: string;
  ca: boolean;
  basicConstraintsPresent: boolean;
  keyCertSign: boolean | null;
  fingerprintSha256: string;
  signatureAlgorithm: string;
  selfSignature: CheckStatus | null;
};
export type IssuerRelationship = {
  childIndex: number;
  issuerIndex: number;
  signature: CheckStatus;
  issuerEligible: boolean;
  keyIdentifierMatch: boolean | null;
};
export type BundleResult = {
  evaluatedAt: string;
  certificates: CertificateSummary[];
  relationships: IssuerRelationship[];
  leafIndexes: number[];
  selectedLeafIndex: number | null;
  hostname: { expected: string; status: 'matched' | 'mismatched' | 'ambiguous' | 'no-leaf' } | null;
  findings: Finding[];
};
export type BundleRequest = { pem: string; hostname?: string; leafIndex?: number };

/** Locations refer to the original input; messages never echo PEM content. */
export class BundleInputError extends Error {
  constructor(public readonly code: string, message: string,
    public readonly location?: { line: number; offset: number; end: number }) {
    super(message);
    this.name = 'BundleInputError';
  }
}

function location(pem: string, offset: number, end = offset + 1) {
  return { line: pem.slice(0, offset).split(/\r\n|\r|\n/).length, offset, end };
}

/** Reject trailing data and indefinite/non-minimal outer DER lengths. */
function assertDerEnvelope(bytes: Uint8Array) {
  if (bytes[0] !== 0x30 || bytes.length < 2) throw new Error('Expected a DER sequence.');
  let length = bytes[1]!;
  let header = 2;
  if (length >= 128) {
    const count = length & 127;
    if (!count || count > 4 || bytes.length < 2 + count || bytes[2] === 0) throw new Error('Invalid DER length.');
    header += count;
    length = 0;
    for (let index = 2; index < header; index++) length = length * 256 + bytes[index]!;
    if (length < 128) throw new Error('Non-minimal DER length.');
  }
  if (header + length !== bytes.length) throw new Error('Incomplete DER or trailing data.');
}

function parseBundle(pem: string) {
  if (!pem.trim()) throw new BundleInputError('EMPTY_INPUT', 'Paste at least one PEM certificate.');
  if (new TextEncoder().encode(pem).length > MAX_PEM_BYTES) {
    throw new BundleInputError('INPUT_TOO_LARGE', 'PEM input must not exceed 48 KiB.');
  }
  const certificates: Array<{ certificate: X509Certificate; line: number }> = [];
  let cursor = 0;
  while (cursor < pem.length) {
    const whitespace = /^[\s\uFEFF]*/.exec(pem.slice(cursor))![0];
    cursor += whitespace.length;
    if (cursor === pem.length) break;
    const start = cursor;
    const opening = /^-----BEGIN ([A-Z0-9 ]+)-----/.exec(pem.slice(cursor));
    if (!opening) throw new BundleInputError('INVALID_PEM', 'Expected a PEM BEGIN boundary; only whitespace is allowed between blocks.', location(pem, start));
    const type = opening[1]!;
    if (type.includes('PRIVATE KEY')) throw new BundleInputError('PRIVATE_KEY_REJECTED', 'Remove the private-key block. This checker accepts certificates only.', location(pem, start, start + opening[0].length));
    if (type !== 'CERTIFICATE') throw new BundleInputError('UNSUPPORTED_PEM_BLOCK', 'Only CERTIFICATE blocks are supported.', location(pem, start, start + opening[0].length));
    cursor += opening[0].length;
    const ending = '-----END CERTIFICATE-----';
    const end = pem.indexOf(ending, cursor);
    if (end === -1) throw new BundleInputError('INVALID_PEM', 'This certificate has no matching END boundary.', location(pem, start));
    const base64 = pem.slice(cursor, end).replace(/[\t\n\r ]/g, '');
    if (!base64 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) {
      throw new BundleInputError('INVALID_PEM', 'The certificate body must contain valid padded Base64.', location(pem, cursor, end));
    }
    try {
      const binary = atob(base64);
      if (btoa(binary) !== base64) throw new Error('Non-canonical Base64.');
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
      assertDerEnvelope(bytes);
      const certificate = new X509Certificate(bytes, {
        berOptions: { maxDepth: 32, maxNodes: 4096, maxContentLength: MAX_PEM_BYTES },
      });
      // Force lazy metadata parsing within the located input-error boundary.
      certificate.subject;
      certificate.issuer;
      certificate.extensions;
      certificate.notBefore.toISOString();
      certificate.notAfter.toISOString();
      certificates.push({ certificate, line: location(pem, start).line });
    } catch {
      throw new BundleInputError('INVALID_CERTIFICATE', 'This block is not a supported, well-formed DER X.509 certificate.', location(pem, start, end + ending.length));
    }
    if (certificates.length > MAX_CERTIFICATES) throw new BundleInputError('TOO_MANY_CERTIFICATES', 'A bundle may contain at most 16 certificates; no certificates were checked.', location(pem, start));
    cursor = end + ending.length;
  }
  return certificates;
}

/** Conservative DN comparison; equivalent names with different encodings may be unresolved. */
function sameName(left: ArrayBuffer, right: ArrayBuffer) {
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  return a.length === b.length && a.every((byte, index) => byte === b[index]);
}

function algorithmName(certificate: X509Certificate) {
  try {
    const algorithm = certificate.signatureAlgorithm;
    return algorithm.name + (algorithm.hash?.name ? ' / ' + algorithm.hash.name : '');
  } catch {
    return 'Unsupported signature algorithm';
  }
}

async function verifySignature(child: X509Certificate, issuer: X509Certificate): Promise<CheckStatus> {
  try {
    // Import explicitly: the library otherwise collapses key-import errors into false.
    const algorithm = { ...issuer.publicKey.algorithm, ...child.signatureAlgorithm };
    const key = await issuer.publicKey.export(algorithm, ['verify'], globalThis.crypto);
    return await child.verify({ publicKey: key, signatureOnly: true }, globalThis.crypto) ? 'verified' : 'failed';
  } catch (error) {
    if (error instanceof Error && error.name === 'NotSupportedError') return 'unsupported';
    if (error instanceof Error && error.name === 'DataError') return 'failed';
    if (error instanceof Error && /unsupported|not supported|cannot convert/i.test(error.message)) return 'unsupported';
    return 'unavailable';
  }
}

/** The prototype accepts ASCII DNS names, including pre-converted IDNA A-labels. */
export function normalizeHostname(value: string) {
  const hostname = value.trim().toLowerCase().replace(/\.$/, '');
  if (!hostname || hostname.length > 253 || /^[\d.]+$/.test(hostname)
    || !hostname.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    throw new BundleInputError('INVALID_HOSTNAME', 'Use an ASCII DNS hostname without a URL, port, IP address, or wildcard. Convert internationalized names to punycode first.');
  }
  return hostname;
}

export function matchesDnsName(hostname: string, presented: string) {
  // A certificate SAN is already an ASCII name; invalid labels cannot match.
  const name = presented.toLowerCase();
  if (name.startsWith('*.')) {
    const labels = hostname.split('.');
    const suffix = name.slice(2);
    try { if (normalizeHostname(suffix) !== suffix) return false; } catch { return false; }
    return labels.length === suffix.split('.').length + 1 && labels.slice(1).join('.') === suffix;
  }
  try { return normalizeHostname(name) === name && hostname === name; } catch { return false; }
}

export async function checkBundle(request: BundleRequest, evaluatedAt = new Date()): Promise<BundleResult> {
  if (!Number.isFinite(evaluatedAt.getTime())) throw new BundleInputError('INVALID_TIME', 'The evaluation time must be a valid date.');
  if (!globalThis.crypto?.subtle) throw new BundleInputError('CRYPTO_UNAVAILABLE', 'Web Crypto is unavailable. Open the demo on localhost or another secure context.');
  const parsed = parseBundle(request.pem);
  const expected = request.hostname?.trim() ? normalizeHostname(request.hostname) : null;
  const findings: Finding[] = [];
  const relationships: IssuerRelationship[] = [];
  const add = (code: FindingCode, severity: Finding['severity'], certificateIndexes: number[],
    observed: string, evidence: Finding['evidence'], nextAction: string) => {
    findings.push({ code, severity, certificateIndexes, observed, evidence, nextAction });
  };
  const certificates: CertificateSummary[] = [];
  const firstByFingerprint = new Map<string, number>();
  const uniqueIndexes: number[] = [];
  for (const [index, { certificate, line }] of parsed.entries()) {
    const constraints = certificate.getExtension(BasicConstraintsExtension);
    const usage = certificate.getExtension(KeyUsagesExtension);
    const fingerprintSha256 = Array.from(new Uint8Array(await certificate.getThumbprint('SHA-256', globalThis.crypto)),
      value => value.toString(16).padStart(2, '0').toUpperCase()).join(':');
    const summary: CertificateSummary = {
      index, line, subject: certificate.subject, issuer: certificate.issuer,
      serialNumber: certificate.serialNumber,
      sans: certificate.getExtension(SubjectAlternativeNameExtension)?.names.items.map(name => ({ type: name.type, value: name.value })) ?? [],
      notBefore: certificate.notBefore.toISOString(), notAfter: certificate.notAfter.toISOString(),
      ca: constraints?.ca ?? false, basicConstraintsPresent: constraints !== null,
      keyCertSign: usage ? Boolean(usage.usages & KeyUsageFlags.keyCertSign) : null,
      fingerprintSha256, signatureAlgorithm: algorithmName(certificate), selfSignature: null,
    };
    certificates.push(summary);
    const previous = firstByFingerprint.get(fingerprintSha256);
    if (previous !== undefined) add('DUPLICATE_CERTIFICATE', 'info', [previous, index],
      'These positions contain the same certificate.', { fingerprintSha256 }, 'Remove the duplicate if it is unintended.');
    else { firstByFingerprint.set(fingerprintSha256, index); uniqueIndexes.push(index); }
    if (evaluatedAt > certificate.notAfter) add('CERTIFICATE_EXPIRED', 'error', [index],
      'The evaluation time is after notAfter.', { evaluatedAt: evaluatedAt.toISOString(), notAfter: summary.notAfter }, 'Renew or replace this certificate; check which certificate the deployment serves.');
    if (evaluatedAt < certificate.notBefore) add('CERTIFICATE_NOT_YET_VALID', 'error', [index],
      'The evaluation time is before notBefore.', { evaluatedAt: evaluatedAt.toISOString(), notBefore: summary.notBefore }, 'Check the clock and certificate activation date.');
  }
  for (const childIndex of uniqueIndexes) {
    const child = parsed[childIndex]!.certificate;
    const childSummary = certificates[childIndex]!;
    const selfIssued = sameName(child.subjectName.toArrayBuffer(), child.issuerName.toArrayBuffer());
    if (selfIssued) {
      childSummary.selfSignature = await verifySignature(child, child);
      const status = childSummary.selfSignature;
      if (status === 'verified') add('SELF_SIGNED_CERTIFICATE', 'info', [childIndex],
        'The certificate verifies with its own public key.', { subject: child.subject, signature: status }, 'A self-signature does not establish client trust. Check the intended trust configuration separately.');
      else add(status === 'failed' ? 'SELF_SIGNATURE_FAILED' : status === 'unsupported' ? 'SIGNATURE_UNSUPPORTED' : 'SIGNATURE_CHECK_UNAVAILABLE',
        'warning', [childIndex], 'The self-issued certificate has no verified self-signature.', { signature: status, algorithm: childSummary.signatureAlgorithm }, 'Inspect the certificate and verify the algorithm with another implementation.');
    }
    const candidates = uniqueIndexes.filter(index => index !== childIndex
      && sameName(child.issuerName.toArrayBuffer(), parsed[index]!.certificate.subjectName.toArrayBuffer()));
    for (const issuerIndex of candidates) {
      const issuer = parsed[issuerIndex]!.certificate;
      const issuerSummary = certificates[issuerIndex]!;
      const signature = await verifySignature(child, issuer);
      const authorityId = child.getExtension(AuthorityKeyIdentifierExtension)?.keyId;
      const subjectId = issuer.getExtension(SubjectKeyIdentifierExtension)?.keyId;
      const keyIdentifierMatch = authorityId && subjectId ? authorityId.toLowerCase() === subjectId.toLowerCase() : null;
      const issuerEligible = issuerSummary.ca && issuerSummary.keyCertSign !== false;
      relationships.push({ childIndex, issuerIndex, signature, issuerEligible, keyIdentifierMatch });
      if (signature !== 'verified') add(signature === 'failed' ? 'CANDIDATE_SIGNATURE_FAILED'
        : signature === 'unsupported' ? 'SIGNATURE_UNSUPPORTED' : 'SIGNATURE_CHECK_UNAVAILABLE', 'warning', [childIndex, issuerIndex],
      'This candidate issuer link was not cryptographically verified.', { signature, algorithm: childSummary.signatureAlgorithm }, 'Inspect this candidate link. Other candidate links are checked independently.');
      if (!issuerSummary.ca) add('ISSUER_NOT_CA', 'warning', [childIndex, issuerIndex],
        'The candidate issuer does not assert basicConstraints CA=true.', { signature, ca: issuerSummary.ca, basicConstraintsPresent: issuerSummary.basicConstraintsPresent }, 'Use the intended CA certificate for this candidate issuer.');
      if (issuerSummary.keyCertSign === false) add('ISSUER_KEY_USAGE_REJECTED', 'warning', [childIndex, issuerIndex],
        'Key Usage is present but keyCertSign is not set.', { signature, keyCertSign: false }, 'Check the issuing certificate and its permitted key usages.');
      if (keyIdentifierMatch === false) add('ISSUER_KEY_ID_MISMATCH', 'warning', [childIndex, issuerIndex],
        'The authority and subject key identifiers differ.', { authorityKeyIdentifier: authorityId!, subjectKeyIdentifier: subjectId! }, 'Inspect the intended issuer and alternative candidates.');
    }
    if (!candidates.length && !selfIssued) add('ISSUER_NOT_IN_BUNDLE', 'info', [childIndex],
      'No certificate with the encoded issuer name was found in this input.', { issuer: child.issuer }, 'If a server actually serves this bundle, check its full-chain configuration. Roots are normally omitted; this observation alone does not prove a broken chain.');
    const viable = relationships.filter(link => link.childIndex === childIndex && link.signature === 'verified'
      && link.issuerEligible && link.keyIdentifierMatch !== false);
    if (viable.length > 1) add('MULTIPLE_ISSUERS', 'info', [childIndex, ...viable.map(link => link.issuerIndex)],
      'More than one supplied issuer passes the local link checks.', { candidateCount: viable.length }, 'Inspect the alternatives; this checker does not select an authoritative trust path.');
  }
  // Duplicate certificates retain their positions without creating extra leaves or links.
  for (const summary of certificates) summary.selfSignature = certificates[firstByFingerprint.get(summary.fingerprintSha256)!]!.selfSignature;
  const leafIndexes = uniqueIndexes.filter(index => !certificates[index]!.ca);
  let selectedLeafIndex: number | null = leafIndexes.length === 1 ? leafIndexes[0]! : null;
  if (request.leafIndex !== undefined) {
    if (!Number.isInteger(request.leafIndex) || request.leafIndex < 0 || request.leafIndex >= certificates.length || certificates[request.leafIndex]!.ca) {
      throw new BundleInputError('INVALID_LEAF_SELECTION', 'Select an original input position containing a non-CA certificate.');
    }
    selectedLeafIndex = request.leafIndex;
  }
  if (leafIndexes.length > 1 && selectedLeafIndex === null) add('LEAF_SELECTION_REQUIRED', 'info', leafIndexes,
    'More than one non-CA certificate is present.', { candidateCount: leafIndexes.length }, 'Select the intended leaf before checking a hostname.');
  if (!leafIndexes.length) add('NO_LEAF_CERTIFICATE', 'info', uniqueIndexes,
    'No non-CA certificate is present.', {}, 'Supply a leaf certificate if hostname checking is required.');
  let hostname: BundleResult['hostname'] = null;
  if (expected) {
    if (selectedLeafIndex === null) hostname = { expected, status: leafIndexes.length ? 'ambiguous' : 'no-leaf' };
    else {
      const names = certificates[selectedLeafIndex]!.sans.filter(name => name.type === 'dns').map(name => name.value);
      const matched = names.some(name => matchesDnsName(expected, name));
      hostname = { expected, status: matched ? 'matched' : 'mismatched' };
      add(matched ? 'HOSTNAME_MATCH' : 'HOSTNAME_MISMATCH', matched ? 'info' : 'error', [selectedLeafIndex],
        matched ? 'The expected hostname matches a DNS SAN on the selected leaf.' : 'The expected hostname matches no DNS SAN on the selected leaf.',
        { expectedHostname: expected, dnsSubjectAlternativeNames: names.join(', ') || '(none)' },
        matched ? 'This identity check does not establish chain validity or client trust.' : 'Check the hostname or obtain a certificate with the required DNS SAN. Common Name is not used as a fallback.');
    }
  }
  return { evaluatedAt: evaluatedAt.toISOString(), certificates, relationships, leafIndexes, selectedLeafIndex, hostname, findings };
}
