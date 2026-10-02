import { useTranslation } from 'react-i18next';
import { Code, Text } from '@mantine/core';
import { toolCatalog, MAX_INPUTS } from '@packetrove/contracts';
import { resolveLocale } from './i18n/locales';
import { ToolExampleCard, ToolExamples } from './ToolExamples';

export function CidrExamples() {
  const { t, i18n } = useTranslation();
  const formatter = new Intl.NumberFormat(resolveLocale(i18n.resolvedLanguage));
  const titles = [t($ => $.cidr.exactExample), t($ => $.cidr.expandedExample), t($ => $.cidr.ipv6Example)];
  return <ToolExamples title={t($ => $.cidr.examplesTitle)} columns={3}
    description={t($ => $.cidr.limits, { maximum: formatter.format(MAX_INPUTS) })}>
    {toolCatalog.cidr.examples.map((example, index) => <ToolExampleCard key={example.name} title={titles[index]}>
      <Code block>{example.request.inputs.join('\n')}</Code>
      <Text size="sm">{t($ => $.cidr.exampleResult, {
        cidr: example.result.cidr,
        covered: formatter.format(BigInt(example.result.coveredAddressCount)),
        additional: formatter.format(BigInt(example.result.additionalAddressCount)),
      })}</Text>
    </ToolExampleCard>)}
  </ToolExamples>;
}
