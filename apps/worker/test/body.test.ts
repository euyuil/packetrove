import { describe, expect, it, vi } from 'vitest';
import { MAX_REQUEST_BYTES } from '@packetrove/contracts';
import { readJsonBody } from '../src/body';

function request(body?: ReadableStream<Uint8Array>) {
  return new Request('http://localhost', {
    method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '1' },
    ...(body ? { body } : {}),
  });
}

describe('shared reader with server JSON policies', () => {
  it('decodes UTF-8 and a BOM across request chunks', async () => {
    const bytes = new TextEncoder().encode('\ufeff{"message":"€😀"}');
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
        controller.close();
      },
    });
    expect(await readJsonBody(request(body))).toEqual({ message: '€😀' });
    expect(body.locked).toBe(false);
  });

  it('keeps invalid UTF-8 classified as INVALID_JSON', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"message":"'));
        controller.enqueue(Uint8Array.of(0xc3));
        controller.enqueue(Uint8Array.of(0x28));
        controller.enqueue(new TextEncoder().encode('"}'));
        controller.close();
      },
    });
    await expect(readJsonBody(request(body))).rejects.toMatchObject({ code: 'INVALID_JSON' });
    expect(body.locked).toBe(false);
  });

  it('maps the shared actual-byte limit to PAYLOAD_TOO_LARGE and cancels without waiting for EOF', async () => {
    let pulls = 0;
    const cancel = vi.fn(() => Promise.reject(new Error('cleanup failed')));
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++;
        controller.enqueue(new Uint8Array(pulls === 1 ? MAX_REQUEST_BYTES : 1));
      },
      cancel,
    }, { highWaterMark: 0 });
    await expect(readJsonBody(request(body))).rejects.toMatchObject({
      code: 'PAYLOAD_TOO_LARGE', message: 'Request body must not exceed 64 KiB.',
    });
    expect(pulls).toBe(2);
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });

  it('keeps an empty request body classified as INVALID_JSON', async () => {
    await expect(readJsonBody(request())).rejects.toMatchObject({ code: 'INVALID_JSON' });
  });
});
