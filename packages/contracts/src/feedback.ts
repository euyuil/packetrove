import { z } from 'zod';

export const MAX_FEEDBACK_BYTES = 8 * 1024;
export const MAX_FEEDBACK_SUMMARY = 256;
export const MAX_FEEDBACK_DESCRIPTION = 1024;
export const MAX_FEEDBACK_REPRODUCTION = 2048;
export const FEEDBACK_IP_LIMIT = 10;
export const FEEDBACK_WINDOW_SECONDS = 24 * 60 * 60;
export const FEEDBACK_DAILY_LIMIT = 100;
export const FEEDBACK_REPORT_LIMIT = 1000;
export const FEEDBACK_RETENTION_SECONDS = 90 * FEEDBACK_WINDOW_SECONDS;

function boundedText(maximum: number) {
  // JSON Schema counts Unicode code points; JavaScript string.length does not.
  return z.string().min(1).refine(value => value.trim().length > 0 && [...value].length <= maximum)
    .meta({ maxLength: maximum });
}

/** The catalog supplies names, so this schema never maintains a second tool list. */
export function createFeedbackRequestSchema(toolNames: readonly string[]) {
  const common = {
    tool_name: z.enum(toolNames).optional(),
    summary: boundedText(MAX_FEEDBACK_SUMMARY),
    synthetic_reproduction: boundedText(MAX_FEEDBACK_REPRODUCTION).optional(),
  };
  const behavior = {
    actual: boundedText(MAX_FEEDBACK_DESCRIPTION),
    error_code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/).optional(),
  };
  return z.discriminatedUnion('category', [
    z.strictObject({ ...common, ...behavior, category: z.literal('bug'), expected: boundedText(MAX_FEEDBACK_DESCRIPTION) }),
    z.strictObject({ ...common, ...behavior, category: z.literal('confusing_behavior'), expected: boundedText(MAX_FEEDBACK_DESCRIPTION).optional() }),
    z.strictObject({ ...common, category: z.literal('feature_request'), expected: boundedText(MAX_FEEDBACK_DESCRIPTION).optional() }),
  ]).meta({ type: 'object' });
}

export type FeedbackRequest = z.output<ReturnType<typeof createFeedbackRequestSchema>>;
export const FeedbackReceiptSchema = z.strictObject({ status: z.literal('accepted'), receipt_id: z.uuid() });
export type FeedbackReceipt = z.output<typeof FeedbackReceiptSchema>;
export const FeedbackErrorCodeSchema = z.enum([
  'INVALID_INPUT', 'PAYLOAD_TOO_LARGE', 'RATE_LIMITED', 'FEEDBACK_UNAVAILABLE', 'DELIVERY_UNCERTAIN',
]);
export type FeedbackErrorCode = z.output<typeof FeedbackErrorCodeSchema>;
export const FeedbackErrorResponseSchema = z.strictObject({ error: z.strictObject({
  code: FeedbackErrorCodeSchema,
  message: z.string(),
  delivery: z.enum(['not_accepted', 'unknown']),
  retry_after_seconds: z.number().int().min(1).max(FEEDBACK_WINDOW_SECONDS).optional(),
}) });
export type FeedbackErrorResponse = z.output<typeof FeedbackErrorResponseSchema>;

export const FEEDBACK_EXAMPLES = [{
  name: 'A synthetic clarification request',
  request: {
    category: 'confusing_behavior', tool_name: 'cidr-cover',
    summary: 'Explain why a covering CIDR can include additional addresses.',
    actual: 'The result includes addresses beyond the supplied documentation inputs.',
    synthetic_reproduction: 'Use documentation addresses 203.0.113.1 and 203.0.113.6.',
  },
  result: { status: 'accepted', receipt_id: '00000000-0000-4000-8000-000000000001' },
}] as const;
