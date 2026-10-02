import type { MouseEventHandler } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Anchor, Badge, Code, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { MCP_PATH, PUBLIC_IP_PATH } from '@packetrove/contracts';
import cliPackage from '../../../packages/cli/package.json';
import { getApiUrl } from './api';
import { localizedPath, pagePaths } from './i18n/routes';
import { resolveLocale } from './i18n/locales';

export function HomePage({ documentationUrl, repositoryUrl, onNavigate }: {
  documentationUrl: string; repositoryUrl: string; onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const apiExample = `curl -fsS ${getApiUrl(PUBLIC_IP_PATH)} \\
  -H 'Accept: text/plain'`;
  const cliInstall = [
    `git clone ${repositoryUrl}.git`,
    'cd packetrove',
    'pnpm install',
    'pnpm --filter @packetrove/cli pack --pack-destination "$PWD"',
    `npm install --global ./packetrove-cli-${cliPackage.version}.tgz`,
  ].join('\n');
  const mcpUrl = getApiUrl(MCP_PATH);

  return <Stack gap="xl">
    <Stack component="section" aria-labelledby="project-title" gap="md" py={{ base: 'md', sm: 'xl' }}>
      <Title order={1} id="project-title" maw={760}>{t($ => $.common.tagline)}</Title>
      <Text size="lg" c="dimmed" maw={760}>
        {t($ => $.home.description)}
      </Text>
      <Group gap="sm">
        <Badge variant="light">{t($ => $.home.openSource)}</Badge>
        <Badge variant="light">{t($ => $.home.anonymous)}</Badge>
      </Group>
    </Stack>
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="home-cidr-heading">
        <Stack gap="md">
          <Title order={2} size="h3" id="home-cidr-heading">{t($ => $.cidr.title)}</Title>
          <Text c="dimmed">{t($ => $.home.cidrDescription)}</Text>
          <Anchor href={localizedPath('/cidr', locale)} onClick={onNavigate}>{t($ => $.home.cidrLink)}</Anchor>
        </Stack>
      </Paper>
      <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="home-ip-heading">
        <Stack gap="md">
          <Title order={2} size="h3" id="home-ip-heading">{t($ => $.ip.title)}</Title>
          <Text c="dimmed">{t($ => $.home.ipDescription)}</Text>
          <Anchor href={localizedPath('/ip', locale)} onClick={onNavigate}>{t($ => $.home.ipLink)}</Anchor>
        </Stack>
      </Paper>
    </SimpleGrid>
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} miw={0} aria-labelledby="api-heading">
        <Stack gap="md">
          <Title order={2} size="h3" id="api-heading">{t($ => $.home.apiTitle)}</Title>
          <Text c="dimmed">{t($ => $.home.apiDescription)}</Text>
          <Code block>{apiExample}</Code>
          <Text size="sm" c="dimmed"><Trans i18nKey={$ => $.home.apiResponse} components={{ code: <Code /> }} /></Text>
          <Anchor size="sm" href={localizedPath('/docs/api', locale)} onClick={onNavigate}>{t($ => $.home.apiGuide)}</Anchor>
        </Stack>
      </Paper>
      <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} miw={0} aria-labelledby="cli-heading">
        <Stack gap="md">
          <Title order={2} size="h3" id="cli-heading">{t($ => $.home.cliTitle)}</Title>
          <Text c="dimmed">{t($ => $.home.cliDescription)}</Text>
          <Code block>{cliInstall}</Code>
          <Text size="sm" c="dimmed">{t($ => $.home.cliExample)}</Text>
          <Code block>packetrove ip</Code>
          <Anchor size="sm" href={`${documentationUrl}/docs/integrations/cli.md`}>{t($ => $.home.cliGuide)}</Anchor>
        </Stack>
      </Paper>
    </SimpleGrid>
    <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="mcp-heading">
      <Stack gap="md">
        <Title order={2} size="h3" id="mcp-heading">{t($ => $.home.mcpTitle)}</Title>
        <Text c="dimmed">{t($ => $.home.mcpDescription)}</Text>
        <Stack gap="xs">
          <Text size="sm" fw={600}>{t($ => $.home.serverAddress)}</Text>
          <Code block>{mcpUrl}</Code>
        </Stack>
        <Text size="sm" c="dimmed">{t($ => $.mcp.connection)}</Text>
        <Anchor size="sm" href={localizedPath(pagePaths.mcp, locale)} onClick={onNavigate}>{t($ => $.home.mcpGuide)}</Anchor>
      </Stack>
    </Paper>
  </Stack>;
}
