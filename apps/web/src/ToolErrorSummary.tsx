import type { ReactNode, Ref } from 'react';
import { Alert, Anchor, List } from '@mantine/core';
import { focusErrorInput } from './focusErrorInput';

export function ToolErrorSummary({ id, title, issues, ref }: {
  id: string; title: ReactNode;
  issues?: { message: string; inputId?: string; selection?: { start: number; end: number } | undefined }[] | undefined;
  ref: Ref<HTMLDivElement>;
}) {
  return <Alert ref={ref} id={id} color="red" role="alert" tabIndex={-1}
    className="tool-error-summary" title={title}>
    {issues && <List size="sm">{issues.map(({ message, inputId, selection }, index) => <List.Item key={index}>
      {inputId ? <Anchor href={'#' + inputId} c="red.9" underline="always" onClick={event => {
        event.preventDefault();
        focusErrorInput(document.getElementById(inputId), selection);
      }}>{message}</Anchor> : message}
    </List.Item>)}</List>}
  </Alert>;
}
