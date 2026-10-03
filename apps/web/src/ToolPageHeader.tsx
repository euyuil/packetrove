import type { ReactNode } from 'react';
import { Stack, Text } from '@mantine/core';
import { toolCatalog, type ToolPage } from '@packetrove/contracts';
import { useTranslation } from 'react-i18next';
import { ToolHeading } from './ToolHeading';

export function ToolPageHeader({ tool, notice }: { tool: ToolPage; notice: ReactNode }) {
  const { t } = useTranslation();
  const { page } = toolCatalog[tool];

  return <Stack component="section" aria-labelledby="tool-title" gap="xs">
    <Text size="xs" c="var(--mantine-primary-color-filled)" fw={700}>{t($ => $.common.tools)}</Text>
    <ToolHeading tool={tool} order={1} id="tool-title" fz={{ base: 26, sm: 32 }} />
    <Text c="dimmed">{t($ => $[page].description)}</Text>
    <Text size="sm" c="var(--mantine-primary-color-filled)">{notice}</Text>
  </Stack>;
}
