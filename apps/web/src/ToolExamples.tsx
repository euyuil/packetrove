import type { ReactNode } from 'react';
import { Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';

export function ToolExamples({ title, description, columns = 2, children }: {
  title: ReactNode; description?: ReactNode; columns?: number; children: ReactNode;
}) {
  return <Stack component="section" aria-labelledby="examples-heading" gap="md">
    <Title order={2} size="h3" id="examples-heading">{title}</Title>
    {description && <Text size="sm" c="dimmed">{description}</Text>}
    <SimpleGrid cols={{ base: 1, md: columns }} spacing="lg">{children}</SimpleGrid>
  </Stack>;
}

export function ToolExampleCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return <Paper withBorder p="md">
    <Stack gap="sm">
      <Title order={3} size="h4">{title}</Title>
      {children}
    </Stack>
  </Paper>;
}
