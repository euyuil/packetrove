/** A body exceeded the caller's limit on actual bytes. */
export class BodyLimitError extends Error {
  constructor() {
    super('Body exceeds the byte limit.');
    this.name = 'BodyLimitError';
  }
}

/** Read bounded UTF-8 text without depending on a declared content length. */
export async function readBoundedText(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
  { fatal = false }: { fatal?: boolean } = {},
): Promise<string> {
  const reader = body?.getReader();
  const decoder = new TextDecoder('utf-8', { fatal, ignoreBOM: false });
  let bytes = 0;
  let text = '';
  try {
    if (reader) {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > maxBytes) {
          // Request cancellation without allowing cleanup to delay or replace
          // the size error, including a source whose cancel never settles.
          void reader.cancel().catch(() => {});
          throw new BodyLimitError();
        }
        text += decoder.decode(chunk.value, { stream: true });
      }
    }
    return text + decoder.decode();
  } finally {
    reader?.releaseLock();
  }
}
