import type { ReactNode, Ref } from 'react';
import { Alert, Anchor, List } from '@mantine/core';

export function ToolErrorSummary({ id, title, issues, ref }: {
  id: string; title: ReactNode; issues?: { message: string; inputId?: string }[] | undefined;
  ref: Ref<HTMLDivElement>;
}) {
  return <Alert ref={ref} id={id} color="red" role="alert" tabIndex={-1}
    className="tool-error-summary" title={title}>
    {issues && <List size="sm">{issues.map(({ message, inputId }, index) => <List.Item key={index}>
      {inputId ? <Anchor href={'#' + inputId} c="red.9" underline="always" onClick={event => {
        event.preventDefault();
        document.getElementById(inputId)?.focus();
      }}>{message}</Anchor> : message}
    </List.Item>)}</List>}
  </Alert>;
}
