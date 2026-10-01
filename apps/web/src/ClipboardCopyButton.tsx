import { useRef } from 'react';
import { Button, CloseButton, Group, Popover, Text, VisuallyHidden } from '@mantine/core';
import type { ClipboardFeedback } from './useClipboardFeedback';

interface ClipboardCopyButtonProps {
  label: string;
  feedback: ClipboardFeedback;
  onCopy: () => void;
  onDismiss: () => void;
}

export function ClipboardCopyButton({ label, feedback, onCopy, onDismiss }: ClipboardCopyButtonProps) {
  const button = useRef<HTMLButtonElement>(null);
  const copied = feedback.status === 'success';

  function dismiss() {
    onDismiss();
    button.current?.focus();
  }

  return <>
    <Popover opened={feedback.status === 'error'} onDismiss={onDismiss}
      position="top-end" width={280} withArrow shadow="sm">
      <Popover.Target>
        <Button ref={button} type="button" variant={copied ? 'light' : 'default'} size="xs"
          w={112} flex="0 0 auto" onClick={onCopy} onKeyDown={event => {
            if (event.key === 'Escape' && feedback.status === 'error') dismiss();
          }}>
          {copied ? <><span aria-hidden="true">✓</span> Copied</> : label}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <Text size="sm" flex={1}>{feedback.message}</Text>
          <CloseButton size="sm" aria-label="Dismiss copy error" onClick={dismiss} />
        </Group>
      </Popover.Dropdown>
    </Popover>
    <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">{feedback.message}</VisuallyHidden>
  </>;
}
