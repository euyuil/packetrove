import { MAX_REQUEST_BYTES } from '@packetrove/contracts';
import { BodyLimitError, readBoundedText, ToolError } from '@packetrove/core';

/** Enforce the limit on actual bytes, including chunked or misleadingly sized bodies. */
export async function readJsonBody(request: Request): Promise<unknown> {
  const mediaType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (mediaType !== 'application/json') {
    throw new ToolError('UNSUPPORTED_MEDIA_TYPE', 'Use Content-Type: application/json.');
  }
  try {
    const text = await readBoundedText(request.body, MAX_REQUEST_BYTES, { fatal: true });
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof BodyLimitError) {
      throw new ToolError('PAYLOAD_TOO_LARGE', 'Request body must not exceed 64 KiB.');
    }
    if (error instanceof ToolError) throw error;
    if (error instanceof SyntaxError || error instanceof TypeError) {
      throw new ToolError('INVALID_JSON', 'Expected a valid UTF-8 JSON request body.');
    }
    throw error;
  }
}
