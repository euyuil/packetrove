import { useState } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CERTIFICATE_BUNDLE_EXAMPLES } from '@packetrove/contracts';
import { CertificateBundleInputError, checkCertificateBundle } from '@packetrove/core/certificate-bundle';
import { useCertificateBundleCheck, type CertificateBundleDraft } from './useCertificateBundleCheck';
import { deferred } from './test-utils';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const example = CERTIFICATE_BUNDLE_EXAMPLES[0]!;
function setup(checker: typeof checkCertificateBundle) {
  const complete = vi.fn();
  const hook = renderHook(() => {
    const [draft, change] = useState<CertificateBundleDraft>({ request: example.request, result: null, error: null });
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

function deliverFile(reader: FileReader, pem: string) {
  Object.defineProperty(reader, 'result', { configurable: true, value: new TextEncoder().encode(pem).buffer });
  reader.onload?.call(reader, new ProgressEvent('load') as ProgressEvent<FileReader>);
}

it('keeps the newest file when an obsolete read completes late', () => {
  const readers: FileReader[] = [];
  vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (this: FileReader) { readers.push(this); });
  const abort = vi.spyOn(FileReader.prototype, 'abort');
  const checker = vi.fn();
  const { result } = setup(checker);
  act(() => { result.current.importFiles([new File(['old'], 'old.pem')]); });
  act(() => { result.current.importFiles([new File(['new'], 'new.pem')]); });
  act(() => { deliverFile(readers[1]!, 'new'); });
  act(() => { deliverFile(readers[0]!, 'old'); });
  expect(abort).toHaveBeenCalledOnce();
  expect(result.current.draft.request).toEqual({ pem: 'new', hostname: example.request.hostname });
  expect(result.current.fileImport.status).toBe('imported');
  expect(checker).not.toHaveBeenCalled();
});

it.each(['editing', 'clearing', 'checking', 'navigation'])('discards pending file content after %s', async action => {
  let reader!: FileReader;
  vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (this: FileReader) { reader = this; });
  const abort = vi.spyOn(FileReader.prototype, 'abort');
  const { result, unmount } = setup(async () => example.result);
  act(() => { result.current.importFiles([new File(['obsolete'], 'old.pem')]); });
  expect(result.current.fileImport.status).toBe('reading');
  if (action === 'navigation') unmount();
  else if (action === 'checking') await act(async () => { await result.current.inspect(example.request); });
  else act(() => { result.current.replaceInput({ pem: action === 'clearing' ? '' : 'edited' }); });
  const retained = result.current.draft;
  act(() => { deliverFile(reader, 'obsolete'); });
  expect(abort).toHaveBeenCalledOnce();
  expect(result.current.draft).toBe(retained);
  if (action !== 'navigation') expect(result.current.fileImport.status).toBe('idle');
});
