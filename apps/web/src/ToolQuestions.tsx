import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, Stack, Text, Title } from '@mantine/core';
import type { McpExampleTool } from './mcp-examples';
import { resolveLocale } from './i18n/locales';
import { localizedPath, pagePaths } from './i18n/routes';

export function ToolQuestions({ tool, onNavigate }: {
  tool: McpExampleTool | 'subtract';
  onNavigate?: MouseEventHandler<HTMLAnchorElement> | undefined;
}) {
  const { t, i18n } = useTranslation();
  const questions = tool === 'cidr'
    ? (['firewall', 'covering', 'overlap', 'counts', 'privacy'] as const).map(key => ({
      question: t($ => $.discovery.cidr.questions[key].question),
      answer: t($ => $.discovery.cidr.questions[key].answer),
    }))
    : tool === 'ip' ? (['address', 'vpn', 'family', 'client', 'privacy'] as const).map(key => ({
      question: t($ => $.discovery.ip.questions[key].question),
      answer: t($ => $.discovery.ip.questions[key].answer),
    }))
    : (['wireguard', 'remaining', 'outside', 'covering', 'access'] as const).map(key => ({
      question: t($ => $.discovery.subtract.questions[key].question),
      answer: t($ => $.discovery.subtract.questions[key].answer),
    }));
  const headingId = tool + '-questions-heading';
  return <Stack component="section" aria-labelledby={headingId} gap="lg">
    <Title order={2} size="h3" id={headingId}>{t($ => $.discovery[tool].title)}</Title>
    {questions.map(({ question, answer }) => <Stack gap="xs" key={question}>
      <Title order={3} size="h4">{question}</Title>
      <Text size="sm" c="dimmed">{answer}</Text>
    </Stack>)}
    {tool === 'subtract' && <Anchor href={localizedPath(pagePaths.mcp, resolveLocale(i18n.resolvedLanguage))} onClick={onNavigate}>
      {t($ => $.home.mcpGuide)}
    </Anchor>}
  </Stack>;
}
