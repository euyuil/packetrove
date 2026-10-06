import type { MouseEventHandler } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Anchor, Code, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { MCP_PATH } from '@packetrove/contracts';
import { getApiUrl } from './api';
import { ToolMcpSection } from './ToolMcpSection';
import { getMcpGuide } from './mcp-guide';
import { resolveLocale } from './i18n/locales';
import { localizedPath, pagePaths } from './i18n/routes';

function InlineCode({ text }: { text: string }) {
  return <Trans defaults={text} components={{ code: <Code /> }} />;
}

export function McpDocumentation({ onNavigate, documentationUrl, sourceUrl }: {
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
  documentationUrl: string;
  sourceUrl: string;
}) {
  const { i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const guide = getMcpGuide(locale, getApiUrl(MCP_PATH));
  return <Stack component="section" gap="xl" aria-labelledby="mcp-documentation-heading">
    <Stack gap="sm">
      <Title order={1} id="mcp-documentation-heading">{guide.title}</Title>
      <Text c="dimmed">{guide.explanation}</Text>
      <Text>{guide.connection}</Text>
      <Code block>{guide.serverUrl}</Code>
      <Group gap="md">
        <Anchor href={localizedPath(pagePaths.api, locale)} onClick={onNavigate}>{guide.labels.api}</Anchor>
        <Anchor href={sourceUrl} target="_blank" rel="noopener noreferrer">{guide.labels.source}</Anchor>
      </Group>
    </Stack>
    <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="mcp-connect-heading">
      <Stack gap="md">
        <Title order={2} size="h3" id="mcp-connect-heading">{guide.connectTitle}</Title>
        <Text>{guide.connectDescription}</Text>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {guide.clients.map(client => <Stack gap="sm" miw={0} key={client.name}>
            <Title order={3} size="h4">{client.name}</Title>
            <Code block>{client.command}</Code>
            <Anchor size="sm" href={client.url}>{client.label}</Anchor>
          </Stack>)}
        </SimpleGrid>
        <Text><InlineCode text={guide.check} /></Text>
        <Text size="sm" c="dimmed">{guide.discovery}</Text>
      </Stack>
    </Paper>
    <Stack component="section" gap="sm" aria-labelledby="mcp-identity-heading">
      <Title order={2} size="h3" id="mcp-identity-heading">{guide.identity.title}</Title>
      <Text>{guide.identity.explanation}</Text>
      <Code block data-mcp-server-identity>{JSON.stringify(guide.identity.metadata, null, 2)}</Code>
      <Text size="sm" c="dimmed">{guide.identity.presentation}</Text>
    </Stack>
    {guide.tools.map(tool => <ToolMcpSection key={tool.tool} tool={tool.tool} onNavigate={onNavigate} guide />)}
    <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="mcp-feedback-heading">
      <Stack gap="sm">
        <Title order={2} size="h3" id="mcp-feedback-heading">{guide.support.title}</Title>
        <Text>{guide.support.availability}</Text>
        <Text>{guide.support.authorization}</Text>
        <Code>{guide.support.example.name}</Code>
        <Text>{guide.support.inputs}</Text>
        <Title order={3} size="h4">{guide.labels.arguments}</Title>
        <Code block>{JSON.stringify(guide.support.example.arguments, null, 2)}</Code>
        <Title order={3} size="h4">{guide.labels.exampleResult}</Title>
        <Code block>{JSON.stringify(guide.support.example.result, null, 2)}</Code>
        <Text>{guide.support.limits}</Text>
        <Text>{guide.support.delivery}</Text>
        <Text size="sm" c="dimmed">{guide.support.privacy}</Text>
        <Anchor href={localizedPath(pagePaths.privacy, locale)} onClick={onNavigate}>{guide.deployment.privacyLabel}</Anchor>
      </Stack>
    </Paper>
    <Stack component="section" gap="sm" aria-labelledby="mcp-errors-heading">
      <Title order={2} size="h3" id="mcp-errors-heading">{guide.errorsTitle}</Title>
      <Text><InlineCode text={guide.results} /></Text>
      <Text><InlineCode text={guide.resultLinks} /></Text>
      <Text><InlineCode text={guide.errors} /></Text>
      <Text size="sm" c="dimmed">{guide.httpErrors}</Text>
    </Stack>
    <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="mcp-sdk-heading">
      <Stack gap="md">
        <Title order={2} size="h3" id="mcp-sdk-heading">{guide.sdk.title}</Title>
        <Text><InlineCode text={guide.sdk.description} /></Text>
        <Code block data-mcp-sdk-example>{guide.sdk.code}</Code>
        <Code block>{guide.sdk.command}</Code>
        <Text size="sm" c="dimmed"><InlineCode text={guide.sdk.local} /></Text>
      </Stack>
    </Paper>
    <Stack component="section" gap="sm" aria-labelledby="mcp-deployment-heading">
      <Title order={2} size="h3" id="mcp-deployment-heading">{guide.deployment.title}</Title>
      {guide.deployment.paragraphs.map(text => <Text size="sm" c="dimmed" key={text}><InlineCode text={text} /></Text>)}
      <Anchor href={`${documentationUrl}/docs/deployment.md`}>{guide.deployment.label}</Anchor>
      <Anchor href={localizedPath(pagePaths.privacy, locale)} onClick={onNavigate}>{guide.deployment.privacyLabel}</Anchor>
      <Anchor href={`${documentationUrl}/docs/cli-publishing.md#publish-to-the-official-mcp-registry`}>{guide.deployment.registryLabel}</Anchor>
      <Anchor href={`${documentationUrl}/docs/integrations/mcp.md`}>{guide.labels.technicalGuide}</Anchor>
    </Stack>
  </Stack>;
}
