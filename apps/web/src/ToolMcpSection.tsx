import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, Code, Paper, Stack, Text, Title } from '@mantine/core';
import { MAX_INPUTS, MAX_INPUT_LENGTH, MAX_SUBTRACTION_INPUTS, MAX_SUBTRACTION_OUTPUTS, MCP_PATH } from '@packetrove/contracts';
import { getApiUrl } from './api';
import { localizedPath, pagePaths } from './i18n/routes';
import { resolveLocale } from './i18n/locales';
import { mcpExamples, type McpExampleTool } from './mcp-examples';

export function ToolMcpSection({ tool, onNavigate, guide = false }: {
  tool: McpExampleTool;
  onNavigate?: MouseEventHandler<HTMLAnchorElement> | undefined;
  guide?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const example = mcpExamples[tool];
  const headingId = tool + '-mcp-heading';
  return <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} miw={0}
    aria-labelledby={headingId} data-mcp-tool={example.name}>
    <Stack gap="md">
      <Title order={2} size="h3" id={headingId}>{t($ => $.discovery[tool].mcpTitle)}</Title>
      <Text>{t($ => $.discovery[tool].purpose)}</Text>
      <Stack gap="xs">
        <Text size="sm">{t($ => $.mcp.toolName)}: <Code>{example.name}</Code></Text>
        <Text size="sm">{t($ => $.home.serverAddress)}: <Code>{getApiUrl(MCP_PATH)}</Code></Text>
        <Text size="sm" c="dimmed">{t($ => $.mcp.connection)}</Text>
      </Stack>
      <Text size="sm">{t($ => $.discovery[tool].inputs, {
          maximumInputs: new Intl.NumberFormat(locale).format(tool === 'subtract' ? MAX_SUBTRACTION_INPUTS : MAX_INPUTS),
          maximumLength: MAX_INPUT_LENGTH,
      })}</Text>
      <Text size="sm" fw={600}>{t($ => $.mcp.arguments)}</Text>
      <Code block data-mcp-example="arguments">{JSON.stringify(example.arguments, null, 2)}</Code>
      <Text size="sm" fw={600}>{t($ => $.mcp.exampleResult)}</Text>
      <Code block data-mcp-example="result">{JSON.stringify(example.result, null, 2)}</Code>
      <Text size="sm" c="dimmed">{t($ => $.discovery[tool].result, {
        maximumOutputs: new Intl.NumberFormat(locale).format(MAX_SUBTRACTION_OUTPUTS),
      })}</Text>
      <Text size="sm" c="dimmed">{t($ => $.discovery[tool].boundary)}</Text>
      <Anchor href={localizedPath(guide ? pagePaths[tool] : pagePaths.mcp, locale)} onClick={onNavigate}>
        {guide ? t($ => $.discovery[tool].openTool) : t($ => $.home.mcpGuide)}
      </Anchor>
    </Stack>
  </Paper>;
}
