import { useTranslation } from 'react-i18next';
import { Code, SimpleGrid, Stack, Text } from '@mantine/core';
import { toolCatalog } from '@packetrove/contracts';
import { resolveLocale } from '../i18n/locales';

export function SubtractPreview() {
  const { t, i18n } = useTranslation();
  const example = toolCatalog.subtract.example;
  const remaining = new Intl.NumberFormat(resolveLocale(i18n.resolvedLanguage)).format(BigInt(example.result.remainingAddressCount));
  return <>
    <SimpleGrid cols={2} spacing="sm">
      {(['include', 'exclude'] as const).map(list => <Stack key={list} gap={4} miw={0}>
        <Text size="xs" c="dimmed">{t($ => list === 'include' ? $.subtract.includeLabel : $.subtract.excludeLabel)}</Text>
        <Text size="sm" className="network-value">{example.request[list].join(', ')}</Text>
      </Stack>)}
    </SimpleGrid>
    <Text size="xs" c="dimmed">{t($ => $.subtract.blocks)}</Text>
    <Code block>{example.result.cidrs.join('\n')}</Code>
    <Text size="sm">{t($ => $.subtract.remaining)}: {remaining}</Text>
  </>;
}
