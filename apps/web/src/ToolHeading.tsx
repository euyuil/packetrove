import { Group, rem, ThemeIcon, Title, type TitleProps } from '@mantine/core';
import { toolCatalog, type ToolPage } from '@packetrove/contracts';
import { useTranslation } from 'react-i18next';
import { ToolIcon } from './ToolIcon';

type ToolHeadingProps = Pick<TitleProps, 'size' | 'fz'> & {
  tool: ToolPage;
  id: string;
  order: NonNullable<TitleProps['order']>;
};

export function ToolHeading({ tool, id, order, ...typography }: ToolHeadingProps) {
  const { t } = useTranslation();
  const { page } = toolCatalog[tool];

  // A matching first-line height keeps the icon aligned when the name wraps.
  return <Group gap={12} wrap="nowrap" align="flex-start">
    <ThemeIcon variant="light" size={40} flex="0 0 auto" aria-hidden="true">
      <ToolIcon tool={page} size={24} />
    </ThemeIcon>
    <Title {...typography} order={order} id={id} lh={rem(40)} flex={1} miw={0}
      style={{ overflowWrap: 'anywhere' }}>
      {t($ => $[page].title)}
    </Title>
  </Group>;
}
