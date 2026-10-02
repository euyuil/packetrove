import { lazy, Suspense, useEffect, useState, type MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, Code, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { tools } from '@packetrove/contracts';
import { getApiUrl } from './api';
import { localizedPath, pagePaths } from './i18n/routes';
import { resolveLocale } from './i18n/locales';

const ApiReference = lazy(() => import('./ApiReference'));

export default function ApiDocumentation({ onNavigate }: { onNavigate: MouseEventHandler<HTMLAnchorElement> }) {
  const { t, i18n } = useTranslation();
  const [interactive, setInteractive] = useState(false);
  useEffect(() => { setInteractive(true); }, []);
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
    {tools.map(tool => <Paper key={tool.id} component="section" withBorder p="lg" aria-labelledby={tool.page + '-api-heading'}>
      <Stack gap="sm">
        <Title order={2} size="h3" id={tool.page + '-api-heading'}>{tool.api.method.toUpperCase()} {tool.api.path}</Title>
        <Text>{t($ => $.api[`${tool.page}Summary`])}</Text>
        <Code block>{tool.api.method === 'post'
          ? `curl -fsS ${getApiUrl(tool.api.path)} \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(tool.example.request)}'`
          : `curl -fsS ${getApiUrl(tool.api.path)} -H 'Accept: text/plain'`}</Code>
        {tool.page === 'cidr' && <Text size="sm" c="dimmed">{t($ => $.api.cidrResponse, {
          cidr: tool.example.result.cidr, additional: tool.example.result.additionalAddressCount,
        })}</Text>}
        {tool.page === 'subtract' && <Text size="sm" c="dimmed">{t($ => $.api.subtractResponse, {
          cidrs: tool.example.result.cidrs.join(', '), remaining: tool.example.result.remainingAddressCount,
        })}</Text>}
      </Stack>
    </Paper>)}
    {interactive && <Suspense fallback={<Group role="status"><Loader size="sm" /><Text>{t($ => $.api.loading)}</Text></Group>}>
      <ApiReference />
    </Suspense>}
  </Stack>;
}
