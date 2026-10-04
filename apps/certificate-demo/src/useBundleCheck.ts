import { useCallback, useEffect, useRef, useState } from 'react';
import { BundleInputError, checkBundle, type BundleRequest, type BundleResult } from './checker';

export function useBundleCheck(initial: BundleRequest, checker = checkBundle) {
  const [input, setInput] = useState(initial);
  const [result, setResult] = useState<BundleResult | null>(null);
  const [error, setError] = useState<BundleInputError | null>(null);
  const [checking, setChecking] = useState(false);
  const revision = useRef(0);
  useEffect(() => () => { revision.current++; }, []);

  const replaceInput = useCallback((next: BundleRequest) => {
    revision.current++;
    setInput(next);
    setResult(null);
    setError(null);
    setChecking(false);
  }, []);
  const inspect = useCallback(async (next: BundleRequest) => {
    const current = ++revision.current;
    setInput(next);
    setResult(null);
    setError(null);
    setChecking(true);
    try {
      const checked = await checker(next);
      if (revision.current === current) setResult(checked);
    } catch (failure) {
      if (revision.current === current) setError(failure instanceof BundleInputError ? failure
        : new BundleInputError('CHECK_UNAVAILABLE', 'Unable to complete the check in this environment.'));
    } finally {
      if (revision.current === current) setChecking(false);
    }
  }, [checker]);
  return { input, result, error, checking, replaceInput, inspect };
}
