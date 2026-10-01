import { useCallback, useEffect, useRef, useState } from 'react';

export function useClipboardFeedback() {
  const [copyMessage, setCopyMessage] = useState('');
  const currentAttempt = useRef(0);

  const clearCopyMessage = useCallback(() => {
    currentAttempt.current += 1;
    setCopyMessage('');
  }, []);

  useEffect(() => () => { currentAttempt.current += 1; }, []);

  const copyText = useCallback(async (text: string, successMessage: string, failureMessage: string) => {
    const attempt = ++currentAttempt.current;
    setCopyMessage('');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable');
      await navigator.clipboard.writeText(text);
      // A system clipboard write cannot be cancelled; only its feedback expires.
      if (currentAttempt.current === attempt) setCopyMessage(successMessage);
    } catch {
      if (currentAttempt.current === attempt) setCopyMessage(failureMessage);
    }
  }, []);

  return { copyMessage, clearCopyMessage, copyText };
}
