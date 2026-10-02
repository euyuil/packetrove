import type { ReactNode } from 'react';
import { Paper, SimpleGrid, Stack, Title } from '@mantine/core';
import { ToolDisclosure } from './ToolDisclosure';

export function ToolExamples({ title, description, columns = 2, children }: {
  title: ReactNode; description?: ReactNode; columns?: number; children: ReactNode;
}) {
  return <ToolDisclosure headingId="examples-heading" title={title} description={description}>
    <SimpleGrid cols={{ base: 1, md: columns }} spacing="lg">{children}</SimpleGrid>
  </ToolDisclosure>;
}

export function ToolExampleCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return <Paper withBorder p="md">
    <Stack gap="sm">
      <Title order={3} size="h4">{title}</Title>
      {children}
    </Stack>
  </Paper>;
}
