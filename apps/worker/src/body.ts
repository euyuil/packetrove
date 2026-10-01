import { MAX_REQUEST_BYTES } from '@packetrove/contracts';
import { ToolError } from '@packetrove/core';

/** Enforce the limit on actual bytes, including chunked or misleadingly sized bodies. */
export async function readJsonBody(request: Request): Promise<unknown> {
  const mediaType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (mediaType !== 'application/json') {
    throw new ToolError('UNSUPPORTED_MEDIA_TYPE', 'Use Content-Type: application/json.');
  }
  const reader = request.body?.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false });
  let bytes = 0;
  let text = '';
  try {
    if (reader) {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > MAX_REQUEST_BYTES) {
          await reader.cancel();
          throw new ToolError('PAYLOAD_TOO_LARGE', 'Request body must not exceed 64 KiB.');
        }
        text += decoder.decode(chunk.value, { stream: true });
      }
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof ToolError) throw error;
    if (error instanceof SyntaxError || error instanceof TypeError) {
      throw new ToolError('INVALID_JSON', 'Expected a valid UTF-8 JSON request body.');
    }
    throw error;
  } finally {
    reader?.releaseLock();
  }
}
