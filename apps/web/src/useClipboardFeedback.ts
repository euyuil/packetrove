import { useCallback, useEffect, useRef, useState } from 'react';

export interface ClipboardFeedback {
  status: 'idle' | 'success' | 'error';
}

const idleFeedback: ClipboardFeedback = { status: 'idle' };

export function useClipboardFeedback() {
  const [copyFeedback, setCopyFeedback] = useState(idleFeedback);
  const currentAttempt = useRef(0);

  const clearCopyFeedback = useCallback(() => {
    currentAttempt.current += 1;
    setCopyFeedback(idleFeedback);
  }, []);

  useEffect(() => () => { currentAttempt.current += 1; }, []);

  useEffect(() => {
    if (copyFeedback.status !== 'success') return;
    const attempt = currentAttempt.current;
    const timeout = window.setTimeout(() => {
      if (currentAttempt.current === attempt) setCopyFeedback(idleFeedback);
    }, 2_000);
    return () => window.clearTimeout(timeout);
  }, [copyFeedback]);

  const copyText = useCallback(async (text: string) => {
    const attempt = ++currentAttempt.current;
    setCopyFeedback(idleFeedback);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable');
      await navigator.clipboard.writeText(text);
      // A system clipboard write cannot be cancelled; only its feedback expires.
      if (currentAttempt.current === attempt) setCopyFeedback({ status: 'success' });
    } catch {
      if (currentAttempt.current === attempt) setCopyFeedback({ status: 'error' });
    }
  }, []);

  return { copyFeedback, clearCopyFeedback, copyText };
}
