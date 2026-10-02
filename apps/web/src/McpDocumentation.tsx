import type { MouseEventHandler } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Anchor, Code, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { MCP_PATH, tools } from '@packetrove/contracts';
import { getApiUrl } from './api';
import { ToolMcpSection } from './ToolMcpSection';

export function McpDocumentation({ onNavigate, documentationUrl }: {
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
  documentationUrl: string;
}) {
  const { t } = useTranslation();
  const serverUrl = getApiUrl(MCP_PATH);
  return <Stack component="section" gap="xl" aria-labelledby="mcp-documentation-heading">
    <Stack gap="sm">
      <Title order={1} id="mcp-documentation-heading">{t($ => $.mcp.title)}</Title>
      <Text c="dimmed">{t($ => $.mcp.explanation)}</Text>
      <Text>{t($ => $.mcp.connection)}</Text>
      <Code block>{serverUrl}</Code>
    </Stack>
    <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="mcp-connect-heading">
      <Stack gap="md">
        <Title order={2} size="h3" id="mcp-connect-heading">{t($ => $.mcp.connectTitle)}</Title>
        <Text>{t($ => $.mcp.connectDescription)}</Text>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Stack gap="sm" miw={0}>
            <Title order={3} size="h4">Claude Code</Title>
            <Code block>{`claude mcp add --transport http --scope user packetrove \\\n  ${serverUrl}`}</Code>
            <Anchor size="sm" href="https://code.claude.com/docs/en/mcp">{t($ => $.mcp.clientGuide, { client: 'Claude Code' })}</Anchor>
          </Stack>
          <Stack gap="sm" miw={0}>
            <Title order={3} size="h4">Codex</Title>
            <Code block>{`codex mcp add packetrove \\\n  --url ${serverUrl}`}</Code>
            <Anchor size="sm" href="https://developers.openai.com/codex/mcp/">{t($ => $.mcp.clientGuide, { client: 'Codex' })}</Anchor>
          </Stack>
        </SimpleGrid>
        <Text><Trans i18nKey={$ => $.mcp.check} values={{ tools: tools.map(tool => tool.mcp.name).join(', ') }}
          components={{ code: <Code /> }} /></Text>
        <Text size="sm" c="dimmed">{t($ => $.mcp.discovery)}</Text>
      </Stack>
    </Paper>
    {tools.map(tool => <ToolMcpSection key={tool.id} tool={tool.page} onNavigate={onNavigate} guide />)}
    <Stack component="section" gap="sm" aria-labelledby="mcp-errors-heading">
      <Title order={2} size="h3" id="mcp-errors-heading">{t($ => $.mcp.errorsTitle)}</Title>
      <Text><Trans i18nKey={$ => $.mcp.results} components={{ code: <Code /> }} /></Text>
      <Text><Trans i18nKey={$ => $.mcp.errors} components={{ code: <Code /> }} /></Text>
      <Anchor href={`${documentationUrl}/docs/integrations/mcp.md`}>{t($ => $.mcp.technicalGuide)}</Anchor>
    </Stack>
  </Stack>;
}
