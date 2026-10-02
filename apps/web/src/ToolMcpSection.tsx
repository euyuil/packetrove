import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, Code, Paper, Stack, Text, Title } from '@mantine/core';
import { MCP_PATH } from '@packetrove/contracts';
import { getApiUrl } from './api';
import { localizedPath, pagePaths } from './i18n/routes';
import { resolveLocale } from './i18n/locales';
import type { McpExampleTool } from './mcp-examples';
import { getMcpToolContent } from './mcp-guide';

export function ToolMcpSection({ tool, onNavigate, guide = false }: {
  tool: McpExampleTool;
  onNavigate?: MouseEventHandler<HTMLAnchorElement> | undefined;
  guide?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const content = getMcpToolContent(tool, locale);
  const example = content.example;
  const headingId = tool + '-mcp-heading';
  return <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} miw={0}
    aria-labelledby={headingId} data-mcp-tool={example.name}>
    <Stack gap="md">
      <Title order={2} size="h3" id={headingId}>{content.title}</Title>
      <Text>{content.purpose}</Text>
      <Stack gap="xs">
        <Text size="sm">{t($ => $.mcp.toolName)}: <Code>{example.name}</Code></Text>
        <Text size="sm">{t($ => $.home.serverAddress)}: <Code>{getApiUrl(MCP_PATH)}</Code></Text>
        <Text size="sm" c="dimmed">{t($ => $.mcp.connection)}</Text>
      </Stack>
      <Text size="sm">{content.inputs}</Text>
      <Text size="sm" fw={600}>{t($ => $.mcp.arguments)}</Text>
      <Code block data-mcp-example="arguments">{JSON.stringify(example.arguments, null, 2)}</Code>
      <Text size="sm" fw={600}>{t($ => $.mcp.exampleResult)}</Text>
      <Code block data-mcp-example="result">{JSON.stringify(example.result, null, 2)}</Code>
      <Text size="sm" c="dimmed">{content.result}</Text>
      <Text size="sm" c="dimmed">{content.boundary}</Text>
      {content.expansion && <Text size="sm" c="dimmed">{content.expansion}</Text>}
      <Anchor href={localizedPath(guide ? pagePaths[tool] : pagePaths.mcp, locale)} onClick={onNavigate}>
        {guide ? content.openTool : t($ => $.home.mcpGuide)}
      </Anchor>
    </Stack>
  </Paper>;
}
