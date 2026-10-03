import type { FormEvent, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Badge, Button, DataList, Group, SimpleGrid, Stack, Text, Textarea, Title,
} from '@mantine/core';
import {
  CIDR_SUBTRACT_EXAMPLES, MAX_INPUT_LENGTH, MAX_SUBTRACTION_INPUTS, MAX_SUBTRACTION_OUTPUTS, type CidrSubtractResult,
} from '@packetrove/contracts';
import { subtractCidrs, ToolError } from '@packetrove/core';
import { ClipboardCopyButton } from './ClipboardCopyButton';
import { useClipboardFeedback } from './useClipboardFeedback';
import { errorMessage, issueMessage } from './i18n/errors';
import { resolveLocale } from './i18n/locales';
import { ToolQuestions } from './ToolQuestions';
import { ToolPageHeader } from './ToolPageHeader';
import { ToolPanel } from './ToolPanel';
import { CidrSubtractExamples } from './CidrSubtractExamples';
import { ToolMcpSection } from './ToolMcpSection';
import { parseAddressEntries } from './parseAddressEntries';
import { ToolErrorSummary } from './ToolErrorSummary';
import { ToolResultCounts } from './ToolResultCounts';
import { NormalizedInputs } from './NormalizedInputs';
import { useCalculationFeedback } from './useCalculationFeedback';
import { useToolDraft } from './ToolDraftProvider';

export type CidrSubtractDraft = { include: string; exclude: string; result: CidrSubtractResult | null; error: ToolError | null };

const draftDefinition = { createInitialDraft: (): CidrSubtractDraft => ({ include: '', exclude: '', result: null, error: null }) };

export function CidrSubtractPage({ onNavigate }: { onNavigate?: MouseEventHandler<HTMLAnchorElement> }) {
  const [draft, onDraftChange] = useToolDraft(draftDefinition);
  return <CidrSubtractTool draft={draft} onDraftChange={onDraftChange} {...(onNavigate ? { onNavigate } : {})} />;
}

export function CidrSubtractTool({ draft, onDraftChange, onNavigate }: {
  draft: CidrSubtractDraft; onDraftChange: (draft: CidrSubtractDraft) => void;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const formatter = new Intl.NumberFormat(locale);
  const formatCount = (count: string | number) => formatter.format(typeof count === 'string' ? BigInt(count) : count);
  const { result, error } = draft;
  const feedback = useCalculationFeedback();
  const entries = { include: parseAddressEntries(draft.include), exclude: parseAddressEntries(draft.exclude) };
  const listCopy = useClipboardFeedback();
  const allowedCopy = useClipboardFeedback();
  const clearCopyFeedback = () => { listCopy.clearCopyFeedback(); allowedCopy.clearCopyFeedback(); };

  function replaceLists(include: string, exclude: string) {
    onDraftChange({ include, exclude, result: null, error: null });
    clearCopyFeedback();
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearCopyFeedback();
    try {
      onDraftChange({ ...draft, error: null, result: subtractCidrs({
        include: entries.include.map(entry => entry.value), exclude: entries.exclude.map(entry => entry.value),
      }) });
      feedback.complete(false);
    } catch (failure) {
      onDraftChange({ ...draft, result: null, error: failure instanceof ToolError ? failure
        : new ToolError('INTERNAL_ERROR', 'Unable to calculate this input. Please try again.') });
      feedback.complete(true);
    }
  }

  function copy(format: 'list' | 'allowed') {
    if (!result?.cidrs.length) return;
    if (format === 'list') {
      allowedCopy.clearCopyFeedback();
      void listCopy.copyText(result.cidrs.join('\n'));
    } else {
      listCopy.clearCopyFeedback();
      void allowedCopy.copyText(result.cidrs.join(', '));
    }
  }

  const issueItems = error?.issues?.map((issue, index) => {
    const detail = error.details?.[index];
    const message = issueMessage(issue, detail, t, locale);
    if (!detail?.list) return { message };
    const inputList = detail.list;
    const list = t($ => inputList === 'include' ? $.subtract.include : $.subtract.exclude);
    const entry = issue.index === undefined ? undefined : entries[inputList][issue.index];
    return { inputId: 'subtract-' + inputList, selection: entry && { start: entry.start, end: entry.end },
      message: !entry ? t($ => $.subtract.listIssue, { list, message })
      : t($ => entry.entriesOnLine > 1 ? $.subtract.lineEntry : $.subtract.line, {
        list, line: formatCount(entry.line), entry: formatCount(entry.positionInLine), message,
      }) };
  });

  return <Stack gap="xl">
    <ToolPageHeader tool="subtract" notice={t($ => $.cidr.local)} />
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
      <ToolPanel headingId="input-heading" title={t($ => $.subtract.inputs)}>
        <form onSubmit={calculate}>
          <Stack gap="md">
            {error && <ToolErrorSummary ref={feedback.errorSummary} id="subtraction-errors" title={
              error.details?.some(detail => detail.reason === 'TOO_MANY_OUTPUTS')
                ? t($ => $.subtract.outputLimitTitle) : errorMessage(error, t, locale)
            } issues={issueItems} />}
            {(['include', 'exclude'] as const).map(list => {
              // Associate each input with the shared error summary instead of Mantine's own error element.
              const affected = Boolean(error && (!error.details?.length || error.details.some(detail => !detail.list || detail.list === list)));
              return <Textarea key={list} id={'subtract-' + list}
                label={t($ => list === 'include' ? $.subtract.includeLabel : $.subtract.excludeLabel)}
                description={t($ => list === 'include' ? $.subtract.includeHelp : $.subtract.excludeHelp)}
                descriptionProps={{ id: 'subtract-' + list + '-help' }}
                attributes={{ input: { 'aria-describedby': 'subtract-' + list + '-help' + (affected ? ' subtraction-errors' : '') } }}
                error={affected} value={draft[list]} autosize minRows={3} maxRows={8}
                spellCheck={false} autoCapitalize="off" autoCorrect="off" classNames={{ input: 'network-value' }}
                placeholder={CIDR_SUBTRACT_EXAMPLES[0]!.request[list].join('\n')}
                onChange={event => replaceLists(list === 'include' ? event.currentTarget.value : draft.include,
                  list === 'exclude' ? event.currentTarget.value : draft.exclude)} />;
            })}
            <Text size="xs" c="dimmed">{t($ => $.subtract.limits, {
              inputs: formatCount(MAX_SUBTRACTION_INPUTS), length: formatCount(MAX_INPUT_LENGTH), outputs: formatCount(MAX_SUBTRACTION_OUTPUTS),
            })}</Text>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{t($ => $.cidr.entryCount, {
                count: entries.include.length + entries.exclude.length, total: formatCount(entries.include.length + entries.exclude.length),
              })}</Text>
              <Button type="button" variant="default" size="xs" onClick={() => replaceLists('', '')}
                disabled={!draft.include && !draft.exclude && !result && !error}>{t($ => $.cidr.clear)}</Button>
            </Group>
            <Group gap="sm">
              <Text size="sm" c="dimmed">{t($ => $.cidr.example)}</Text>
              {CIDR_SUBTRACT_EXAMPLES.map(example => <Button key={example.name} type="button" variant="default" size="xs"
                onClick={() => replaceLists(example.request.include.join('\n'), example.request.exclude.join('\n'))}>{example.name}</Button>)}
            </Group>
            <Button type="submit" fullWidth>{t($ => $.subtract.calculate)}</Button>
          </Stack>
        </form>
      </ToolPanel>
      <ToolPanel ref={feedback.resultPanel} headingId="result-heading" title={t($ => $.subtract.result)}
        headerAside={result && <Badge variant="light">{result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</Badge>}>
        <Text size="sm" role="status" aria-label={t($ => $.subtract.result)} aria-live="polite" aria-atomic="true"
          style={{ overflowWrap: 'anywhere' }}>
          {result && result.cidrs.length > 0 && <span key={feedback.completionVersion}>{t($ => $.subtract.completed, {
            addresses: formatCount(result.remainingAddressCount), cidrs: formatCount(result.cidrs.length),
          })}</span>}
        </Text>
        {result ? <>
          <ToolResultCounts items={[
            { label: t($ => $.subtract.remaining), value: formatCount(result.remainingAddressCount), emphasis: true },
            { label: t($ => $.subtract.blocks), value: formatCount(result.cidrs.length) },
          ]} />
          {result.cidrs.length ? <Textarea label={t($ => $.subtract.output)} value={result.cidrs.join('\n')}
            readOnly autosize minRows={2} maxRows={10} spellCheck={false} classNames={{ input: 'network-value' }} />
            : <Alert color="teal" role="status" title={t($ => $.subtract.emptyTitle)}>{t($ => $.subtract.emptyDescription)}</Alert>}
          <Group gap="sm">
            <ClipboardCopyButton label={t($ => $.subtract.copyList)} feedback={listCopy.copyFeedback}
              successMessage={t($ => $.subtract.copySuccess)} failureMessage={t($ => $.subtract.copyFailure)}
              onCopy={() => copy('list')} onDismiss={listCopy.clearCopyFeedback} disabled={!result.cidrs.length} />
            <ClipboardCopyButton label={t($ => $.subtract.copyAllowed)} feedback={allowedCopy.copyFeedback}
              successMessage={t($ => $.subtract.allowedSuccess)} failureMessage={t($ => $.subtract.copyFailure)}
              onCopy={() => copy('allowed')} onDismiss={allowedCopy.clearCopyFeedback} disabled={!result.cidrs.length} />
          </Group>
          <Text size="xs" c="dimmed">{t($ => $.subtract.formats)}</Text>
          <DataList withDivider>
            {[
              [t($ => $.subtract.included), result.includedAddressCount],
              [t($ => $.subtract.removed), result.removedAddressCount],
            ].map(([label, count]) => <DataList.Item key={label}>
              <DataList.ItemLabel>{label}</DataList.ItemLabel>
              <DataList.ItemValue className="network-value">{formatCount(count!)}</DataList.ItemValue>
            </DataList.Item>)}
          </DataList>
          <Stack gap="sm">
            <Text size="xs" c="dimmed">{t($ => $.subtract.normalizedHelp)}</Text>
            <NormalizedInputs label={t($ => $.subtract.normalizedInclude, { total: formatCount(result.normalizedInclude.length) })}
              entries={result.normalizedInclude} />
            <NormalizedInputs label={t($ => $.subtract.normalizedExclude, { total: formatCount(result.normalizedExclude.length) })}
              entries={result.normalizedExclude} emptyMessage={t($ => $.subtract.noExcludedInputs)} />
          </Stack>
        </> : <Stack align="center" py="xl" gap="sm">
          <Title order={3} size="h4">{t($ => $.subtract.pendingTitle)}</Title>
          <Text size="sm" c="dimmed" ta="center">{t($ => $.subtract.pendingDescription)}</Text>
        </Stack>}
      </ToolPanel>
    </SimpleGrid>
    <Stack component="section" aria-labelledby="explanation-heading" gap="sm">
      <Title order={2} size="h4" id="explanation-heading">{t($ => $.subtract.explanationTitle)}</Title>
      <Text size="sm" c="dimmed">{t($ => $.subtract.explanation)}</Text>
      <Text size="sm" c="dimmed">{t($ => $.subtract.review)}</Text>
    </Stack>
    <CidrSubtractExamples />
    <ToolQuestions tool="subtract" />
    <ToolMcpSection tool="subtract" onNavigate={onNavigate} />
  </Stack>;
}
