import { useCallback, useEffect, useRef, useState } from 'react';
import type { CertificateBundleRequest, CertificateBundleResult } from '@packetrove/contracts';
import { checkCertificateBundle } from '@packetrove/core/certificate-bundle';
import { ToolError } from '@packetrove/core';

export type CertificateBundleDraft = {
  request: CertificateBundleRequest; sampleName: string;
  result: CertificateBundleResult | null; error: ToolError | null;
};

/** Input edits, newer checks, and navigation invalidate in-flight crypto work. */
export function useCertificateBundleCheck(draft: CertificateBundleDraft,
  change: (draft: CertificateBundleDraft) => void, complete: (failed: boolean) => void,
  checker = checkCertificateBundle) {
  const revision = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => () => { revision.current++; controller.current?.abort(); }, []);

  const replaceInput = useCallback((request: CertificateBundleRequest, sampleName = draft.sampleName) => {
    revision.current++;
    controller.current?.abort();
    setChecking(false);
    change({ request, sampleName, result: null, error: null });
  }, [change, draft.sampleName]);
  const inspect = async (request: CertificateBundleRequest) => {
    const current = ++revision.current;
    controller.current?.abort();
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
  return { checking, replaceInput, inspect };
}
