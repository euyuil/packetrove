import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion, Alert, Badge, Button, DataList, Group, List, Paper, ScrollArea, SimpleGrid, Stack, Text, Textarea, Title,
} from '@mantine/core';
import { CIDR_COVER_EXAMPLES, MAX_INPUTS, type CidrCoverResult } from '@packetrove/contracts';
import { smallestCoveringCidr, ToolError } from '@packetrove/core';
import { ClipboardCopyButton } from './ClipboardCopyButton';
import { useClipboardFeedback } from './useClipboardFeedback';
import { errorMessage, issueMessage } from './i18n/errors';
import { resolveLocale } from './i18n/locales';

function inputRows(text: string) {
  return text.split(/\r?\n/).map((value, index) => ({ value: value.trim(), line: index + 1 }))
    .filter(row => row.value.length > 0);
}

export type CidrCoverDraft = { input: string; result: CidrCoverResult | null; error: ToolError | null };

export function CidrCoverTool({ draft, onDraftChange }: {
  draft: CidrCoverDraft; onDraftChange: (draft: CidrCoverDraft) => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const formatter = new Intl.NumberFormat(locale);
  const formatCount = (count: string | number) => formatter.format(typeof count === 'string' ? BigInt(count) : count);
  const { input, result, error } = draft;
  const { copyFeedback, clearCopyFeedback, copyText } = useClipboardFeedback();
  const rows = inputRows(input);

  function replaceInput(value: string) {
    onDraftChange({ input: value, result: null, error: null });
    clearCopyFeedback();
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearCopyFeedback();
    try {
      onDraftChange({ input, result: smallestCoveringCidr({ inputs: rows.map(row => row.value) }), error: null });
    } catch (failure) {
      onDraftChange({ input, result: null, error: failure instanceof ToolError ? failure
        : new ToolError('INTERNAL_ERROR', 'Unable to calculate this input. Please try again.') });
    }
  }

  function copyCidr() {
    if (!result) return;
    void copyText(result.cidr);
  }

  return (
    <Stack gap="xl">
      <Stack component="section" aria-labelledby="tool-title" gap="sm">
        <Text size="xs" c="var(--mantine-primary-color-filled)" fw={700}>{t($ => $.common.tools)}</Text>
        <Title order={1} id="tool-title">{t($ => $.cidr.title)}</Title>
        <Text c="dimmed">{t($ => $.cidr.description)}</Text>
        <Text size="sm" c="var(--mantine-primary-color-filled)">{t($ => $.cidr.local)}</Text>
      </Stack>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="input-heading">
          <Stack gap="lg">
            <Group justify="space-between">
              <Title order={2} size="h3" id="input-heading">{t($ => $.cidr.addresses)}</Title>
              <Text size="sm" c="dimmed">IPv4 / IPv6</Text>
            </Group>
            <form onSubmit={calculate}>
              <Stack gap="md">
                <Textarea id="addresses" label={t($ => $.cidr.inputLabel)} value={input}
                  description={t($ => $.cidr.inputHelp, { maximum: formatCount(MAX_INPUTS) })}
                  descriptionProps={{ id: 'input-help' }}
                  rows={8} resize="vertical" spellCheck={false} autoCapitalize="off" autoCorrect="off"
                  classNames={{ input: 'network-value' }}
                  errorProps={{ component: 'div', id: 'input-error' }}
                  error={error && <Alert color="red" title={errorMessage(error, t, locale)} role="alert">
                    {error.issues && <List size="sm">{error.issues.map((issue, index) => <List.Item key={index}>
                      {issue.index === undefined ? issueMessage(issue, error.details?.[index], t, locale)
                        : t($ => $.cidr.line, { line: formatCount(rows[issue.index]?.line ?? issue.index + 1),
                          message: issueMessage(issue, error.details?.[index], t, locale) })}
                    </List.Item>)}</List>}
                  </Alert>}
                  placeholder={'203.0.113.1\n203.0.113.2\n203.0.113.6'}
                  onChange={event => replaceInput(event.currentTarget.value)} />
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{t($ => $.cidr.entryCount, { count: rows.length, total: formatCount(rows.length) })}</Text>
                  <Button type="button" variant="subtle" size="xs" onClick={() => replaceInput('')}
                    disabled={!input && !result && !error}>{t($ => $.cidr.clear)}</Button>
                </Group>
                <Group gap="sm">
                  <Text size="sm" c="dimmed">{t($ => $.cidr.example)}</Text>
                  <Button type="button" variant="default" size="xs"
                    onClick={() => replaceInput(CIDR_COVER_EXAMPLES[1]!.request.inputs.join('\n'))}>IPv4</Button>
                  <Button type="button" variant="default" size="xs"
                    onClick={() => replaceInput(CIDR_COVER_EXAMPLES[2]!.request.inputs.join('\n'))}>IPv6</Button>
                </Group>
                <Button type="submit" fullWidth>{t($ => $.cidr.calculate)}</Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
        <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="result-heading">
          <Stack gap="lg">
            <Group justify="space-between">
              <Title order={2} size="h3" id="result-heading">{t($ => $.cidr.result)}</Title>
              {result && <Badge variant="light">{result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</Badge>}
            </Group>
            <Stack gap="md" aria-live="polite">
              {result ? <>
                <Text size="xs" c="dimmed">{t($ => $.cidr.resultLabel)}</Text>
                <Group justify="space-between">
                  <Text component="code" className="network-value" size="xl" fw={600} c="var(--mantine-primary-color-filled)">{result.cidr}</Text>
                  <ClipboardCopyButton label={t($ => $.cidr.copy)} feedback={copyFeedback}
                    successMessage={t($ => $.cidr.copySuccess)} failureMessage={t($ => $.cidr.copyFailure)}
                    onCopy={copyCidr} onDismiss={clearCopyFeedback} />
                </Group>
                <DataList orientation="vertical" withDivider>
                  <DataList.Item>
                    <DataList.ItemLabel>{t($ => $.cidr.first)}</DataList.ItemLabel>
                    <DataList.ItemValue className="network-value">{result.range.first}</DataList.ItemValue>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.ItemLabel>{t($ => $.cidr.last)}</DataList.ItemLabel>
                    <DataList.ItemValue className="network-value">{result.range.last}</DataList.ItemValue>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.ItemLabel>{t($ => $.cidr.unique)}</DataList.ItemLabel>
                    <DataList.ItemValue className="network-value" fw={600}>{formatCount(result.inputAddressCount)}</DataList.ItemValue>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.ItemLabel>{t($ => $.cidr.covered)}</DataList.ItemLabel>
                    <DataList.ItemValue className="network-value" fw={600}>{formatCount(result.coveredAddressCount)}</DataList.ItemValue>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.ItemLabel>{t($ => $.cidr.additional)}</DataList.ItemLabel>
                    <DataList.ItemValue className="network-value" fw={600} c={result.additionalAddressCount === '0' ? 'teal' : 'yellow.9'}>
                      {formatCount(result.additionalAddressCount)}
                    </DataList.ItemValue>
                  </DataList.Item>
                </DataList>
                <Alert color={result.additionalAddressCount === '0' ? 'teal' : 'yellow'} role="note">
                  {result.additionalAddressCount === '0'
                    ? t($ => $.cidr.exact)
                    : t($ => result.additionalAddressCount === '1' ? $.cidr.expansionOne : $.cidr.expansionOther,
                      { total: formatCount(result.additionalAddressCount) })}
                </Alert>
                <Accordion variant="contained">
                  <Accordion.Item value="normalized-inputs">
                    <Accordion.Control>{t($ => $.cidr.normalized, { total: formatCount(result.normalizedInputs.length) })}</Accordion.Control>
                    <Accordion.Panel>
                      <ScrollArea.Autosize mah={200} type="auto">
                        <List type="ordered" size="sm">{result.normalizedInputs.map((entry, index) => <List.Item key={index}>
                          <Text component="code" className="network-value" size="sm">{entry}</Text>
                        </List.Item>)}</List>
                      </ScrollArea.Autosize>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              </> : <Stack align="center" py="xl" gap="sm">
                <Title order={3} size="h4">{t($ => $.cidr.emptyTitle)}</Title>
                <Text size="sm" c="dimmed" ta="center">{t($ => $.cidr.emptyDescription)}</Text>
              </Stack>}
            </Stack>
          </Stack>
        </Paper>
      </SimpleGrid>
      <Stack component="section" aria-labelledby="explanation-heading" gap="sm">
        <Title order={2} size="h4" id="explanation-heading">{t($ => $.cidr.explanationTitle)}</Title>
        <Text size="sm" c="dimmed">{t($ => $.cidr.explanation)}</Text>
        <Text size="sm" c="dimmed">{t($ => $.cidr.countExplanation)}</Text>
      </Stack>
    </Stack>
  );
}
