import { Code, Text } from '@mantine/core';
import { toolCatalog } from '@packetrove/contracts';
import { useTranslation } from 'react-i18next';
import { ToolExampleCard, ToolExamples } from './ToolExamples';

export function CidrSubtractExamples() {
  const { t } = useTranslation();

  return <ToolExamples title={t($ => $.subtract.examplesTitle)}>
    {toolCatalog.subtract.examples.map(example => <ToolExampleCard key={example.name} title={example.name}>
      <Text size="sm">{t($ => $.subtract.example, {
        include: example.request.include.join(', '), exclude: example.request.exclude.join(', '),
      })}</Text>
      <Code block>{example.result.cidrs.join('\n')}</Code>
    </ToolExampleCard>)}
  </ToolExamples>;
}
