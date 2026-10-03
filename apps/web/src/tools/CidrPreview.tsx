import { useTranslation } from 'react-i18next';
import { Code, Text } from '@mantine/core';
import { toolCatalog } from '@packetrove/contracts';
import { resolveLocale } from '../i18n/locales';

export function CidrPreview() {
  const { t, i18n } = useTranslation();
  const example = toolCatalog.cidr.example;
  const additional = new Intl.NumberFormat(resolveLocale(i18n.resolvedLanguage)).format(BigInt(example.result.additionalAddressCount));
  return <>
    <Text size="xs" c="dimmed">{t($ => $.home.previewInputs)}</Text>
    <Code block>{example.request.inputs.join('\n')}</Code>
    <Text size="xs" c="dimmed">{t($ => $.cidr.resultLabel)}</Text>
    <Text size="xl" fw={600} className="network-value">{example.result.cidr}</Text>
    <Text size="sm">{t($ => $.cidr.additional)}: {additional}</Text>
  </>;
}
