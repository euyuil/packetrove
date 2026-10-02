import type { ReactNode } from 'react';
import { Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { toolCatalog, type ToolPage } from '@packetrove/contracts';
import { useTranslation } from 'react-i18next';
import { ToolIcon } from './ToolIcon';

export function ToolPageHeader({ tool, notice }: { tool: ToolPage; notice: ReactNode }) {
  const { t } = useTranslation();
  const { page } = toolCatalog[tool];

  return <Stack component="section" aria-labelledby="tool-title" gap="sm">
    <Text size="xs" c="var(--mantine-primary-color-filled)" fw={700}>{t($ => $.common.tools)}</Text>
    <Group gap="md" wrap="nowrap">
      <ThemeIcon variant="light" size={48} flex="0 0 auto"><ToolIcon tool={page} size={28} /></ThemeIcon>
      <Title order={1} id="tool-title" flex={1}>{t($ => $[page].title)}</Title>
    </Group>
    <Text c="dimmed">{t($ => $[page].description)}</Text>
    <Text size="sm" c="var(--mantine-primary-color-filled)">{notice}</Text>
  </Stack>;
}
