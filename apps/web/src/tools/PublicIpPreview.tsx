import { useTranslation } from 'react-i18next';
import { Badge, Text } from '@mantine/core';
import { toolCatalog } from '@packetrove/contracts';

export function PublicIpPreview() {
  const { t } = useTranslation();
  const example = toolCatalog.ip.example;
  return <>
    <Text size="xs" c="dimmed">{t($ => $.ip.resultLabel)}</Text>
    <Text size="xl" fw={600} className="network-value">{example.result.ip}</Text>
    <Badge variant="light">{example.result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</Badge>
    <Text size="sm" c="dimmed">{t($ => $.home.ipPreview)}</Text>
  </>;
}
