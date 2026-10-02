import { useTranslation } from 'react-i18next';
import { Code, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { CIDR_COVER_EXAMPLES, MAX_INPUTS } from '@packetrove/contracts';
import { resolveLocale } from './i18n/locales';

export function CidrExamples() {
  const { t, i18n } = useTranslation();
  const formatter = new Intl.NumberFormat(resolveLocale(i18n.resolvedLanguage));
  const titles = [t($ => $.cidr.exactExample), t($ => $.cidr.expandedExample), t($ => $.cidr.ipv6Example)];
  return <Stack component="section" aria-labelledby="examples-heading" gap="md">
    <Title order={2} size="h3" id="examples-heading">{t($ => $.cidr.examplesTitle)}</Title>
    <Text size="sm" c="dimmed">{t($ => $.cidr.limits, { maximum: formatter.format(MAX_INPUTS) })}</Text>
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
      {CIDR_COVER_EXAMPLES.map((example, index) => <Paper key={example.name} withBorder p="md">
        <Stack gap="sm">
          <Title order={3} size="h4">{titles[index]}</Title>
          <Code block>{example.request.inputs.join('\n')}</Code>
          <Text size="sm">{t($ => $.cidr.exampleResult, {
            cidr: example.result.cidr,
            covered: formatter.format(BigInt(example.result.coveredAddressCount)),
            additional: formatter.format(BigInt(example.result.additionalAddressCount)),
          })}</Text>
        </Stack>
      </Paper>)}
    </SimpleGrid>
  </Stack>;
}
