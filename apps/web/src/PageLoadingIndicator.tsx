import { useEffect, useState } from 'react';
import { Box, VisuallyHidden } from '@mantine/core';

export function PageLoadingIndicator({ loading, label }: { loading: boolean; label: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!loading) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 1_000);
    return () => window.clearTimeout(timer);
  }, [loading]);
  const shown = loading && visible;

  return <>
    <VisuallyHidden role={shown ? 'status' : undefined} aria-label={shown ? label : undefined} aria-live="polite" aria-atomic="true">
      {shown ? label : ''}
    </VisuallyHidden>
    {shown && <Box aria-hidden="true" pos="fixed" top={0} left={0} right={0} h={3}
      bg="var(--mantine-primary-color-light)" style={{ overflow: 'hidden', pointerEvents: 'none', zIndex: 1_000 }}>
      <Box className="page-loading-indicator-bar" h="100%" bg="var(--mantine-primary-color-filled)" />
    </Box>}
  </>;
}
