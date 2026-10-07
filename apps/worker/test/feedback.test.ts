import { env } from 'cloudflare:workers';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as LegacyClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as LegacyTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport as LegacyTransportContract } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FEEDBACK_EXAMPLES, FeedbackErrorResponseSchema, FeedbackReceiptSchema, MAX_FEEDBACK_BYTES,
  FEEDBACK_WINDOW_SECONDS, PACKETROVE_VERSION, SUPPORT_EMAIL, FEEDBACK_SENDER_EMAIL,
  operationCatalog, tools, FeedbackRequestSchema,
} from '@packetrove/contracts';
import { z } from 'zod';
import { createApp } from '../src/app';
import { createFeedbackExecutor, FeedbackError, type FeedbackBindings } from '../src/feedback';
import { createToolExecutionContext } from '../src/tool-context';

const quota = (env as FeedbackBindings).FEEDBACK_QUOTA!;
const send = vi.fn(async (_message: EmailMessage | EmailMessageBuilder) => ({ messageId: 'synthetic-email-id' }));
const bindings = { PACKETROVE_FEEDBACK_ENABLED: 'true', PACKETROVE_FEEDBACK_IP_KEY: 'x'.repeat(32),
  FEEDBACK_QUOTA: quota, FEEDBACK_EMAIL: { send } } satisfies FeedbackBindings;
const report = FEEDBACK_EXAMPLES[0].request;
const context = (ip = '203.0.113.1', signal?: AbortSignal) => createToolExecutionContext(
  new Request('http://localhost/mcp', { headers: { 'cf-connecting-ip': ip } }), signal);
const events = async () => (await quota.list<{ reserved_at: number }>({ prefix: 'q:' })).keys;
const seed = async (name: string, reservedAt: number) => quota.put(name, '', {
  expirationTtl: FEEDBACK_WINDOW_SECONDS, metadata: { reserved_at: reservedAt },
});

beforeEach(async () => {
  vi.restoreAllMocks();
  send.mockReset().mockResolvedValue({ messageId: 'synthetic-email-id' });
  for (const event of await events()) await quota.delete(event.name);
});

describe('feedback mail and approximate quotas', () => {
  it('emails approved fields with fixed headers and stores only an unlinked expiring quota event', async () => {
    const result = await createFeedbackExecutor(bindings)(report, context('198.51.100.7'));
    expect(FeedbackReceiptSchema.parse(result)).toEqual(result);
    const message = send.mock.calls[0]![0];
    expect(message).toMatchObject({ from: FEEDBACK_SENDER_EMAIL, to: SUPPORT_EMAIL, subject: 'Packetrove feedback' });
    expect(Object.keys(message).sort()).toEqual(['from', 'subject', 'text', 'to']);
    if (!('text' in message)) throw new Error('Expected composed mail.');
    const body = JSON.parse(message.text!);
    expect(body).toEqual({ report, receipt_id: result.receipt_id, service_version: PACKETROVE_VERSION,
      submitted_at: expect.any(String) });
    expect(Number.isFinite(Date.parse(body.submitted_at))).toBe(true);
    const stored = await events();
    expect(stored).toHaveLength(1);
    const event = stored[0]!;
    expect(event.name).toMatch(/^q:[a-f0-9]{64}:[a-f0-9-]{36}$/);
    expect(event.metadata).toEqual({ reserved_at: expect.any(Number) });
    expect(event.expiration! - Date.now() / 1000).toBeGreaterThan(FEEDBACK_WINDOW_SECONDS - 10);
    expect(await quota.get(event.name)).toBe('');
    expect(JSON.stringify(stored)).not.toContain(result.receipt_id);
    expect(message.text).not.toContain(event.name.split(':')[1]);
    expect(message.text).not.toContain('198.51.100.7');
  });
  it('rejects the eleventh sequential submission once ten events are visible', async () => {
    const submit = createFeedbackExecutor(bindings);
    for (let index = 0; index < 10; index++) await submit(report, context());
    await expect(submit(report, context())).rejects.toMatchObject({ code: 'RATE_LIMITED', delivery: 'not_accepted' });
    expect(await events()).toHaveLength(10);
    expect(send).toHaveBeenCalledTimes(10);
  });
  it('keeps independent events under concurrency without promising an exact hard cap', async () => {
    const results = await Promise.allSettled(Array.from({ length: 15 }, () => createFeedbackExecutor(bindings)(report, context())));
    const accepted = results.filter(result => result.status === 'fulfilled').length;
    expect(accepted).toBeGreaterThanOrEqual(10);
    expect(await events()).toHaveLength(accepted);
    expect(send).toHaveBeenCalledTimes(accepted);
    expect(new Set((await events()).map(event => event.name)).size).toBe(accepted);
  });
  it('uses a rolling window across UTC midnight and canonical full IPv6 addresses', async () => {
    const midnight = Date.UTC(2026, 9, 7);
    const clock = vi.spyOn(Date, 'now').mockReturnValue(midnight - 1000);
    const submit = createFeedbackExecutor(bindings);
    for (let index = 0; index < 10; index++) await submit(report, context('2001:db8::1'));
    clock.mockReturnValue(midnight + 1000);
    await expect(submit(report, context('2001:0DB8:0000:0000:0000:0000:0000:0001'))).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    clock.mockReturnValue(midnight - 1000 + FEEDBACK_WINDOW_SECONDS * 1000);
    await expect(submit(report, context('2001:db8::1'))).resolves.toMatchObject({ status: 'accepted' });
  });
  it('checks the whole-service UTC day quota and permits the next UTC day', async () => {
    const midnight = Date.UTC(2026, 9, 7);
    const clock = vi.spyOn(Date, 'now').mockReturnValue(midnight - 1000);
    for (let index = 0; index < 100; index++) await seed(`q:synthetic-other:${index}`, midnight - 1000);
    await expect(createFeedbackExecutor(bindings)(report, context())).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    expect(send).not.toHaveBeenCalled();
    clock.mockReturnValue(midnight + 1000);
    await expect(createFeedbackExecutor(bindings)(report, context())).resolves.toMatchObject({ status: 'accepted' });
  });
  it('continues after an empty page with a cursor and observes later quota events', async () => {
    const list = vi.spyOn(quota, 'list')
      .mockResolvedValueOnce({ keys: [], list_complete: false, cursor: 'synthetic-next', cacheStatus: null })
      .mockResolvedValueOnce({ keys: Array.from({ length: 100 }, (_, index) => ({
        name: `q:synthetic-other:${index}`, metadata: { reserved_at: Date.now() },
      })), list_complete: true, cacheStatus: null });
    await expect(createFeedbackExecutor(bindings)(report, context())).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    expect(list.mock.calls).toEqual([[{ prefix: 'q:' }], [{ prefix: 'q:', cursor: 'synthetic-next' }]]);
    expect(send).not.toHaveBeenCalled();
  });
  it.each(['list', 'put'] as const)('does not send when KV %s fails, even after an uncertain write', async method => {
    vi.spyOn(quota, method).mockRejectedValue(new Error('synthetic private quota error'));
    await expect(createFeedbackExecutor(bindings)(report, context())).rejects.toMatchObject({ code: 'FEEDBACK_UNAVAILABLE', delivery: 'not_accepted' });
    expect(send).not.toHaveBeenCalled();
  });
  it.each(['E_SENDER_NOT_VERIFIED', 'E_RECIPIENT_NOT_ALLOWED', 'E_RATE_LIMIT_EXCEEDED'])('releases only its own event after a known %s rejection', async code => {
    await seed('q:synthetic-other:keep', Date.now());
    send.mockRejectedValue(Object.assign(new Error('synthetic private email error'), { code }));
    await expect(createFeedbackExecutor(bindings)(report, context())).rejects.toMatchObject({ code: 'FEEDBACK_UNAVAILABLE', delivery: 'not_accepted' });
    expect((await events()).map(event => event.name)).toEqual(['q:synthetic-other:keep']);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it.each(['E_DELIVERY_FAILED', 'E_INTERNAL_SERVER_ERROR', 'UNKNOWN'])('retains quota and never resends after ambiguous %s failure', async code => {
    send.mockRejectedValue(Object.assign(new Error('synthetic private email error'), { code }));
    const error = await createFeedbackExecutor(bindings)(report, context()).catch(error => error as FeedbackError);
    expect((error as FeedbackError).toResponse()).toMatchObject({ error: { code: 'DELIVERY_UNCERTAIN', delivery: 'unknown' } });
    expect(JSON.stringify(error)).not.toContain('synthetic private');
    expect(await events()).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('keeps a conservative quota event when a known rejection cannot release it', async () => {
    send.mockRejectedValue(Object.assign(new Error('synthetic rejection'), { code: 'E_RECIPIENT_NOT_ALLOWED' }));
    vi.spyOn(quota, 'delete').mockRejectedValue(new Error('synthetic release error'));
    await expect(createFeedbackExecutor(bindings)(report, context())).rejects.toMatchObject({ delivery: 'not_accepted' });
    expect(await events()).toHaveLength(1);
  });
  it('does not refund acceptance when mail is removed or send is called again', async () => {
    const submit = createFeedbackExecutor(bindings);
    await submit(report, context());
    await submit(report, context());
    expect(await events()).toHaveLength(2);
    expect(send).toHaveBeenCalledTimes(2);
  });
  it('fails closed without trusted metadata or configuration and respects Pseudo IPv4', async () => {
    const missing = createToolExecutionContext(new Request('http://localhost/mcp', { headers: { 'x-forwarded-for': '203.0.113.1' } }));
    await expect(createFeedbackExecutor(bindings)(report, missing)).rejects.toMatchObject({ code: 'FEEDBACK_UNAVAILABLE' });
    await expect(createFeedbackExecutor({ PACKETROVE_FEEDBACK_ENABLED: 'true', FEEDBACK_QUOTA: quota,
      PACKETROVE_FEEDBACK_IP_KEY: bindings.PACKETROVE_FEEDBACK_IP_KEY })(report, context())).rejects.toMatchObject({ code: 'FEEDBACK_UNAVAILABLE' });
    await expect(createFeedbackExecutor({ PACKETROVE_FEEDBACK_ENABLED: 'true', FEEDBACK_QUOTA: quota,
      FEEDBACK_EMAIL: { send } })(report, context())).rejects.toMatchObject({ code: 'FEEDBACK_UNAVAILABLE' });
    const pseudo = createToolExecutionContext(new Request('http://localhost/mcp', {
      headers: { 'cf-connecting-ip': '240.0.0.1', 'cf-connecting-ipv6': '2001:db8::1' },
    }));
    await createFeedbackExecutor(bindings)(report, pseudo);
    await createFeedbackExecutor(bindings)(report, context('2001:db8::1'));
    expect(new Set((await events()).map(event => event.name.split(':')[1])).size).toBe(1);
  });
});

describe('feedback validation and cancellation', () => {
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
    expect(await events()).toHaveLength(0);
    expect(send).not.toHaveBeenCalled();
  });
  it('counts Unicode code points and enforces the actual serialized byte budget', async () => {
    expect(FeedbackRequestSchema.safeParse({ category: 'feature_request', summary: '😀'.repeat(256) }).success).toBe(true);
    const large = { category: 'bug', summary: '😀'.repeat(256), expected: '😀'.repeat(1024), actual: '😀'.repeat(1024) };
    expect(new TextEncoder().encode(JSON.stringify(large)).byteLength).toBeGreaterThan(MAX_FEEDBACK_BYTES);
    await expect(createFeedbackExecutor(bindings)(large, context())).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
    expect(send).not.toHaveBeenCalled();
  });
  it('does not send a cancelled report but preserves acknowledgement after sending', async () => {
    const controller = new AbortController();
    send.mockImplementation(async () => { controller.abort('synthetic abort reason'); return { messageId: 'synthetic-email-id' }; });
    const submit = createFeedbackExecutor(bindings);
    await expect(submit(report, context('203.0.113.1', controller.signal))).resolves.toMatchObject({ status: 'accepted' });
    await expect(submit(report, context('203.0.113.1', controller.signal))).rejects.toMatchObject({ delivery: 'not_accepted' });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('releases a reservation if cancellation arrives during KV admission', async () => {
    const controller = new AbortController();
    const put = quota.put.bind(quota);
    vi.spyOn(quota, 'put').mockImplementation(async (...args) => { await put(...args); controller.abort(); });
    await expect(createFeedbackExecutor(bindings)(report, context('203.0.113.1', controller.signal))).rejects.toMatchObject({ delivery: 'not_accepted' });
    expect(send).not.toHaveBeenCalled();
    expect(await events()).toHaveLength(0);
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
    expect(await events()).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
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
    expect(await events()).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
  } finally { await client.close(); log.mockRestore(); }
});
