import { lazy, Suspense, useEffect, useState, type MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, Code, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { CIDR_COVER_EXAMPLES, CIDR_COVER_PATH, PUBLIC_IP_PATH } from '@packetrove/contracts';
import { getApiUrl } from './api';
import { localizedPath, pagePaths } from './i18n/routes';
import { resolveLocale } from './i18n/locales';

const ApiReference = lazy(() => import('./ApiReference'));

export default function ApiDocumentation({ onNavigate }: { onNavigate: MouseEventHandler<HTMLAnchorElement> }) {
  const { t, i18n } = useTranslation();
  const [interactive, setInteractive] = useState(false);
  useEffect(() => { setInteractive(true); }, []);
  const example = CIDR_COVER_EXAMPLES[1]!;
  const cidrRequest = `curl -fsS ${getApiUrl(CIDR_COVER_PATH)} \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(example.request)}'`;
  return <Stack component="section" gap="lg" aria-labelledby="api-documentation-heading">
    <Group justify="space-between" align="center">
      <Title order={1} size="h2" id="api-documentation-heading">{t($ => $.api.title)}</Title>
      <Anchor href={getApiUrl('/openapi.json')} size="sm">{t($ => $.api.specification)} <span aria-hidden="true">↗</span></Anchor>
    </Group>
    <Text c="dimmed" size="sm">
      {t($ => $.api.description)}
    </Text>
    <Anchor href={localizedPath(pagePaths.mcp, resolveLocale(i18n.resolvedLanguage))} onClick={onNavigate}>
      {t($ => $.home.mcpGuide)}
    </Anchor>
    {resolveLocale(i18n.resolvedLanguage) !== 'en' && <Text size="sm" c="dimmed">{t($ => $.api.englishReference)}</Text>}
    <Paper component="section" withBorder p="lg" aria-labelledby="cidr-api-heading">
      <Stack gap="sm">
        <Title order={2} size="h3" id="cidr-api-heading">POST {CIDR_COVER_PATH}</Title>
        <Text>{t($ => $.api.cidrSummary)}</Text>
        <Code block>{cidrRequest}</Code>
        <Text size="sm" c="dimmed">{t($ => $.api.cidrResponse, {
          cidr: example.result.cidr, additional: example.result.additionalAddressCount,
        })}</Text>
      </Stack>
    </Paper>
    <Paper component="section" withBorder p="lg" aria-labelledby="ip-api-heading">
      <Stack gap="sm">
        <Title order={2} size="h3" id="ip-api-heading">GET {PUBLIC_IP_PATH}</Title>
        <Text>{t($ => $.api.ipSummary)}</Text>
        <Code block>{`curl -fsS ${getApiUrl(PUBLIC_IP_PATH)} -H 'Accept: text/plain'`}</Code>
      </Stack>
    </Paper>
    {interactive && <Suspense fallback={<Group role="status"><Loader size="sm" /><Text>{t($ => $.api.loading)}</Text></Group>}>
      <ApiReference />
    </Suspense>}
  </Stack>;
}
