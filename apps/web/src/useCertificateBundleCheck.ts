import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_PEM_BYTES, type CertificateBundleRequest, type CertificateBundleResult } from '@packetrove/contracts';
import { checkCertificateBundle } from '@packetrove/core/certificate-bundle';
import { ToolError } from '@packetrove/core';

export type CertificateBundleDraft = {
  request: CertificateBundleRequest;
  result: CertificateBundleResult | null; error: ToolError | null;
};

type FileImportState = { status: 'idle' | 'reading' | 'imported' }
  | { status: 'failed'; error: 'FILE_COUNT' | 'INPUT_TOO_LARGE' | 'FILE_ENCODING' | 'FILE_READ_FAILED' };

/** Input edits, newer imports/checks, and navigation invalidate outstanding work. */
export function useCertificateBundleCheck(draft: CertificateBundleDraft,
  change: (draft: CertificateBundleDraft) => void, complete: (failed: boolean) => void,
  checker = checkCertificateBundle) {
  const revision = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const fileReader = useRef<FileReader | null>(null);
  const [checking, setChecking] = useState(false);
  const [fileImport, setFileImport] = useState<FileImportState>({ status: 'idle' });
  useEffect(() => () => { revision.current++; controller.current?.abort(); fileReader.current?.abort(); }, []);

  const cancelWork = useCallback(() => {
    revision.current++;
    controller.current?.abort();
    controller.current = null;
    fileReader.current?.abort();
    fileReader.current = null;
    setChecking(false);
    setFileImport({ status: 'idle' });
  }, []);
  const replaceInput = useCallback((request: CertificateBundleRequest) => {
    cancelWork();
    change({ request, result: null, error: null });
  }, [change, cancelWork]);
  const importFiles = (files: readonly File[]) => {
    cancelWork();
    if (files.length !== 1) { setFileImport({ status: 'failed', error: 'FILE_COUNT' }); return; }
    const file = files[0]!;
    if (file.size > MAX_PEM_BYTES) { setFileImport({ status: 'failed', error: 'INPUT_TOO_LARGE' }); return; }
    const current = revision.current;
    setFileImport({ status: 'reading' });
    try {
      const reader = new FileReader();
      fileReader.current = reader;
      reader.onerror = () => {
        if (revision.current !== current) return;
        fileReader.current = null;
        setFileImport({ status: 'failed', error: 'FILE_READ_FAILED' });
      };
      reader.onload = () => {
        if (revision.current !== current) return;
        fileReader.current = null;
        const buffer = reader.result;
        if (buffer === null || typeof buffer === 'string') {
          setFileImport({ status: 'failed', error: 'FILE_READ_FAILED' }); return;
        }
        let pem: string;
        // Textareas normalize line endings; keep error offsets in their displayed text.
        try { pem = new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/\r\n?/g, '\n'); }
        catch { setFileImport({ status: 'failed', error: 'FILE_ENCODING' }); return; }
        change({ request: { pem, hostname: draft.request.hostname ?? '' }, result: null, error: null });
        setFileImport({ status: 'imported' });
      };
      reader.readAsArrayBuffer(file);
    } catch {
      fileReader.current = null;
      setFileImport({ status: 'failed', error: 'FILE_READ_FAILED' });
    }
  };
  const inspect = async (request: CertificateBundleRequest) => {
    cancelWork();
    const current = revision.current;
    const pending = new AbortController();
    controller.current = pending;
    change({ ...draft, request, result: null, error: null });
    setChecking(true);
    try {
      const result = await checker(request, new Date(), pending.signal);
      if (revision.current === current) {
        change({ ...draft, request, result, error: null });
        complete(false);
      }
    } catch (failure) {
      if (revision.current === current) {
        change({ ...draft, request, result: null, error: failure instanceof ToolError ? failure
          : new ToolError('INTERNAL_ERROR', 'Unable to complete the certificate check.') });
        complete(true);
      }
    } finally {
      if (revision.current === current) setChecking(false);
    }
  };
  return { checking, fileImport, importFiles, replaceInput, inspect };
}
