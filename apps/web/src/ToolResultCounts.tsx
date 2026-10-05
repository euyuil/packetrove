import { SimpleGrid, Stack, Text, type SimpleGridProps } from '@mantine/core';

export function ToolResultCounts({ items, columns = 2 }: {
  items: { label: string; value: string; emphasis?: boolean }[]; columns?: SimpleGridProps['cols'];
}) {
  return <SimpleGrid component="dl" cols={columns} spacing="md" m={0}>
    {items.map(({ label, value, emphasis }) => <Stack key={label} gap={4} miw={0}>
      <Text component="dt" size="sm" c="dimmed">{label}</Text>
      <Text component="dd" m={0} className="network-value" size="xl" fw={600}
        {...(emphasis ? { c: 'var(--mantine-primary-color-filled)' } : {})}>{value}</Text>
    </Stack>)}
  </SimpleGrid>;
}
