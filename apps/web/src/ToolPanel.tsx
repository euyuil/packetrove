import type { AriaAttributes, ReactNode, Ref } from 'react';
import { Group, Paper, Stack, Title, type PaperProps } from '@mantine/core';

type ToolPanelProps = Omit<PaperProps, 'title' | 'children'> & Pick<AriaAttributes, 'aria-busy'> & {
  headingId: string;
  title: ReactNode;
  headerAside?: ReactNode;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

export function ToolPanel({ headingId, title, headerAside, children, ...paperProps }: ToolPanelProps) {
  return <Paper component="section" withBorder p={{ base: 'md', sm: 'lg' }} miw={0} {...paperProps} aria-labelledby={headingId}>
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2} size="h3" id={headingId}>{title}</Title>
        {headerAside}
      </Group>
      {children}
    </Stack>
  </Paper>;
}
