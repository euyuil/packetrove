import 'reflect-metadata';
import { writeFile } from 'node:fs/promises';
import {
  AuthorityKeyIdentifierExtension, BasicConstraintsExtension, KeyUsagesExtension,
  KeyUsageFlags, SubjectAlternativeNameExtension, SubjectKeyIdentifierExtension,
  X509CertificateGenerator, type X509Certificate,
} from '@peculiar/x509';

// Generate public synthetic certificates only. Private keys stay in process memory.
const signingAlgorithm = { name: 'ECDSA', hash: 'SHA-256' };
const keys = () => crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
const rootKeys = await keys();
const otherRootKeys = await keys();
const intermediateKeys = await keys();
const wrongKeys = await keys();
const rolloverKeys = await keys();
const leafKeys = await keys();
const leafTwoKeys = await keys();
let serial = 1;
const start = new Date('2020-01-01T00:00:00Z');
const end = new Date('2040-01-01T00:00:00Z');

async function root(name: string, pair: CryptoKeyPair) {
  return X509CertificateGenerator.createSelfSigned({
    name: `CN=${name},O=Packetrove Synthetic Examples`, keys: pair,
    serialNumber: (serial++).toString(16).padStart(2, '0'), notBefore: start, notAfter: end, signingAlgorithm,
    extensions: [new BasicConstraintsExtension(true, 3, true),
      new KeyUsagesExtension(KeyUsageFlags.keyCertSign | KeyUsageFlags.cRLSign, true),
      await SubjectKeyIdentifierExtension.create(pair.publicKey)],
  }, crypto);
}

async function issued(name: string, pair: CryptoKeyPair, issuer: X509Certificate, issuerKeys: CryptoKeyPair,
  options: { ca?: boolean; signingUsage?: boolean; notBefore?: Date; notAfter?: Date; sans?: string[]; authorityKey?: CryptoKey } = {}) {
  return X509CertificateGenerator.create({
    subject: name ? `CN=${name},O=Packetrove Synthetic Examples` : 'O=Packetrove Synthetic Examples', issuer: issuer.subject,
    publicKey: pair.publicKey, signingKey: issuerKeys.privateKey,
    serialNumber: (serial++).toString(16).padStart(2, '0'),
    notBefore: options.notBefore ?? start, notAfter: options.notAfter ?? end, signingAlgorithm,
    extensions: [new BasicConstraintsExtension(options.ca ?? false, options.ca ? 1 : undefined, true),
      new KeyUsagesExtension(options.ca && options.signingUsage !== false ? KeyUsageFlags.keyCertSign : KeyUsageFlags.digitalSignature, true),
      await SubjectKeyIdentifierExtension.create(pair.publicKey),
      await AuthorityKeyIdentifierExtension.create(options.authorityKey ?? issuerKeys.publicKey),
      ...(options.sans ? [new SubjectAlternativeNameExtension(options.sans.map(value => ({ type: 'dns' as const, value })))] : [])],
  }, crypto);
}

const rootA = await root('Demo Root A', rootKeys);
const rootB = await root('Demo Root B', otherRootKeys);
const rolloverRoot = await root('Demo Rollover Root', rolloverKeys);
const rollover = await issued('Demo Rollover Root', intermediateKeys, rolloverRoot, rolloverKeys, { ca: true });
const intermediate = await issued('Demo Intermediate', intermediateKeys, rootA, rootKeys, { ca: true });
const crossSigned = await issued('Demo Intermediate', intermediateKeys, rootB, otherRootKeys, { ca: true });
const wrongIntermediate = await issued('Demo Intermediate', wrongKeys, rootA, rootKeys, { ca: true });
const nonCaIssuer = await issued('Demo Non-CA Issuer', intermediateKeys, rootA, rootKeys);
const noSigningIssuer = await issued('Demo Restricted CA', intermediateKeys, rootA, rootKeys, { ca: true, signingUsage: false });
const leaf = await issued('service.example.com', leafKeys, intermediate, intermediateKeys, { sans: ['service.example.com', '*.example.net'] });
const leafTwo = await issued('other.example.com', leafTwoKeys, intermediate, intermediateKeys, { sans: ['other.example.com'] });
const expired = await issued('expired.example.com', leafKeys, intermediate, intermediateKeys, {
  sans: ['expired.example.com'], notAfter: new Date('2021-01-01T00:00:00Z'),
});
const future = await issued('future.example.com', leafKeys, intermediate, intermediateKeys, {
  sans: ['future.example.com'], notBefore: new Date('2038-01-01T00:00:00Z'),
});
const nonCaLeaf = await issued('service.example.com', leafKeys, nonCaIssuer, intermediateKeys, { sans: ['service.example.com'] });
const restrictedLeaf = await issued('service.example.com', leafKeys, noSigningIssuer, intermediateKeys, { sans: ['service.example.com'] });
const cnOnly = await issued('service.example.com', leafKeys, intermediate, intermediateKeys);
const noCommonName = await issued('', leafKeys, intermediate, intermediateKeys, { sans: ['service.example.com'] });
const keyIdMismatch = await issued('service.example.com', leafKeys, rolloverRoot, rolloverKeys, {
  sans: ['service.example.com'], authorityKey: wrongKeys.publicKey,
});
const selfSignedLeaf = await X509CertificateGenerator.createSelfSigned({
  name: rolloverRoot.subject, keys: leafKeys, serialNumber: (serial++).toString(16).padStart(2, '0'),
  notBefore: start, notAfter: end, signingAlgorithm,
  extensions: [new BasicConstraintsExtension(false, undefined, true),
    new KeyUsagesExtension(KeyUsageFlags.digitalSignature, true),
    new SubjectAlternativeNameExtension([{ type: 'dns', value: 'service.example.com' }])],
}, crypto);
const rsaAlgorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
const rsaKeys = await crypto.subtle.generateKey({ ...rsaAlgorithm, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }, false, ['sign', 'verify']);
const mixedRolloverRoot = await root('Demo Algorithm Rollover Root', rolloverKeys);
const mixedRollover = await issued('Demo Algorithm Rollover Root', rsaKeys, mixedRolloverRoot, rolloverKeys, { ca: true });
const rsaRoot = await X509CertificateGenerator.createSelfSigned({
  name: 'CN=Synthetic RSA Root,O=Packetrove Synthetic Examples', keys: rsaKeys,
  serialNumber: (serial++).toString(16).padStart(2, '0'), notBefore: start, notAfter: end, signingAlgorithm: rsaAlgorithm,
  extensions: [new BasicConstraintsExtension(true, 1, true), new KeyUsagesExtension(KeyUsageFlags.keyCertSign, true)],
}, crypto);
const rsaLeaf = await X509CertificateGenerator.create({
  subject: 'CN=rsa.example.com,O=Packetrove Synthetic Examples', issuer: rsaRoot.subject,
  publicKey: leafKeys.publicKey, signingKey: rsaKeys.privateKey,
  serialNumber: (serial++).toString(16).padStart(2, '0'), notBefore: start, notAfter: end, signingAlgorithm: rsaAlgorithm,
  extensions: [new BasicConstraintsExtension(false, undefined, true),
    new SubjectAlternativeNameExtension([{ type: 'dns', value: 'rsa.example.com' }])],
}, crypto);
const certificates = { rootA, rootB, intermediate, crossSigned, wrongIntermediate, nonCaIssuer, noSigningIssuer,
  leaf, leafTwo, expired, future, nonCaLeaf, restrictedLeaf, cnOnly, noCommonName, rsaRoot, rsaLeaf,
  rolloverRoot, rollover, keyIdMismatch, selfSignedLeaf, mixedRolloverRoot, mixedRollover };
const pem = Object.fromEntries(Object.entries(certificates).map(([name, certificate]) => [name, certificate.toString('pem')]));
await writeFile(new URL('../../contracts/src/certificate-fixtures.json', import.meta.url), JSON.stringify(pem, null, 2) + '\n');
console.log('Generated 23 synthetic public certificates. No private keys were written.');
