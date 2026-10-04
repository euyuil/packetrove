import { useState } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CERTIFICATE_BUNDLE_EXAMPLES } from '@packetrove/contracts';
import { CertificateBundleInputError, checkCertificateBundle } from '@packetrove/core/certificate-bundle';
import { useCertificateBundleCheck, type CertificateBundleDraft } from './useCertificateBundleCheck';
import { deferred } from './test-utils';

afterEach(cleanup);
const example = CERTIFICATE_BUNDLE_EXAMPLES[0]!;
function setup(checker: typeof checkCertificateBundle) {
  const complete = vi.fn();
  const hook = renderHook(() => {
    const [draft, change] = useState<CertificateBundleDraft>({ request: example.request, sampleName: 'normal', result: null, error: null });
    return { ...useCertificateBundleCheck(draft, change, complete, checker), draft };
  });
  return { ...hook, complete };
}

it('aborts and discards a late result after editing the input', async () => {
  const pending = deferred<typeof example.result>();
  let signal: AbortSignal | undefined;
  const { result, complete } = setup(async (_request, _time, current) => { signal = current; return pending.promise; });
  let check!: Promise<void>;
  act(() => { check = result.current.inspect(example.request); });
  act(() => { result.current.replaceInput({ pem: 'new input' }); });
  expect(signal?.aborted).toBe(true);
  await act(async () => { pending.resolve(example.result); await check; });
  expect(result.current.draft.request.pem).toBe('new input');
  expect(result.current.draft.result).toBeNull();
  expect(result.current.checking).toBe(false);
  expect(complete).not.toHaveBeenCalled();
});

it('keeps a newer successful check when an older check fails', async () => {
  const old = deferred<typeof example.result>();
  const { result, complete } = setup(async (request) => (request as { pem: string }).pem === 'old' ? old.promise : example.result);
  let check!: Promise<void>;
  act(() => { check = result.current.inspect({ pem: 'old' }); });
  await act(async () => { await result.current.inspect(example.request); });
  await act(async () => { old.reject(new CertificateBundleInputError('INVALID_PEM', 'Invalid old input.')); await check; });
  expect(result.current.draft.result).toEqual(example.result);
  expect(result.current.draft.error).toBeNull();
  expect(complete).toHaveBeenCalledExactlyOnceWith(false);
});

it('cancels work on navigation and never publishes its eventual result', async () => {
  const pending = deferred<typeof example.result>();
  let signal: AbortSignal | undefined;
  const { result, unmount, complete } = setup(async (_request, _time, current) => { signal = current; return pending.promise; });
  let check!: Promise<void>;
  act(() => { check = result.current.inspect(example.request); });
  unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => { pending.resolve(example.result); await check; });
  expect(complete).not.toHaveBeenCalled();
});
