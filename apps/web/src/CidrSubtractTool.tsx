import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Badge, Button, Code, DataList, Group, List, Paper, SimpleGrid, Stack, Text, Textarea, Title,
} from '@mantine/core';
import {
  MAX_INPUT_LENGTH, MAX_SUBTRACTION_INPUTS, MAX_SUBTRACTION_OUTPUTS, type CidrSubtractResult,
} from '@packetrove/contracts';
import { subtractCidrs, ToolError } from '@packetrove/core';
import { ClipboardCopyButton } from './ClipboardCopyButton';
import { useClipboardFeedback } from './useClipboardFeedback';
import { errorMessage, issueMessage } from './i18n/errors';
import { resolveLocale } from './i18n/locales';

const examples = [
  { name: 'IPv4', include: '203.0.113.0/24', exclude: '203.0.113.64/26', cidrs: ['203.0.113.0/26', '203.0.113.128/25'] },
  { name: 'IPv6', include: '2001:db8::/124', exclude: '2001:db8::4/126', cidrs: ['2001:db8::/126', '2001:db8::8/125'] },
] as const;

function inputRows(text: string) {
  return text.split(/\r?\n/).map((value, index) => ({ value: value.trim(), line: index + 1 }))
    .filter(row => row.value.length > 0);
}

export type CidrSubtractDraft = { include: string; exclude: string; result: CidrSubtractResult | null; error: ToolError | null };

export function CidrSubtractTool({ draft, onDraftChange }: {
  draft: CidrSubtractDraft; onDraftChange: (draft: CidrSubtractDraft) => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const formatter = new Intl.NumberFormat(locale);
  const formatCount = (count: string | number) => formatter.format(typeof count === 'string' ? BigInt(count) : count);
  const { result, error } = draft;
  const rows = { include: inputRows(draft.include), exclude: inputRows(draft.exclude) };
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
        include: rows.include.map(row => row.value), exclude: rows.exclude.map(row => row.value),
      }) });
    } catch (failure) {
      onDraftChange({ ...draft, result: null, error: failure instanceof ToolError ? failure
        : new ToolError('INTERNAL_ERROR', 'Unable to calculate this input. Please try again.') });
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
    if (!detail?.list) return message;
    const inputList = detail.list;
    const list = t($ => inputList === 'include' ? $.subtract.include : $.subtract.exclude);
    return issue.index === undefined ? t($ => $.subtract.listIssue, { list, message })
      : t($ => $.subtract.line, { list, line: formatCount(rows[inputList][issue.index]?.line ?? issue.index + 1), message });
  });

  return <Stack gap="xl">
    <Stack component="section" aria-labelledby="tool-title" gap="sm">
      <Text size="xs" c="var(--mantine-primary-color-filled)" fw={700}>{t($ => $.common.tools)}</Text>
      <Title order={1} id="tool-title">{t($ => $.subtract.title)}</Title>
      <Text c="dimmed">{t($ => $.subtract.description)}</Text>
      <Text size="sm" c="var(--mantine-primary-color-filled)">{t($ => $.cidr.local)}</Text>
    </Stack>
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="input-heading">
        <Stack gap="lg">
          <Title order={2} size="h3" id="input-heading">{t($ => $.subtract.inputs)}</Title>
          <form onSubmit={calculate}>
            <Stack gap="md">
              {error && <Alert color="red" id="subtraction-errors" role="alert" title={
                error.details?.some(detail => detail.reason === 'TOO_MANY_OUTPUTS')
                  ? t($ => $.subtract.outputLimitTitle) : errorMessage(error, t, locale)
              }>{issueItems && <List size="sm">{issueItems.map((message, index) => <List.Item key={index}>{message}</List.Item>)}</List>}</Alert>}
              {(['include', 'exclude'] as const).map(list => {
                // Associate each input with the shared error summary instead of Mantine's own error element.
                const affected = Boolean(error && (!error.details?.length || error.details.some(detail => !detail.list || detail.list === list)));
                return <Textarea key={list} id={'subtract-' + list}
                  label={t($ => list === 'include' ? $.subtract.includeLabel : $.subtract.excludeLabel)}
                  description={t($ => list === 'include' ? $.subtract.includeHelp : $.subtract.excludeHelp)}
                  descriptionProps={{ id: 'subtract-' + list + '-help' }}
                  attributes={{ input: { 'aria-describedby': 'subtract-' + list + '-help' + (affected ? ' subtraction-errors' : '') } }}
                  error={affected} value={draft[list]} rows={6} resize="vertical"
                  spellCheck={false} autoCapitalize="off" autoCorrect="off" classNames={{ input: 'network-value' }}
                  placeholder={list === 'include' ? examples[0].include : examples[0].exclude}
                  onChange={event => replaceLists(list === 'include' ? event.currentTarget.value : draft.include,
                    list === 'exclude' ? event.currentTarget.value : draft.exclude)} />;
              })}
              <Text size="xs" c="dimmed">{t($ => $.subtract.limits, {
                inputs: formatCount(MAX_SUBTRACTION_INPUTS), length: formatCount(MAX_INPUT_LENGTH), outputs: formatCount(MAX_SUBTRACTION_OUTPUTS),
              })}</Text>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">{t($ => $.cidr.entryCount, {
                  count: rows.include.length + rows.exclude.length, total: formatCount(rows.include.length + rows.exclude.length),
                })}</Text>
                <Button type="button" variant="subtle" size="xs" onClick={() => replaceLists('', '')}
                  disabled={!draft.include && !draft.exclude && !result && !error}>{t($ => $.cidr.clear)}</Button>
              </Group>
              <Group gap="sm">
                <Text size="sm" c="dimmed">{t($ => $.cidr.example)}</Text>
                {examples.map(example => <Button key={example.name} type="button" variant="default" size="xs"
                  onClick={() => replaceLists(example.include, example.exclude)}>{example.name}</Button>)}
              </Group>
              <Button type="submit" fullWidth>{t($ => $.subtract.calculate)}</Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
      <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="result-heading">
        <Stack gap="lg">
          <Group justify="space-between">
            <Title order={2} size="h3" id="result-heading">{t($ => $.subtract.result)}</Title>
            {result && <Badge variant="light">{result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</Badge>}
          </Group>
          {result ? <>
            <DataList orientation="vertical" withDivider>
              {[
                [t($ => $.subtract.included), result.includedAddressCount],
                [t($ => $.subtract.removed), result.removedAddressCount],
                [t($ => $.subtract.remaining), result.remainingAddressCount],
                [t($ => $.subtract.blocks), result.cidrs.length],
              ].map(([label, count]) => <DataList.Item key={label}>
                <DataList.ItemLabel>{label}</DataList.ItemLabel>
                <DataList.ItemValue className="network-value">{formatCount(count!)}</DataList.ItemValue>
              </DataList.Item>)}
            </DataList>
            {result.cidrs.length ? <Textarea label={t($ => $.subtract.output)} value={result.cidrs.join('\n')}
              readOnly rows={10} resize="vertical" spellCheck={false} classNames={{ input: 'network-value' }} />
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
          </> : <Stack align="center" py="xl" gap="sm">
            <Title order={3} size="h4">{t($ => $.subtract.pendingTitle)}</Title>
            <Text size="sm" c="dimmed" ta="center">{t($ => $.subtract.pendingDescription)}</Text>
          </Stack>}
        </Stack>
      </Paper>
    </SimpleGrid>
    <Stack component="section" aria-labelledby="explanation-heading" gap="sm">
      <Title order={2} size="h4" id="explanation-heading">{t($ => $.subtract.explanationTitle)}</Title>
      <Text size="sm" c="dimmed">{t($ => $.subtract.explanation)}</Text>
      <Text size="sm" c="dimmed">{t($ => $.subtract.review)}</Text>
    </Stack>
    <Stack component="section" aria-labelledby="examples-heading" gap="sm">
      <Title order={2} size="h4" id="examples-heading">{t($ => $.subtract.examplesTitle)}</Title>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {examples.map(example => <Paper key={example.name} withBorder p="md">
          <Stack gap="sm">
            <Text size="sm" fw={600}>{example.name}</Text>
            <Text size="sm">{t($ => $.subtract.example, { include: example.include, exclude: example.exclude })}</Text>
            <Code block>{example.cidrs.join('\n')}</Code>
          </Stack>
        </Paper>)}
      </SimpleGrid>
    </Stack>
  </Stack>;
}
