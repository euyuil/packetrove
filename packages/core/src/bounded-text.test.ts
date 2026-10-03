import { describe, expect, it, vi } from 'vitest';
import { BodyLimitError, readBoundedText } from './bounded-text';

const encoder = new TextEncoder();

function byteStream(chunks: Uint8Array[]) {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index === chunks.length) controller.close();
      else controller.enqueue(chunks[index++]!);
    },
  }, { highWaterMark: 0 });
}

describe('shared bounded UTF-8 body reading', () => {
  it('accepts exactly the byte limit while decoding multibyte characters across chunks', async () => {
    const bytes = encoder.encode('A€😀Z');
    const body = byteStream([...bytes].map(byte => Uint8Array.of(byte)));
    expect(await readBoundedText(body, bytes.byteLength, { fatal: true })).toBe('A€😀Z');
    expect(body.locked).toBe(false);
  });

  it('counts UTF-8 bytes rather than decoded characters', async () => {
    const body = byteStream([encoder.encode('€')]);
    await expect(readBoundedText(body, 2)).rejects.toBeInstanceOf(BodyLimitError);
    expect(body.locked).toBe(false);
  });

  it.each([
    Uint8Array.of(0xef, 0xbb, 0xbf, 0x41),
    Uint8Array.of(0x41, 0xff, 0x42),
    Uint8Array.of(0x41, 0xe2, 0x82),
  ])('preserves Response.text BOM and replacement decoding', async bytes => {
    const expected = await new Response(bytes).text();
    const body = byteStream([...bytes].map(byte => Uint8Array.of(byte)));
    expect(await readBoundedText(body, bytes.byteLength)).toBe(expected);
    expect(body.locked).toBe(false);
  });

  it('retains strict UTF-8 rejection and releases the reader after decoder failure', async () => {
    const body = byteStream([Uint8Array.of(0xc3), Uint8Array.of(0x28)]);
    await expect(readBoundedText(body, 2, { fatal: true })).rejects.toBeInstanceOf(TypeError);
    expect(body.locked).toBe(false);
  });

  it.each(['complete', 'reject', 'pending'])('stops at limit + 1 even when cancellation is %s', async outcome => {
    let pulls = 0;
    const cancel = vi.fn(() => {
      if (outcome === 'reject') return Promise.reject(new Error('cleanup failed'));
      if (outcome === 'pending') return new Promise<void>(() => {});
    });
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++;
        controller.enqueue(new Uint8Array(pulls === 1 ? 8 : 1));
      },
      cancel,
    }, { highWaterMark: 0 });
    await expect(readBoundedText(body, 8)).rejects.toBeInstanceOf(BodyLimitError);
    expect(pulls).toBe(2);
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });

  it('preserves stream errors and releases its reader', async () => {
    const failure = new Error('transfer failed');
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.error(failure); } });
    await expect(readBoundedText(body, 8)).rejects.toBe(failure);
    expect(body.locked).toBe(false);
  });

  it('treats a null body as empty text', async () => {
    expect(await readBoundedText(null, 0)).toBe('');
  });
});
