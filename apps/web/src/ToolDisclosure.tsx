import type { ReactNode } from 'react';
import { Accordion, Box, Text } from '@mantine/core';

export function ToolDisclosure({ headingId, title, description, children }: {
  headingId: string; title: ReactNode; description?: ReactNode; children: ReactNode;
}) {
  return <Box component="section" aria-labelledby={headingId}>
    <Accordion variant="contained" radius="md" order={2} keepMounted keepMountedMode="display-none">
      <Accordion.Item value={headingId}>
        <Accordion.Control><Text component="span" id={headingId} size="lg" fw={600}>{title}</Text></Accordion.Control>
        {description && <Text size="sm" c="dimmed" px="md" pb="md">{description}</Text>}
        <Accordion.Panel>{children}</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  </Box>;
}
