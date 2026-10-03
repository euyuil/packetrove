import type { FormEvent, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion, Alert, Badge, Button, DataList, Group, List, ScrollArea, SimpleGrid, Stack, Text, Textarea, Title, VisuallyHidden,
} from '@mantine/core';
import { CIDR_COVER_EXAMPLES, MAX_INPUTS, type CidrCoverResult } from '@packetrove/contracts';
import { smallestCoveringCidr, ToolError } from '@packetrove/core';
import { ClipboardCopyButton } from './ClipboardCopyButton';
import { useClipboardFeedback } from './useClipboardFeedback';
import { errorMessage, issueMessage } from './i18n/errors';
import { resolveLocale } from './i18n/locales';
import { CidrExamples } from './CidrExamples';
import { ToolQuestions } from './ToolQuestions';
import { ToolMcpSection } from './ToolMcpSection';
import { ToolPageHeader } from './ToolPageHeader';
import { ToolPanel } from './ToolPanel';
import { parseAddressEntries } from './parseAddressEntries';
import { NetworkValue } from './NetworkValue';
import { ToolErrorSummary } from './ToolErrorSummary';
import { ToolResultCounts } from './ToolResultCounts';
import { useCalculationFeedback } from './useCalculationFeedback';

export type CidrCoverDraft = { input: string; result: CidrCoverResult | null; error: ToolError | null };

export function CidrCoverTool({ draft, onDraftChange, onNavigate }: {
  draft: CidrCoverDraft; onDraftChange: (draft: CidrCoverDraft) => void;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const formatter = new Intl.NumberFormat(locale);
  const formatCount = (count: string | number) => formatter.format(typeof count === 'string' ? BigInt(count) : count);
  const { input, result, error } = draft;
  const { copyFeedback, clearCopyFeedback, copyText } = useClipboardFeedback();
  const entries = parseAddressEntries(input);
  const feedback = useCalculationFeedback();

  function replaceInput(value: string) {
    onDraftChange({ input: value, result: null, error: null });
    clearCopyFeedback();
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearCopyFeedback();
    try {
      onDraftChange({ input, result: smallestCoveringCidr({ inputs: entries.map(entry => entry.value) }), error: null });
      feedback.complete(false);
    } catch (failure) {
      onDraftChange({ input, result: null, error: failure instanceof ToolError ? failure
        : new ToolError('INTERNAL_ERROR', 'Unable to calculate this input. Please try again.') });
      feedback.complete(true);
    }
  }

  function copyCidr() {
    if (!result) return;
    void copyText(result.cidr);
  }

  const issueItems = error?.issues?.map((issue, index) => {
    const message = issueMessage(issue, error.details?.[index], t, locale);
    const entry = issue.index === undefined ? undefined : entries[issue.index];
    return { inputId: 'addresses', message: !entry ? message
      : t($ => entry.entriesOnLine > 1 ? $.cidr.lineEntry : $.cidr.line, {
        line: formatCount(entry.line), entry: formatCount(entry.positionInLine), message,
      }) };
  });

  return (
    <Stack gap="xl">
      <ToolPageHeader tool="cidr" notice={t($ => $.cidr.local)} />
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        <ToolPanel headingId="input-heading" title={t($ => $.cidr.addresses)}
          headerAside={<Text size="sm" c="dimmed">IPv4 / IPv6</Text>}>
          <form onSubmit={calculate}>
            <Stack gap="md">
              {error && <ToolErrorSummary ref={feedback.errorSummary} id="input-error" title={errorMessage(error, t, locale)}
                issues={issueItems} />}
              <Textarea id="addresses" label={t($ => $.cidr.inputLabel)} value={input}
                description={t($ => $.cidr.inputHelp, { maximum: formatCount(MAX_INPUTS) })}
                descriptionProps={{ id: 'input-help' }}
                autosize minRows={4} maxRows={10} spellCheck={false} autoCapitalize="off" autoCorrect="off"
                classNames={{ input: 'network-value' }}
                attributes={{ input: { 'aria-describedby': 'input-help' + (error ? ' input-error' : '') } }}
                error={Boolean(error)}
                placeholder={'203.0.113.1\n203.0.113.2\n203.0.113.6'}
                onChange={event => replaceInput(event.currentTarget.value)} />
              <Group justify="space-between">
                <Text size="xs" c="dimmed">{t($ => $.cidr.entryCount, { count: entries.length, total: formatCount(entries.length) })}</Text>
                <Button type="button" variant="default" size="xs" onClick={() => replaceInput('')}
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
        </ToolPanel>
        <ToolPanel ref={feedback.resultPanel} headingId="result-heading" title={t($ => $.cidr.result)}
          headerAside={result && <Badge variant="light">{result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</Badge>}>
          <VisuallyHidden role="status" aria-label={t($ => $.cidr.result)} aria-live="polite" aria-atomic="true">
            {result && <span key={feedback.completionVersion}>{t($ => $.cidr.resultLabel)}: {result.cidr}</span>}
          </VisuallyHidden>
          <Stack gap="md">
            {result ? <>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">{t($ => $.cidr.resultLabel)}</Text>
                <Group justify="space-between">
                  <Text component="code" className="network-value" size="xl" fw={600} c="var(--mantine-primary-color-filled)">
                    <NetworkValue value={result.cidr} />
                  </Text>
                  <ClipboardCopyButton label={t($ => $.cidr.copy)} feedback={copyFeedback}
                    successMessage={t($ => $.cidr.copySuccess)} failureMessage={t($ => $.cidr.copyFailure)}
                    onCopy={copyCidr} onDismiss={clearCopyFeedback} />
                </Group>
              </Stack>
              <Alert color={result.additionalAddressCount === '0' ? 'teal' : 'yellow'} role="note">
                <Group component="dl" m={0} gap="xs" mb={4}>
                  <Text component="dt" size="sm" fw={600}>{t($ => $.cidr.additional)}</Text>
                  <Text component="dd" m={0} className="network-value" fw={700}>{formatCount(result.additionalAddressCount)}</Text>
                </Group>
                {result.additionalAddressCount === '0'
                  ? t($ => $.cidr.exact)
                  : t($ => result.additionalAddressCount === '1' ? $.cidr.expansionOne : $.cidr.expansionOther,
                    { total: formatCount(result.additionalAddressCount) })}
              </Alert>
              <ToolResultCounts items={[
                { label: t($ => $.cidr.unique), value: formatCount(result.inputAddressCount) },
                { label: t($ => $.cidr.covered), value: formatCount(result.coveredAddressCount) },
              ]} />
              <DataList orientation="vertical" withDivider>
                <DataList.Item>
                  <DataList.ItemLabel>{t($ => $.cidr.first)}</DataList.ItemLabel>
                  <DataList.ItemValue className="network-value"><NetworkValue value={result.range.first} /></DataList.ItemValue>
                </DataList.Item>
                <DataList.Item>
                  <DataList.ItemLabel>{t($ => $.cidr.last)}</DataList.ItemLabel>
                  <DataList.ItemValue className="network-value"><NetworkValue value={result.range.last} /></DataList.ItemValue>
                </DataList.Item>
              </DataList>
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
        </ToolPanel>
      </SimpleGrid>
      <Stack component="section" aria-labelledby="explanation-heading" gap="sm">
        <Title order={2} size="h4" id="explanation-heading">{t($ => $.cidr.explanationTitle)}</Title>
        <Text size="sm" c="dimmed">{t($ => $.cidr.explanation)}</Text>
        <Text size="sm" c="dimmed">{t($ => $.cidr.countExplanation)}</Text>
      </Stack>
      <CidrExamples />
      <ToolQuestions tool="cidr" />
      <ToolMcpSection tool="cidr" onNavigate={onNavigate} />
    </Stack>
  );
}
