import { useTranslation } from 'react-i18next';
import { Code, SimpleGrid, Stack, Text } from '@mantine/core';
import { toolCatalog } from '@packetrove/contracts';
import { resolveLocale } from '../i18n/locales';

export function RangePreview() {
  const { t, i18n } = useTranslation();
  const example = toolCatalog.range.example;
  const addresses = new Intl.NumberFormat(resolveLocale(i18n.resolvedLanguage)).format(BigInt(example.result.addressCount));
  return <>
    <SimpleGrid cols={2} spacing="sm">
      {(['start', 'end'] as const).map(field => <Stack key={field} gap={4} miw={0}>
        <Text size="xs" c="dimmed">{t($ => field === 'start' ? $.range.start : $.range.end)}</Text>
        <Text size="sm" className="network-value">{example.request[field]}</Text>
      </Stack>)}
    </SimpleGrid>
    <Text size="xs" c="dimmed">{t($ => $.range.output)}</Text>
    <Code block>{example.result.cidrs.join('\n')}</Code>
    <Text size="sm">{t($ => $.range.addresses)}: {addresses}</Text>
  </>;
}
