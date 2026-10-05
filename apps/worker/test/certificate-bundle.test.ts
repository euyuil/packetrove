import { exports } from 'cloudflare:workers';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as LegacyClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as LegacyTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport as LegacyTransportContract } from '@modelcontextprotocol/sdk/shared/transport.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CERTIFICATE_BUNDLE_SAMPLES, CertificateBundleResultSchema, ErrorResponseSchema,
  certificateFixtures, MAX_REQUEST_BYTES, toolCatalog,
} from '@packetrove/contracts';
import { checkCertificateBundle, CertificateBundleInputError } from '@packetrove/core/certificate-bundle';
import { createApp } from '../src/app';
import { createToolExecutor, toolHandlers } from '../src/tools';

const tool = toolCatalog.certificate;
const workerFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  request.headers.set('host', new URL(request.url).host);
  const response = await exports.default.fetch(request);
  expect(response.headers.get('cache-control')).toContain('no-store');
  return response;
};

async function connect(runtime: 'current' | 'legacy') {
  if (runtime === 'legacy') {
    const client = new LegacyClient({ name: 'certificate-tests', version: '0.1.0' });
    await client.connect(new LegacyTransport(new URL('http://localhost/mcp'), { fetch: workerFetch }) as LegacyTransportContract);
    return client;
  }
  const client = new Client({ name: 'certificate-tests', version: '0.1.0' }, { versionNegotiation: { mode: 'auto' } });
  await client.connect(new StreamableHTTPClientTransport(new URL('http://localhost/mcp'), { fetch: workerFetch }));
  return client;
}

const post = (request: unknown) => exports.default.fetch(`http://localhost${tool.api.path}`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request),
});
async function verifyObservation(value: unknown, request: unknown, started: number) {
  const observation = CertificateBundleResultSchema.parse(value);
  expect(Date.parse(observation.evaluatedAt)).toBeGreaterThanOrEqual(started);
  expect(Date.parse(observation.evaluatedAt)).toBeLessThanOrEqual(Date.now());
  expect(observation).toEqual(await checkCertificateBundle(request, new Date(observation.evaluatedAt)));
  return observation;
}

afterEach(() => vi.restoreAllMocks());
describe('certificate API and MCP share browser-local diagnostics', () => {
  it.each(CERTIFICATE_BUNDLE_SAMPLES)('returns the shared current-clock API observation for $name', async ({ request }) => {
    const started = Date.now();
    const response = await post(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await verifyObservation(await response.json(), request, started);
  });
  it('verifies an RSA SHA-256 signature in the actual Workers crypto runtime', async () => {
    const response = await post({ pem: certificateFixtures.rsaLeaf + '\n' + certificateFixtures.rsaRoot, hostname: 'rsa.example.com' });
    expect(response.status).toBe(200);
    const result = CertificateBundleResultSchema.parse(await response.json());
    expect(result.relationships[0]).toMatchObject({ signature: 'verified', issuerEligible: true });
    expect(result.certificates[1]!.selfSignature).toBe('verified');
    expect(result.hostname?.status).toBe('matched');
  });
  it.each(['current', 'legacy'] as const)('returns all ten shared observations through the %s MCP client', async runtime => {
    const client = await connect(runtime);
    try {
      for (const { request } of CERTIFICATE_BUNDLE_SAMPLES) {
        const started = Date.now();
        const response = await client.callTool({ name: tool.mcp.name, arguments: request });
        expect(response.isError).not.toBe(true);
        const result = await verifyObservation(response.structuredContent, request, started);
        expect(response.content).toEqual([{ type: 'text', text: JSON.stringify(result) }, tool.mcp.resultLink]);
      }
    } finally { await client.close(); }
  });

  it.each([
    { names: ['leaf', 'wrongIntermediate', 'rootA'], hostname: 'service.example.com', code: 'LEAF_ISSUER_CANDIDATES_REJECTED', severity: 'error', leafIndex: 0 },
    { names: ['restrictedLeaf', 'noSigningIssuer', 'rootA'], hostname: 'service.example.com', code: 'LEAF_ISSUER_CANDIDATES_REJECTED', severity: 'error', leafIndex: 0 },
    { names: ['rollover', 'rolloverRoot'], code: 'SELF_ISSUED_CERTIFICATE', severity: 'info' },
    { names: ['mixedRollover', 'mixedRolloverRoot'], code: 'SELF_ISSUED_CERTIFICATE', severity: 'info' },
    { names: ['keyIdMismatch', 'rolloverRoot'], code: 'ISSUER_KEY_ID_MISMATCH', severity: 'warning' },
    { names: ['rootA'], hostname: 'service.example.com', code: 'NO_LEAF_CERTIFICATE', severity: 'warning' },
    { names: ['leaf', 'leafTwo', 'intermediate'], hostname: 'service.example.com', code: 'LEAF_SELECTION_REQUIRED', severity: 'warning' },
  ] as const)('returns the same contextual severity through API and MCP (%#)', async scenario => {
    const request = { pem: scenario.names.map(name => certificateFixtures[name]).join('\n'),
      ...('hostname' in scenario ? { hostname: scenario.hostname } : {}), ...('leafIndex' in scenario ? { leafIndex: scenario.leafIndex } : {}) };
    const started = Date.now();
    const response = await post(request);
    expect(response.status).toBe(200);
    const api = await verifyObservation(await response.json(), request, started);
    expect(api.findings.find(finding => finding.code === scenario.code)?.severity).toBe(scenario.severity);
    const client = await connect('current');
    try {
      const response = await client.callTool({ name: tool.mcp.name, arguments: request });
      expect(response.isError).not.toBe(true);
      const result = await verifyObservation(response.structuredContent, request, started);
      expect(result.findings.find(finding => finding.code === scenario.code)?.severity).toBe(scenario.severity);
      expect(response.content).toEqual([{ type: 'text', text: JSON.stringify(result) }, tool.mcp.resultLink]);
    } finally { await client.close(); }
  });

  it.each([
    { pem: '' },
    { pem: certificateFixtures.leaf + '\n-----BEGIN PRIVATE KEY-----\nPRIVATE-PAYLOAD\n-----END PRIVATE KEY-----' },
    { pem: certificateFixtures.leaf + '\nINVALID-TAIL' },
    { pem: '-----BEGIN CERTIFICATE-----\nMAA=\n-----END CERTIFICATE-----' },
    { pem: certificateFixtures.leaf, hostname: 'https://private.example' },
    { pem: certificateFixtures.rootA, leafIndex: 0 },
    { pem: certificateFixtures.leaf, 'PRIVATE-UNKNOWN-FIELD': 'PRIVATE-PAYLOAD' },
  ])('preserves located API/MCP errors without partial results or private input echoes (%#)', async request => {
    const api = await post(request);
    expect(api.status).toBe(400);
    expect(api.headers.get('cache-control')).toBe('no-store');
    const failure = ErrorResponseSchema.parse(await api.json());
    const text = JSON.stringify(failure);
    for (const sensitive of ['PRIVATE-PAYLOAD', 'PRIVATE-UNKNOWN-FIELD', 'private.example', certificateFixtures.leaf]) {
      expect(text).not.toContain(sensitive);
    }
    const client = await connect('current');
    try {
      const result = await client.callTool({ name: tool.mcp.name, arguments: request });
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toBeUndefined();
      expect(result.content).toEqual([{ type: 'text', text: JSON.stringify(failure) }]);
    } finally { await client.close(); }
  });

  it.each([
    { method: 'GET', status: 405 },
    { method: 'POST', body: '{', status: 400, type: 'application/json' },
    { method: 'POST', body: '{}', status: 415, type: 'text/plain' },
    { method: 'POST', body: ' '.repeat(MAX_REQUEST_BYTES + 1), status: 413, type: 'application/json' },
  ])('keeps transport failure $status out of caches', async ({ method, body, status, type }) => {
    const response = await exports.default.fetch(`http://localhost${tool.api.path}`, {
      method, ...(body ? { body } : {}), headers: { ...(type ? { 'content-type': type } : {}) },
    });
    expect(response.status).toBe(status);
    expect(response.headers.get('cache-control')).toBe('no-store');
    ErrorResponseSchema.parse(await response.json());
  });

  it('uses HTTP 500 for an unavailable crypto runtime, with the same controlled error as MCP', async () => {
    const error = new CertificateBundleInputError('CRYPTO_UNAVAILABLE', 'Web Crypto is unavailable.');
    const app = createApp(createToolExecutor({ ...toolHandlers, certificate: async () => { throw error; } }));
    const response = await app.request(`http://localhost${tool.api.path}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(tool.example.request),
    });
    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(error.toResponse());
  });

  it('excludes certificate contents and expected hostnames from application logs', async () => {
    const logs = [vi.spyOn(console, 'log'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')];
    logs.forEach(log => log.mockImplementation(() => {}));
    await post(tool.example.request);
    const client = await connect('current');
    try {
      await client.callTool({ name: tool.mcp.name, arguments: tool.example.request });
      await client.callTool({ name: tool.mcp.name, arguments: { pem: 'PRIVATE-PAYLOAD' } });
    } finally { await client.close(); }
    const text = JSON.stringify(logs.flatMap(log => log.mock.calls));
    expect(text).not.toContain('PRIVATE-PAYLOAD');
    expect(text).not.toContain(tool.example.request.pem);
    expect(text).not.toContain(tool.example.request.hostname);
  });
});
