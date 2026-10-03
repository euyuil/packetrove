import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, Box, Code, Stack, Text } from '@mantine/core';
import { MCP_PATH, type ToolPage } from '@packetrove/contracts';
import { getApiUrl } from './api';
import { localizedPath, pagePaths } from './i18n/routes';
import { resolveLocale } from './i18n/locales';
import { getMcpToolContent } from './mcp-guide';
import { ToolDisclosure } from './ToolDisclosure';

export function ToolMcpSection({ tool, onNavigate, guide = false }: {
  tool: ToolPage;
  onNavigate?: MouseEventHandler<HTMLAnchorElement> | undefined;
  guide?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const content = getMcpToolContent(tool, locale);
  const example = content.example;
  const headingId = tool + '-mcp-heading';
  const body = <Stack gap="md">
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
    <Text size="sm" fw={600}>{t($ => $.mcp.resourceLinkLabel)}</Text>
    <Code block data-mcp-example="resource-link">{JSON.stringify(content.resourceLink, null, 2)}</Code>
    <Text size="sm" c="dimmed">{content.result}</Text>
    <Text size="sm" c="dimmed">{content.boundary}</Text>
    {content.exampleNote && <Text size="sm" c="dimmed">{content.exampleNote}</Text>}
    <Anchor href={localizedPath(guide ? pagePaths[tool] : pagePaths.mcp, locale)} onClick={onNavigate}>
      {guide ? content.openTool : t($ => $.home.mcpGuide)}
    </Anchor>
  </Stack>;
  return <Box miw={0} data-mcp-tool={example.name}>
    <ToolDisclosure headingId={headingId} title={content.title}>{body}</ToolDisclosure>
  </Box>;
}
