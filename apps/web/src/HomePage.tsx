import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, Badge, Code, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { MCP_PATH } from '@packetrove/contracts';
import { getApiUrl } from './api';
import { localizedPath, pagePaths } from './i18n/routes';
import { resolveLocale } from './i18n/locales';
import { ToolGallery } from './ToolGallery';

export function HomePage({ documentationUrl, onNavigate }: {
  documentationUrl: string; onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);

  return <Stack gap="xl">
    <Stack component="section" aria-labelledby="project-title" gap="md" py={{ base: 'md', sm: 'xl' }}>
      <Title order={1} id="project-title" maw={760} style={{ overflowWrap: 'anywhere' }}>{t($ => $.common.tagline)}</Title>
      <Text size="lg" c="dimmed" maw={760}>{t($ => $.home.description)}</Text>
      <Group gap="sm">
        <Badge variant="light">{t($ => $.home.openSource)}</Badge>
        <Badge variant="light">{t($ => $.home.anonymous)}</Badge>
      </Group>
    </Stack>
    <ToolGallery onNavigate={onNavigate} />
    <Stack component="section" gap="md" aria-labelledby="integrations-heading">
      <Title order={2} size="h3" id="integrations-heading">{t($ => $.home.integrationsTitle)}</Title>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        <Paper component="section" withBorder p="lg" miw={0} aria-labelledby="api-heading">
          <Stack gap="md" h="100%">
            <Title order={3} size="h4" id="api-heading">{t($ => $.home.apiTitle)}</Title>
            <Text size="sm" c="dimmed" flex={1}>{t($ => $.home.apiIntroduction)}</Text>
            <Anchor size="sm" href={localizedPath(pagePaths.api, locale)} onClick={onNavigate}>{t($ => $.home.apiGuide)}</Anchor>
          </Stack>
        </Paper>
        <Paper component="section" withBorder p="lg" miw={0} aria-labelledby="cli-heading">
          <Stack gap="md" h="100%">
            <Title order={3} size="h4" id="cli-heading">{t($ => $.home.cliTitle)}</Title>
            <Text size="sm" c="dimmed" flex={1}>{t($ => $.home.cliIntroduction)}</Text>
            <Anchor size="sm" href={`${documentationUrl}/docs/integrations/cli.md`}>{t($ => $.home.cliGuide)}</Anchor>
          </Stack>
        </Paper>
        <Paper component="section" withBorder p="lg" miw={0} aria-labelledby="mcp-heading">
          <Stack gap="md" h="100%">
            <Title order={3} size="h4" id="mcp-heading">{t($ => $.home.mcpTitle)}</Title>
            <Text size="sm" c="dimmed" flex={1}>{t($ => $.home.mcpDescription)}</Text>
            <Code className="network-value">{getApiUrl(MCP_PATH)}</Code>
            <Anchor size="sm" href={localizedPath(pagePaths.mcp, locale)} onClick={onNavigate}>{t($ => $.home.mcpGuide)}</Anchor>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  </Stack>;
}
