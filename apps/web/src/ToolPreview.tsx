import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Paper, Stack } from '@mantine/core';
import { toolCatalog, type ToolPage } from '@packetrove/contracts';
import { CidrPreview } from './tools/CidrPreview';
import { SubtractPreview } from './tools/SubtractPreview';
import { RangePreview } from './tools/RangePreview';
import { PublicIpPreview } from './tools/PublicIpPreview';

const previews = {
  cidr: CidrPreview, subtract: SubtractPreview, range: RangePreview, ip: PublicIpPreview,
} satisfies Record<ToolPage, ComponentType>;

export function ToolPreview({ tool }: { tool: ToolPage }) {
  const { t } = useTranslation();
  const Preview = previews[tool];
  return <Paper withBorder p="md" bg="var(--mantine-color-gray-0)" data-tool-preview={toolCatalog[tool].id}>
    <Stack gap="sm">
      <Badge size="sm" variant="outline">{t($ => $.home.previewLabel)}</Badge>
      <Preview />
    </Stack>
  </Paper>;
}
