import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Text, Title } from '@mantine/core';
import type { ToolPage } from '@packetrove/contracts';
import { ToolDisclosure } from './ToolDisclosure';

export function ToolQuestions({ tool }: {
  tool: ToolPage;
  onNavigate?: MouseEventHandler<HTMLAnchorElement> | undefined;
}) {
  const { t } = useTranslation();
  const questions = Object.values(t($ => $.discovery[tool].questions, { returnObjects: true }));
  const headingId = tool + '-questions-heading';
  return <ToolDisclosure headingId={headingId} title={t($ => $.discovery[tool].title)}>
    <Stack gap="lg">
      {questions.map(({ question, answer }) => <Stack gap="xs" key={question}>
        <Title order={3} size="h4">{question}</Title>
        <Text size="sm" c="dimmed">{answer}</Text>
      </Stack>)}
    </Stack>
  </ToolDisclosure>;
}
