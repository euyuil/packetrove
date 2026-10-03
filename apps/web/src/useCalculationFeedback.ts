import { useEffect, useRef, useState } from 'react';

export function useCalculationFeedback() {
  const errorSummary = useRef<HTMLDivElement>(null);
  const resultPanel = useRef<HTMLDivElement>(null);
  const [submission, setSubmission] = useState({ version: 0, failed: false });
  const handledVersion = useRef(0);

  useEffect(() => {
    if (handledVersion.current === submission.version) return;
    handledVersion.current = submission.version;
    if (submission.failed) {
      errorSummary.current?.focus();
    } else {
      const panel = resultPanel.current;
      const bounds = panel?.getBoundingClientRect();
      // Reveal off-screen results while leaving keyboard focus on the active control.
      if (bounds && bounds.height > 0 && (bounds.top >= window.innerHeight || bounds.bottom <= 0)) {
        panel?.scrollIntoView({ block: 'start' });
      }
    }
  }, [submission]);

  return {
    errorSummary, resultPanel, completionVersion: submission.version,
    complete: (failed: boolean) => setSubmission(previous => ({ version: previous.version + 1, failed })),
  };
}
