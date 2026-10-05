import { env } from 'cloudflare:workers';
import { applyD1Migrations, type D1Migration } from 'cloudflare:test';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as LegacyClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as LegacyTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport as LegacyTransportContract } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, inject, it, vi } from 'vitest';
import {
  FEEDBACK_EXAMPLES, FeedbackErrorResponseSchema, FeedbackReceiptSchema, MAX_FEEDBACK_BYTES,
  operationCatalog, tools, FeedbackRequestSchema,
} from '@packetrove/contracts';
import { z } from 'zod';
import { createApp } from '../src/app';
import { cleanupFeedback, createFeedbackExecutor, FeedbackError,
  type FeedbackBindings, type FeedbackStore } from '../src/feedback';
import { createToolExecutionContext } from '../src/tool-context';

declare module 'vitest' { interface ProvidedContext { feedbackMigrations: D1Migration[] } }
const database = (env as FeedbackBindings).FEEDBACK_DB!;
const bindings = { PACKETROVE_FEEDBACK_ENABLED: 'true', PACKETROVE_FEEDBACK_IP_KEY: 'x'.repeat(32), FEEDBACK_DB: database };
const report = FEEDBACK_EXAMPLES[0].request;
const context = (ip = '203.0.113.1', signal?: AbortSignal) => createToolExecutionContext(
  new Request('http://localhost/mcp', { headers: { 'cf-connecting-ip': ip } }), signal);
const counts = async () => ({
  reports: (await database.prepare('SELECT COUNT(*) AS count FROM feedback_reports').first<{ count: number }>())!.count,
  admissions: (await database.prepare('SELECT COUNT(*) AS count FROM feedback_admissions').first<{ count: number }>())!.count,
});

beforeEach(async () => {
  await applyD1Migrations(database, inject('feedbackMigrations'));
  await database.exec('DROP TRIGGER IF EXISTS synthetic_failure');
  await database.batch([
    database.prepare('DELETE FROM feedback_reports'),
    database.prepare('DELETE FROM feedback_admissions'),
  ]);
});

describe('private feedback admission', () => {
  it('stores one bounded report and public version, with no IP or linking quota key', async () => {
    const result = await createFeedbackExecutor(bindings)(report, context());
    expect(FeedbackReceiptSchema.parse(result)).toEqual(result);
    const stored = await database.prepare('SELECT * FROM feedback_reports').first();
    expect(JSON.parse(stored!.report as string)).toEqual(report);
    expect(stored?.receipt_id).toBe(result.receipt_id);
    expect(Object.keys(stored!).sort()).toEqual(['accepted_at', 'expires_at', 'receipt_id', 'report', 'service_version']);
    const admission = await database.prepare('SELECT * FROM feedback_admissions').first<{ ip_digest: string; accepted_at: number }>();
    expect(admission!.ip_digest).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(admission)).not.toContain('203.0.113.1');
    expect(await counts()).toEqual({ reports: 1, admissions: 1 });
  });
  it('atomically accepts only ten concurrent submissions for one exit IP', async () => {
    const submit = createFeedbackExecutor(bindings);
    const results = await Promise.allSettled(Array.from({ length: 15 }, () => submit(report, context())));
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(10);
    for (const result of results) if (result.status === 'rejected') {
      expect(result.reason).toBeInstanceOf(FeedbackError);
      expect(result.reason.toResponse()).toMatchObject({ error: { code: 'RATE_LIMITED', delivery: 'not_accepted' } });
      expect(result.reason.retryAfter).toBeGreaterThan(0);
    }
    expect(await counts()).toEqual({ reports: 10, admissions: 10 });
  });
  it('uses a rolling window and canonical IPv6 rather than dates or spelling', async () => {
    const submit = createFeedbackExecutor(bindings);
    for (let index = 0; index < 10; index++) await submit(report, context('2001:db8::1'));
    await expect(submit(report, context('2001:0DB8:0000:0000:0000:0000:0000:0001'))).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    // Still inside the previous 24 hours, regardless of whether UTC midnight passed.
    await database.prepare("UPDATE feedback_admissions SET accepted_at = CAST(unixepoch('subsec') * 1000 AS INTEGER) - 86340000").run();
    await expect(submit(report, context('2001:db8::1'))).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    await database.prepare("UPDATE feedback_admissions SET accepted_at = CAST(unixepoch('subsec') * 1000 AS INTEGER) - 86400000").run();
    await expect(submit(report, context('2001:db8::1'))).resolves.toMatchObject({ status: 'accepted' });
    expect((await counts()).admissions).toBe(1);
  });
  it('does not refund quota when reports are deleted, and leaves other exits independent', async () => {
    const submit = createFeedbackExecutor(bindings);
    for (let index = 0; index < 10; index++) await submit(report, context());
    await database.prepare('DELETE FROM feedback_reports').run();
    await expect(submit(report, context())).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    await expect(submit(report, context('203.0.113.2'))).resolves.toMatchObject({ status: 'accepted' });
    expect(await counts()).toEqual({ reports: 1, admissions: 11 });
  });
  it('enforces the global daily budget without storing rejected connection markers', async () => {
    await database.batch(Array.from({ length: 100 }, () => database.prepare(
      "INSERT INTO feedback_admissions VALUES ('synthetic-other-exit', CAST(unixepoch('subsec') * 1000 AS INTEGER))")));
    await expect(createFeedbackExecutor(bindings)(report, context())).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    expect(await counts()).toEqual({ reports: 0, admissions: 100 });
  });
  it('enforces the global daily budget atomically across concurrent exit IPs', async () => {
    await database.batch(Array.from({ length: 99 }, () => database.prepare(
      "INSERT INTO feedback_admissions VALUES ('synthetic-other-exit', CAST(unixepoch('subsec') * 1000 AS INTEGER))")));
    const submit = createFeedbackExecutor(bindings);
    const results = await Promise.allSettled(Array.from({ length: 15 }, (_, index) => submit(report, context(`203.0.113.${index + 1}`))));
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(await counts()).toEqual({ reports: 1, admissions: 100 });
  });
  it('bounds all stored bodies, including bodies waiting for expiry cleanup', async () => {
    await database.batch(Array.from({ length: 1000 }, (_, index) => database.prepare(
      "INSERT INTO feedback_reports VALUES (?, ?, ?, CAST(unixepoch('subsec') * 1000 AS INTEGER), CAST(unixepoch('subsec') * 1000 AS INTEGER) + 1000)")
      .bind(String(index), '{}', 'synthetic')));
    await expect(createFeedbackExecutor(bindings)(report, context())).rejects.toMatchObject({ code: 'FEEDBACK_UNAVAILABLE' });
    expect(await counts()).toEqual({ reports: 1000, admissions: 0 });
    await database.prepare("UPDATE feedback_reports SET expires_at = CAST(unixepoch('subsec') * 1000 AS INTEGER)").run();
    await expect(createFeedbackExecutor(bindings)(report, context())).resolves.toMatchObject({ status: 'accepted' });
    expect(await counts()).toEqual({ reports: 1, admissions: 1 });
  });
  it('cleans old quota events on admission without relying on cron', async () => {
    await database.batch(Array.from({ length: 300 }, () => database.prepare(
      "INSERT INTO feedback_admissions VALUES ('synthetic-expired-exit', CAST(unixepoch('subsec') * 1000 AS INTEGER) - 86400000)")));
    await createFeedbackExecutor(bindings)(report, context());
    expect(await counts()).toEqual({ reports: 1, admissions: 1 });
  });
  it('rolls the complete transaction back if quota recording fails', async () => {
    await database.exec("CREATE TRIGGER synthetic_failure BEFORE INSERT ON feedback_admissions BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END;");
    await expect(createFeedbackExecutor(bindings)(report, context())).rejects.toMatchObject({ code: 'DELIVERY_UNCERTAIN', delivery: 'unknown' });
    expect(await counts()).toEqual({ reports: 0, admissions: 0 });
  });
  it('cleans expired reports and quota separately when submissions are disabled', async () => {
    await createFeedbackExecutor(bindings)(report, context());
    await database.prepare("UPDATE feedback_reports SET expires_at = CAST(unixepoch('subsec') * 1000 AS INTEGER)").run();
    await cleanupFeedback(database);
    expect(await counts()).toEqual({ reports: 0, admissions: 1 });
    await database.prepare("UPDATE feedback_admissions SET accepted_at = CAST(unixepoch('subsec') * 1000 AS INTEGER) - 86400000").run();
    await cleanupFeedback(database);
    expect(await counts()).toEqual({ reports: 0, admissions: 0 });
  });
  it('fails closed without trusted metadata or configuration and respects Pseudo IPv4', async () => {
    const missing = createToolExecutionContext(new Request('http://localhost/mcp', { headers: { 'x-forwarded-for': '203.0.113.1' } }));
    await expect(createFeedbackExecutor(bindings)(report, missing)).rejects.toMatchObject({ code: 'FEEDBACK_UNAVAILABLE' });
    await expect(createFeedbackExecutor({ PACKETROVE_FEEDBACK_ENABLED: 'true', FEEDBACK_DB: database })(report, context())).rejects.toMatchObject({ code: 'FEEDBACK_UNAVAILABLE' });
    const pseudo = createToolExecutionContext(new Request('http://localhost/mcp', {
      headers: { 'cf-connecting-ip': '240.0.0.1', 'cf-connecting-ipv6': '2001:db8::1' },
    }));
    await createFeedbackExecutor(bindings)(report, pseudo);
    await createFeedbackExecutor(bindings)(report, context('2001:db8::1'));
    const distinct = await database.prepare('SELECT COUNT(DISTINCT ip_digest) AS count FROM feedback_admissions').first<{ count: number }>();
    expect(distinct?.count).toBe(1);
  });
});

describe('feedback validation and write cancellation', () => {
  it.each([
    { ...report, category: 'other' }, { ...report, tool_name: 'invented-tool' },
    { ...report, 'synthetic-sensitive-unknown-field': 'synthetic secret' },
    { ...report, summary: 'x'.repeat(257) }, { ...report, actual: 'x'.repeat(1025) },
    { ...report, synthetic_reproduction: 'x'.repeat(2049) },
    { category: 'bug', summary: 'Synthetic bug', actual: 'Synthetic actual' },
    { category: 'feature_request', summary: 'Synthetic feature', actual: 'Invented failure' },
  ])('rejects malformed reports without writing or echoing content', async input => {
    const error = await createFeedbackExecutor(bindings)(input, context()).catch(error => error as FeedbackError);
    expect(error).toBeInstanceOf(FeedbackError);
    expect(JSON.stringify((error as FeedbackError).toResponse())).not.toContain('synthetic-sensitive');
    expect(await counts()).toEqual({ reports: 0, admissions: 0 });
  });
  it('counts Unicode code points and enforces the actual serialized byte budget', async () => {
    expect(FeedbackRequestSchema.safeParse({ category: 'feature_request', summary: '😀'.repeat(256) }).success).toBe(true);
    const large = { category: 'bug', summary: '😀'.repeat(256), expected: '😀'.repeat(1024), actual: '😀'.repeat(1024) };
    expect(new TextEncoder().encode(JSON.stringify(large)).byteLength).toBeGreaterThan(MAX_FEEDBACK_BYTES);
    await expect(createFeedbackExecutor(bindings)(large, context())).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  });
  it('does not start a cancelled write, but preserves success after commit', async () => {
    const controller = new AbortController();
    const accept = vi.fn(async () => { controller.abort('synthetic abort reason'); return { accepted: true as const }; });
    const store: FeedbackStore = { ready: async () => {}, accept, hasReceipt: async () => false };
    const submit = createFeedbackExecutor(bindings, store);
    await expect(submit(report, context('203.0.113.1', controller.signal))).resolves.toMatchObject({ status: 'accepted' });
    await expect(submit(report, context('203.0.113.1', controller.signal))).rejects.toMatchObject({ delivery: 'not_accepted' });
    expect(accept).toHaveBeenCalledTimes(1);
  });
  it.each([false, true])('handles a lost acknowledgement with receipt present=%s without resending', async present => {
    const accept = vi.fn(async () => { throw new Error('synthetic private exception'); });
    const store: FeedbackStore = { ready: async () => {}, accept, hasReceipt: async () => present };
    const result = await createFeedbackExecutor(bindings, store)(report, context()).catch(error => error as FeedbackError);
    if (present) expect(result).toMatchObject({ status: 'accepted' });
    else expect((result as FeedbackError).toResponse()).toEqual({ error: {
      code: 'DELIVERY_UNCERTAIN', delivery: 'unknown', message: 'The report may have been accepted. Do not automatically resubmit.',
    } });
    expect(accept).toHaveBeenCalledTimes(1);
  });
});

it.each(['modern', 'legacy'] as const)('discovers and submits optional support through %s MCP without logging its payload', async runtime => {
  const app = createApp();
  let feedbackSettings: FeedbackBindings = bindings;
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const fetcher: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    request.headers.set('host', 'localhost');
    request.headers.set('cf-connecting-ip', '203.0.113.1');
    const response = await app.fetch(request, { ...env, ...feedbackSettings });
    expect(response.headers.get('cache-control')).toContain('no-store');
    return response;
  };
  const client = runtime === 'modern' ? new Client({ name: 'synthetic-feedback-client', version: '1' }, { versionNegotiation: { mode: 'auto' } })
    : new LegacyClient({ name: 'synthetic-feedback-client', version: '1' });
  try {
    if (runtime === 'modern') await (client as Client).connect(new StreamableHTTPClientTransport(new URL('http://localhost/mcp'), { fetch: fetcher }));
    else await (client as LegacyClient).connect(new LegacyTransport(new URL('http://localhost/mcp'), { fetch: fetcher }) as LegacyTransportContract);
    const discovered = (await client.listTools()).tools;
    expect(discovered.map(tool => tool.name)).toEqual([...tools.map(tool => tool.id), operationCatalog.feedback.id]);
    expect(discovered.at(-1)).toMatchObject({ annotations: operationCatalog.feedback.mcp.annotations,
      inputSchema: z.toJSONSchema(operationCatalog.feedback.inputSchema, { io: 'input' }),
      outputSchema: z.toJSONSchema(operationCatalog.feedback.outputSchema, { io: 'output' }) });
    const success = await client.callTool({ name: operationCatalog.feedback.id, arguments: report });
    expect(success.isError).not.toBe(true);
    expect(FeedbackReceiptSchema.safeParse(success.structuredContent).success).toBe(true);
    expect(success.content).toHaveLength(1);
    const invalid = CallToolResultSchema.parse(await client.callTool({ name: operationCatalog.feedback.id, arguments: { ...report, context: 'synthetic secret' } }));
    expect(invalid.isError).toBe(true);
    const text = invalid.content?.[0];
    expect(text?.type).toBe('text');
    if (text?.type === 'text') expect(FeedbackErrorResponseSchema.parse(JSON.parse(text.text)).error.delivery).toBe('not_accepted');
    expect(JSON.stringify(invalid)).not.toContain('synthetic secret');
    expect(JSON.stringify(log.mock.calls)).not.toContain(report.summary);
    expect(JSON.stringify(log.mock.calls)).not.toContain('203.0.113.1');
    expect(await counts()).toEqual({ reports: 1, admissions: 1 });
    const api = await app.fetch(new Request(`http://localhost/v1/${operationCatalog.feedback.id}`), { ...env, ...bindings });
    expect(api.status).toBe(404);
    feedbackSettings = { PACKETROVE_FEEDBACK_ENABLED: 'true' };
    const unavailable = CallToolResultSchema.parse(await client.callTool({ name: operationCatalog.feedback.id, arguments: report }));
    expect(unavailable.isError).toBe(true);
    if (unavailable.content[0]?.type === 'text') expect(FeedbackErrorResponseSchema.parse(JSON.parse(unavailable.content[0].text)))
      .toMatchObject({ error: { code: 'FEEDBACK_UNAVAILABLE', delivery: 'not_accepted' } });
    const product = tools[0]!;
    const calculation = await client.callTool({ name: product.id, arguments: product.example.request as Record<string, unknown> });
    expect(calculation.isError).not.toBe(true);
    expect(calculation.structuredContent).toEqual(product.example.result);
    feedbackSettings = {};
    expect((await client.listTools()).tools.map(tool => tool.name)).toEqual(tools.map(tool => tool.id));
    expect(await counts()).toEqual({ reports: 1, admissions: 1 });
  } finally { await client.close(); log.mockRestore(); }
});
