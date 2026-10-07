import {
  FeedbackRequestSchema, MAX_FEEDBACK_BYTES, PACKETROVE_VERSION, SUPPORT_EMAIL, FEEDBACK_SENDER_EMAIL,
  FEEDBACK_IP_LIMIT, FEEDBACK_WINDOW_SECONDS, FEEDBACK_DAILY_LIMIT,
  type FeedbackErrorCode, type FeedbackErrorResponse, type FeedbackReceipt,
} from '@packetrove/contracts';
import { smallestCoveringCidr } from '@packetrove/core';
import { getPublicIp } from './ip';
import type { ToolExecutionContext } from './tool-context';

export type FeedbackBindings = {
  PACKETROVE_FEEDBACK_ENABLED?: string;
  PACKETROVE_FEEDBACK_IP_KEY?: string;
  FEEDBACK_QUOTA?: KVNamespace;
  FEEDBACK_EMAIL?: SendEmail;
};
export class FeedbackError extends Error {
  constructor(readonly code: FeedbackErrorCode, message: string,
    readonly delivery: 'not_accepted' | 'unknown' = 'not_accepted', readonly retryAfter?: number) {
    super(message);
  }
  toResponse(): FeedbackErrorResponse {
    return { error: { code: this.code, message: this.message, delivery: this.delivery,
      ...(this.retryAfter === undefined ? {} : { retry_after_seconds: this.retryAfter }) } };
  }
}

export type FeedbackExecutor = (input: unknown, context: ToolExecutionContext) => Promise<FeedbackReceipt>;
type QuotaMetadata = { reserved_at: number };

/** Immutable events avoid concurrent overwrites and KV's same-key write limit. */
async function reserveQuota(quota: KVNamespace, digest: string): Promise<string> {
  const now = Date.now();
  const cutoff = now - FEEDBACK_WINDOW_SECONDS * 1000;
  const dayStart = Math.floor(now / 86400000) * 86400000;
  const prefix = `q:${digest}:`;
  let ipCount = 0;
  let dailyCount = 0;
  let cursor: string | undefined;
  do {
    const page = await quota.list<QuotaMetadata>({ prefix: 'q:', ...(cursor ? { cursor } : {}) });
    for (const key of page.keys) {
      const reservedAt = key.metadata?.reserved_at;
      if (typeof reservedAt !== 'number' || !Number.isSafeInteger(reservedAt)) {
        throw new Error('Feedback quota metadata is unavailable.');
      }
      if (reservedAt <= cutoff || (key.expiration !== undefined && key.expiration * 1000 <= now)) continue;
      if (key.name.startsWith(prefix)) ipCount++;
      if (reservedAt >= dayStart) dailyCount++;
      if (ipCount >= FEEDBACK_IP_LIMIT) {
        throw new FeedbackError('RATE_LIMITED', 'This exit IP has reached the approximate feedback limit for the preceding 24 hours.');
      }
      if (dailyCount >= FEEDBACK_DAILY_LIMIT) {
        throw new FeedbackError('RATE_LIMITED', 'The service has reached its approximate daily feedback limit.');
      }
    }
    if (page.list_complete) break;
    if (!page.cursor || page.cursor === cursor) throw new Error('Feedback quota pagination is unavailable.');
    cursor = page.cursor;
  } while (true);
  const eventKey = `${prefix}${crypto.randomUUID()}`;
  await quota.put(eventKey, '', { expirationTtl: FEEDBACK_WINDOW_SECONDS, metadata: { reserved_at: now } });
  return eventKey;
}

async function releaseQuota(quota: KVNamespace, eventKey: string) {
  try { await quota.delete(eventKey); }
  catch { /* A failed release conservatively occupies quota until its 24-hour expiry. */ }
}

// Only documented pre-delivery rejections establish that no email was accepted.
const knownRejections = new Set([
  'E_VALIDATION_ERROR', 'E_FIELD_MISSING', 'E_TOO_MANY_RECIPIENTS', 'E_TOO_MANY_ATTACHMENTS',
  'E_SENDER_NOT_VERIFIED', 'E_RECIPIENT_NOT_ALLOWED', 'E_RECIPIENT_SUPPRESSED',
  'E_SENDER_DOMAIN_NOT_AVAILABLE', 'E_CONTENT_TOO_LARGE', 'E_RATE_LIMIT_EXCEEDED',
  'E_DAILY_LIMIT_EXCEEDED', 'E_HEADER_NOT_ALLOWED', 'E_HEADER_USE_API_FIELD',
  'E_HEADER_VALUE_INVALID', 'E_HEADER_VALUE_TOO_LONG', 'E_HEADER_NAME_INVALID',
  'E_HEADERS_TOO_LARGE', 'E_HEADERS_TOO_MANY',
]);

function cancelled(context: ToolExecutionContext) {
  if (context.signal.aborted) throw new FeedbackError('FEEDBACK_UNAVAILABLE', 'Submission was cancelled before sending.');
}

export function createFeedbackExecutor(bindings: FeedbackBindings): FeedbackExecutor {
  return async (input, context) => {
    // Never expose Zod's caller-controlled messages or keys.
    const parsed = FeedbackRequestSchema.safeParse(input);
    if (!parsed.success) throw new FeedbackError('INVALID_INPUT', 'Use the documented feedback category, fields, and limits. Unknown fields are rejected.');
    const report = JSON.stringify(parsed.data);
    if (new TextEncoder().encode(report).byteLength > MAX_FEEDBACK_BYTES) {
      throw new FeedbackError('PAYLOAD_TOO_LARGE', 'Serialized feedback arguments must not exceed 8 KiB.');
    }
    cancelled(context);
    const secret = bindings.PACKETROVE_FEEDBACK_IP_KEY;
    const quota = bindings.FEEDBACK_QUOTA;
    const email = bindings.FEEDBACK_EMAIL;
    if (bindings.PACKETROVE_FEEDBACK_ENABLED !== 'true' || !quota || !email
      || !secret || new TextEncoder().encode(secret).byteLength < 32) {
      throw new FeedbackError('FEEDBACK_UNAVAILABLE', 'Private feedback is unavailable. Use the existing support channel.');
    }
    let eventKey: string;
    try {
      // Reuse trusted edge / Pseudo IPv4 resolution and canonicalize full IPv6 addresses.
      const address = smallestCoveringCidr({ inputs: [getPublicIp(context.connection).ip] }).range.first;
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(address));
      const digest = Array.from(new Uint8Array(signature), value => value.toString(16).padStart(2, '0')).join('');
      cancelled(context);
      eventKey = await reserveQuota(quota, digest);
    } catch (error) {
      if (error instanceof FeedbackError) throw error;
      // Even an uncertain KV write cannot imply mail delivery: send() has not started.
      throw new FeedbackError('FEEDBACK_UNAVAILABLE', 'Feedback quota or trusted connection metadata is unavailable.');
    }
    if (context.signal.aborted) {
      await releaseQuota(quota, eventKey);
      cancelled(context);
    }
    const receiptId = crypto.randomUUID();
    try {
      await email.send({
        from: FEEDBACK_SENDER_EMAIL, to: SUPPORT_EMAIL, subject: 'Packetrove feedback',
        text: JSON.stringify({ receipt_id: receiptId, service_version: PACKETROVE_VERSION,
          submitted_at: new Date().toISOString(), report: parsed.data }, null, 2),
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && typeof error.code === 'string' && knownRejections.has(error.code)) {
        await releaseQuota(quota, eventKey);
        throw new FeedbackError('FEEDBACK_UNAVAILABLE', 'The email service rejected the report before delivery.');
      }
      // SMTP failures and lost acknowledgements cannot safely establish non-delivery.
      throw new FeedbackError('DELIVERY_UNCERTAIN', 'The report may have been emailed. Do not automatically resubmit.', 'unknown');
    }
    // Cancellation after sending cannot turn acknowledged acceptance into failure.
    return { status: 'accepted', receipt_id: receiptId };
  };
}
