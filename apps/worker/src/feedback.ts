import {
  FeedbackRequestSchema, MAX_FEEDBACK_BYTES, PACKETROVE_VERSION,
  FEEDBACK_IP_LIMIT, FEEDBACK_WINDOW_SECONDS, FEEDBACK_DAILY_LIMIT,
  FEEDBACK_REPORT_LIMIT, FEEDBACK_RETENTION_SECONDS,
  type FeedbackErrorCode, type FeedbackErrorResponse, type FeedbackReceipt,
} from '@packetrove/contracts';
import { smallestCoveringCidr } from '@packetrove/core';
import { getPublicIp } from './ip';
import type { ToolExecutionContext } from './tool-context';

export type FeedbackBindings = {
  PACKETROVE_FEEDBACK_ENABLED?: string;
  PACKETROVE_FEEDBACK_IP_KEY?: string;
  FEEDBACK_DB?: D1Database;
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
type AdmissionResult = { accepted: true } | { accepted: false; ipCount: number; dailyCount: number; reportCount: number; retryAfter: number };
export interface FeedbackStore {
  ready(): Promise<void>;
  accept(receiptId: string, report: string, ipDigest: string): Promise<AdmissionResult>;
  hasReceipt(receiptId: string): Promise<boolean>;
}

const now = "CAST(unixepoch('subsec') * 1000 AS INTEGER)";
const cutoff = `${now} - ${FEEDBACK_WINDOW_SECONDS * 1000}`;
const dayStart = `(${now} / 86400000) * 86400000`;
const cleanupSql = [
  `DELETE FROM feedback_reports WHERE expires_at <= ${now}`,
  `DELETE FROM feedback_admissions WHERE accepted_at <= ${cutoff}`,
];

/** Primary-only transactional admission: rejected calls never create IP buckets. */
export function createD1FeedbackStore(database: D1Database): FeedbackStore {
  const db = database.withSession('first-primary');
  return {
    async ready() {
      const tables = await db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN ('feedback_reports', 'feedback_admissions')").first<{ count: number }>();
      if (tables?.count !== 2) throw new Error('Feedback storage is not initialized.');
    },
    async accept(receiptId, report, ipDigest) {
      const results = await db.batch([
        ...cleanupSql.map(sql => db.prepare(sql)),
        db.prepare(`INSERT INTO feedback_reports (receipt_id, report, service_version, accepted_at, expires_at)
          SELECT ?, ?, ?, ${now}, ${now} + ${FEEDBACK_RETENTION_SECONDS * 1000}
          WHERE (SELECT COUNT(*) FROM feedback_reports) < ${FEEDBACK_REPORT_LIMIT}
            AND (SELECT COUNT(*) FROM feedback_admissions WHERE accepted_at >= ${dayStart}) < ${FEEDBACK_DAILY_LIMIT}
            AND (SELECT COUNT(*) FROM feedback_admissions WHERE ip_digest = ? AND accepted_at > ${cutoff}) < ${FEEDBACK_IP_LIMIT}
          RETURNING receipt_id`).bind(receiptId, report, PACKETROVE_VERSION, ipDigest),
        db.prepare(`INSERT INTO feedback_admissions (ip_digest, accepted_at)
          SELECT ?, accepted_at FROM feedback_reports WHERE receipt_id = ?`).bind(ipDigest, receiptId),
        db.prepare(`SELECT
          (SELECT COUNT(*) FROM feedback_reports) AS reportCount,
          (SELECT COUNT(*) FROM feedback_admissions WHERE accepted_at >= ${dayStart}) AS dailyCount,
          COUNT(*) AS ipCount,
          MAX(1, COALESCE(MIN(accepted_at) + ${FEEDBACK_WINDOW_SECONDS * 1000} - ${now}, 1)) AS retryAfter
          FROM feedback_admissions WHERE ip_digest = ? AND accepted_at > ${cutoff}`).bind(ipDigest),
      ]);
      if (results.some(result => !result.success)) throw new Error('Feedback transaction did not complete.');
      if (results[2]!.results.length) return { accepted: true };
      const counts = results[4]!.results[0] as { ipCount: number; dailyCount: number; reportCount: number; retryAfter: number };
      return { accepted: false, ...counts, retryAfter: Math.ceil(counts.retryAfter / 1000) };
    },
    async hasReceipt(receiptId) {
      return (await db.prepare('SELECT receipt_id FROM feedback_reports WHERE receipt_id = ?').bind(receiptId).first()) !== null;
    },
  };
}

function cancelled(context: ToolExecutionContext) {
  if (context.signal.aborted) throw new FeedbackError('FEEDBACK_UNAVAILABLE', 'Submission was cancelled before acceptance.');
}

export function createFeedbackExecutor(bindings: FeedbackBindings, suppliedStore?: FeedbackStore): FeedbackExecutor {
  return async (input, context) => {
    // Validate in this controlled boundary, never expose Zod's caller-controlled messages or keys.
    const parsed = FeedbackRequestSchema.safeParse(input);
    if (!parsed.success) throw new FeedbackError('INVALID_INPUT', 'Use the documented feedback category, fields, and limits. Unknown fields are rejected.');
    const report = JSON.stringify(parsed.data);
    if (new TextEncoder().encode(report).byteLength > MAX_FEEDBACK_BYTES) {
      throw new FeedbackError('PAYLOAD_TOO_LARGE', 'Serialized feedback arguments must not exceed 8 KiB.');
    }
    cancelled(context);
    const secret = bindings.PACKETROVE_FEEDBACK_IP_KEY;
    if (bindings.PACKETROVE_FEEDBACK_ENABLED !== 'true' || (!suppliedStore && !bindings.FEEDBACK_DB)
      || !secret || new TextEncoder().encode(secret).byteLength < 32) {
      throw new FeedbackError('FEEDBACK_UNAVAILABLE', 'Private feedback is unavailable. Use the existing support channel.');
    }
    let store: FeedbackStore;
    let digest: string;
    try {
      // Reuse trusted edge / Pseudo IPv4 resolution, then canonicalize equivalent IPv6 spellings.
      const address = smallestCoveringCidr({ inputs: [getPublicIp(context.connection).ip] }).range.first;
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(address));
      digest = Array.from(new Uint8Array(signature), value => value.toString(16).padStart(2, '0')).join('');
      store = suppliedStore ?? createD1FeedbackStore(bindings.FEEDBACK_DB!);
      await store.ready();
    } catch {
      throw new FeedbackError('FEEDBACK_UNAVAILABLE', 'Private feedback storage or trusted connection metadata is unavailable.');
    }
    cancelled(context);
    const receiptId = crypto.randomUUID();
    let admission: AdmissionResult;
    try {
      admission = await store.accept(receiptId, report, digest);
    } catch {
      // A positive primary lookup can recover a lost acknowledgement. Absence cannot prove rollback.
      try {
        if (await store.hasReceipt(receiptId)) return { status: 'accepted', receipt_id: receiptId };
      } catch { /* Preserve uncertain delivery without logging exception or request data. */ }
      throw new FeedbackError('DELIVERY_UNCERTAIN', 'The report may have been accepted. Do not automatically resubmit.', 'unknown');
    }
    // Unlike calculation execution, cancellation after commit cannot turn acceptance into failure.
    if (admission.accepted) return { status: 'accepted', receipt_id: receiptId };
    if (admission.ipCount >= FEEDBACK_IP_LIMIT) {
      throw new FeedbackError('RATE_LIMITED', 'This exit IP has reached 10 accepted reports in the preceding 24 hours.',
        'not_accepted', Math.min(FEEDBACK_WINDOW_SECONDS, Math.max(1, admission.retryAfter)));
    }
    if (admission.dailyCount >= FEEDBACK_DAILY_LIMIT) {
      throw new FeedbackError('RATE_LIMITED', 'The service has reached its daily feedback acceptance limit.');
    }
    throw new FeedbackError('FEEDBACK_UNAVAILABLE', 'The private feedback queue cannot accept another report.');
  };
}

/** Cleanup remains active when submissions are disabled; it never reads or logs report bodies. */
export async function cleanupFeedback(database: D1Database) {
  const db = database.withSession('first-primary');
  const tables = await db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN ('feedback_reports', 'feedback_admissions')").first<{ count: number }>();
  if (!tables?.count) return; // An uninitialized, disabled installation has nothing to retain.
  await db.batch(cleanupSql.map(sql => db.prepare(sql)));
}
