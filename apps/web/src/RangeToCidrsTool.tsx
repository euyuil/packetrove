import type { FormEvent, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Code, DataList, Group, SimpleGrid, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { inputIssuePath, toolCatalog, type InputIssue, type RangeToCidrsResult } from '@packetrove/contracts';
import { rangeToCidrs, ToolError } from '@packetrove/core';
import { ClipboardCopyButton } from './ClipboardCopyButton';
import { useClipboardFeedback } from './useClipboardFeedback';
import { useCalculationFeedback } from './useCalculationFeedback';
import { errorMessage } from './i18n/errors';
import { rangeIssueMessage } from './range-errors';
import { resolveLocale } from './i18n/locales';
import { ToolPageHeader } from './ToolPageHeader';
import { ToolPanel } from './ToolPanel';
import { ToolErrorSummary } from './ToolErrorSummary';
import { ToolResultCounts } from './ToolResultCounts';
import { ToolExamples, ToolExampleCard } from './ToolExamples';
import { ToolQuestions } from './ToolQuestions';
import { ToolMcpSection } from './ToolMcpSection';
import { useToolDraft } from './ToolDraftProvider';

export type RangeToCidrsDraft = { start: string; end: string; result: RangeToCidrsResult | null; error: ToolError | null };

const draftDefinition = { createInitialDraft: (): RangeToCidrsDraft => ({ start: '', end: '', result: null, error: null }) };

function endpointField(issue: InputIssue) {
  const path = inputIssuePath(issue);
  return path?.length === 1 && (path[0] === 'start' || path[0] === 'end') ? path[0] : undefined;
}

export function RangeToCidrsPage({ onNavigate }: { onNavigate?: MouseEventHandler<HTMLAnchorElement> }) {
  const [draft, onDraftChange] = useToolDraft(draftDefinition);
  return <RangeToCidrsTool draft={draft} onDraftChange={onDraftChange} {...(onNavigate ? { onNavigate } : {})} />;
}

export function RangeToCidrsTool({ draft, onDraftChange, onNavigate }: {
  draft: RangeToCidrsDraft; onDraftChange: (draft: RangeToCidrsDraft) => void;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const formatter = new Intl.NumberFormat(locale);
  const formatCount = (value: string | number) => formatter.format(typeof value === 'string' ? BigInt(value) : value);
  const { result, error } = draft;
  const feedback = useCalculationFeedback();
  const listCopy = useClipboardFeedback();
  const commaCopy = useClipboardFeedback();
  const clearCopy = () => { listCopy.clearCopyFeedback(); commaCopy.clearCopyFeedback(); };

  function replaceEndpoints(start: string, end: string) {
    clearCopy();
    onDraftChange({ start, end, result: null, error: null });
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearCopy();
    try {
      onDraftChange({ ...draft, error: null, result: rangeToCidrs({ start: draft.start, end: draft.end }) });
      feedback.complete(false);
    } catch (failure) {
      onDraftChange({ ...draft, result: null, error: failure instanceof ToolError ? failure
        : new ToolError('INTERNAL_ERROR', 'Unable to calculate this input. Please try again.') });
      feedback.complete(true);
    }
  }

  function copy(format: 'newlines' | 'commas') {
    if (!result) return;
    if (format === 'newlines') {
      commaCopy.clearCopyFeedback();
      void listCopy.copyText(result.cidrs.join('\n'));
    } else {
      listCopy.clearCopyFeedback();
      void commaCopy.copyText(result.cidrs.join(', '));
    }
  }

  const issues = error?.issues?.map((issue, index) => {
    const message = rangeIssueMessage(issue, error.details?.[index], t, locale);
    const field = endpointField(issue);
    return field ? {
      inputId: 'range-' + field,
      message: t($ => $.range.issue, { field: t($ => field === 'start' ? $.range.start : $.range.end), message }),
    } : { message };
  });

  return <Stack gap="xl">
    <ToolPageHeader tool="range" notice={t($ => $.cidr.local)} />
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
      <ToolPanel headingId="input-heading" title={t($ => $.range.inputs)}>
        <form onSubmit={calculate}>
          <Stack gap="md">
            {error && <ToolErrorSummary ref={feedback.errorSummary} id="range-errors"
              title={errorMessage(error, t, locale)} issues={issues} />}
            {(['start', 'end'] as const).map(field => {
              const affected = Boolean(error && (!error.issues?.length || error.issues.some(issue => {
                const path = inputIssuePath(issue);
                return path === undefined || path.length === 0 || endpointField(issue) === field;
              })));
              return <TextInput key={field} id={'range-' + field}
                label={t($ => field === 'start' ? $.range.start : $.range.end)}
                description={t($ => field === 'start' ? $.range.startHelp : $.range.endHelp)}
                descriptionProps={{ id: 'range-' + field + '-help' }}
                attributes={{ input: { 'aria-describedby': 'range-' + field + '-help' + (affected ? ' range-errors' : '') } }}
                error={affected} value={draft[field]} spellCheck={false} autoCapitalize="off" autoCorrect="off" autoComplete="off"
                classNames={{ input: 'network-value' }} placeholder={toolCatalog.range.example.request[field]}
                onChange={event => replaceEndpoints(field === 'start' ? event.currentTarget.value : draft.start,
                  field === 'end' ? event.currentTarget.value : draft.end)} />;
            })}
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{t($ => $.cidr.example)}</Text>
              <Button type="button" variant="default" size="xs" onClick={() => replaceEndpoints('', '')}
                disabled={!draft.start && !draft.end && !result && !error}>{t($ => $.cidr.clear)}</Button>
            </Group>
            <Group gap="sm">
              {toolCatalog.range.examples.map(example => <Button key={example.name} type="button" variant="default" size="xs"
                onClick={() => replaceEndpoints(example.request.start, example.request.end)}>{example.name}</Button>)}
            </Group>
            <Button type="submit" fullWidth>{t($ => $.range.calculate)}</Button>
          </Stack>
        </form>
      </ToolPanel>
      <ToolPanel ref={feedback.resultPanel} headingId="result-heading" title={t($ => $.range.result)}
        headerAside={result && <Badge variant="light">{result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</Badge>}>
        <Text size="sm" role="status" aria-label={t($ => $.range.result)} aria-live="polite" aria-atomic="true">
          {result && <span key={feedback.completionVersion}>{t($ => $.range.completed, {
            addresses: formatCount(result.addressCount), cidrs: formatCount(result.cidrCount),
          })}</span>}
        </Text>
        {result ? <>
          <ToolResultCounts items={[
            { label: t($ => $.range.addresses), value: formatCount(result.addressCount), emphasis: true },
            { label: t($ => $.subtract.blocks), value: formatCount(result.cidrCount) },
          ]} />
          <Textarea label={t($ => $.range.output)} value={result.cidrs.join('\n')} readOnly autosize
            minRows={2} maxRows={10} spellCheck={false} classNames={{ input: 'network-value' }} />
          <Group gap="sm">
            <ClipboardCopyButton label={t($ => $.subtract.copyList)} feedback={listCopy.copyFeedback}
              successMessage={t($ => $.subtract.copySuccess)} failureMessage={t($ => $.subtract.copyFailure)}
              onCopy={() => copy('newlines')} onDismiss={listCopy.clearCopyFeedback} />
            <ClipboardCopyButton label={t($ => $.subtract.copyAllowed)} feedback={commaCopy.copyFeedback}
              successMessage={t($ => $.subtract.allowedSuccess)} failureMessage={t($ => $.subtract.copyFailure)}
              onCopy={() => copy('commas')} onDismiss={commaCopy.clearCopyFeedback} />
          </Group>
          <Text size="xs" c="dimmed">{t($ => $.subtract.formats)}</Text>
          <DataList withDivider>
            {[
              [t($ => $.range.start), result.range.first], [t($ => $.range.end), result.range.last],
            ].map(([label, value]) => <DataList.Item key={label}>
              <DataList.ItemLabel>{label}</DataList.ItemLabel>
              <DataList.ItemValue className="network-value">{value}</DataList.ItemValue>
            </DataList.Item>)}
          </DataList>
        </> : <Stack align="center" py="xl" gap="sm">
          <Title order={3} size="h4">{t($ => $.cidr.emptyTitle)}</Title>
          <Text size="sm" c="dimmed" ta="center">{t($ => $.range.pendingDescription)}</Text>
        </Stack>}
      </ToolPanel>
    </SimpleGrid>
    <Stack component="section" aria-labelledby="explanation-heading" gap="sm">
      <Title order={2} size="h4" id="explanation-heading">{t($ => $.subtract.explanationTitle)}</Title>
      <Text size="sm" c="dimmed">{t($ => $.range.explanation)}</Text>
    </Stack>
    <ToolExamples title={t($ => $.range.examplesTitle)}>
      {toolCatalog.range.examples.map(example => <ToolExampleCard key={example.name} title={example.name}>
        <Text size="sm">{t($ => $.range.example, { start: example.request.start, end: example.request.end })}</Text>
        <Code block>{example.result.cidrs.join('\n')}</Code>
      </ToolExampleCard>)}
    </ToolExamples>
    <ToolQuestions tool="range" />
    <ToolMcpSection tool="range" onNavigate={onNavigate} />
  </Stack>;
}
