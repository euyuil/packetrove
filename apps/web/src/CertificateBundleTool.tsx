import type { FormEvent, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Code, Group, Select, SimpleGrid, Stack, Table, Text, Textarea, TextInput, Title } from '@mantine/core';
import { CERTIFICATE_BUNDLE_SAMPLES, MAX_CERTIFICATES, MAX_PEM_BYTES, toolCatalog, inputIssuePath } from '@packetrove/contracts';
import { CertificateBundleInputError } from '@packetrove/core/certificate-bundle';
import { ToolPageHeader } from './ToolPageHeader';
import { ToolPanel } from './ToolPanel';
import { ToolResultCounts } from './ToolResultCounts';
import { ToolErrorSummary } from './ToolErrorSummary';
import { ToolExamples, ToolExampleCard } from './ToolExamples';
import { ToolQuestions } from './ToolQuestions';
import { ToolMcpSection } from './ToolMcpSection';
import { useToolDraft } from './ToolDraftProvider';
import { useCalculationFeedback } from './useCalculationFeedback';
import { useCertificateBundleCheck, type CertificateBundleDraft } from './useCertificateBundleCheck';
import { CertificateRelationshipGraph } from './CertificateRelationshipGraph';
import { CertificateCheckBadge, CertificateDetails, CertificateFindings } from './CertificateBundleResults';
import { resolveLocale } from './i18n/locales';

const draftDefinition = { createInitialDraft: (): CertificateBundleDraft => ({
  request: { pem: '', hostname: '' }, sampleName: 'normal', result: null, error: null,
}) };

export function CertificateBundlePage({ onNavigate }: { onNavigate?: MouseEventHandler<HTMLAnchorElement> }) {
  const [draft, change] = useToolDraft(draftDefinition);
  return <CertificateBundleTool draft={draft} onDraftChange={change} {...(onNavigate ? { onNavigate } : {})} />;
}

export function CertificateBundleTool({ draft, onDraftChange, onNavigate }: {
  draft: CertificateBundleDraft; onDraftChange: (draft: CertificateBundleDraft) => void;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const feedback = useCalculationFeedback();
  const { checking, replaceInput, inspect } = useCertificateBundleCheck(draft, onDraftChange, feedback.complete);
  const { request, result, error } = draft;
  const bytes = new TextEncoder().encode(request.pem).length;
  const sample = CERTIFICATE_BUNDLE_SAMPLES.find(sample => sample.name === draft.sampleName) ?? CERTIFICATE_BUNDLE_SAMPLES[0];
  const count = (value: number) => new Intl.NumberFormat(locale).format(value);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void inspect(request); }
  const reason = error instanceof CertificateBundleInputError ? error.reason : 'INVALID_INPUT';
  const errorTitle = error?.code === 'INTERNAL_ERROR' ? t($ => $.certificate.errors.CRYPTO_UNAVAILABLE)
    : t($ => $.certificate.errors[reason]);
  const issues = error?.issues?.map(issue => {
    const path = inputIssuePath(issue);
    const field = path?.length === 1 ? path[0] : null;
    const recognized = field === 'pem' || field === 'hostname';
    const message = issue.location ? t($ => $.certificate.inputLine, { line: issue.location.line, message: errorTitle }) : errorTitle;
    return { message, ...(recognized ? { inputId: `certificate-${field}` } : {}),
      ...(field === 'pem' && issue.location ? { selection: { start: issue.location.offset, end: issue.location.end } } : {}) };
  });

  return <Stack gap="xl">
    <ToolPageHeader tool="certificate" notice={t($ => $.certificate.local)} />
    <Alert color="blue" title={t($ => $.certificate.scopeTitle)}>{t($ => $.certificate.scope)}</Alert>
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
      <ToolPanel headingId="certificate-input-heading" title={t($ => $.certificate.inputs)}>
        <Select label={t($ => $.certificate.samplesLabel)} value={sample.name} allowDeselect={false}
          data={CERTIFICATE_BUNDLE_SAMPLES.map(sample => ({ value: sample.name, label: t($ => $.certificate.samples[sample.name]) }))}
          onChange={value => { if (value) replaceInput(request, value); }} />
        <Button type="button" variant="default" onClick={() => { void inspect(sample.request); }} loading={checking}>
          {t($ => $.certificate.loadSample)}
        </Button>
        <form onSubmit={submit}><Stack gap="md">
          {error && <ToolErrorSummary ref={feedback.errorSummary} id="certificate-errors" title={errorTitle} issues={issues} />}
          <Textarea id="certificate-pem" label={t($ => $.certificate.pem)}
            description={t($ => $.certificate.pemHelp, { maximum: MAX_CERTIFICATES, kib: MAX_PEM_BYTES / 1024 })}
            value={request.pem} onChange={event => replaceInput({ pem: event.currentTarget.value, hostname: request.hostname ?? '' })}
            minRows={15} maxRows={22} autosize spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
            classNames={{ input: 'network-value' }} error={Boolean(error?.issues?.some(issue => inputIssuePath(issue)?.[0] === 'pem'))}
            attributes={{ input: { 'aria-describedby': 'certificate-pem-help' + (error ? ' certificate-errors' : '') } }}
            descriptionProps={{ id: 'certificate-pem-help' }} />
          <Group justify="space-between">
            <Text size="xs" c={bytes > MAX_PEM_BYTES ? 'red' : 'dimmed'}>{t($ => $.certificate.bytes, { current: count(bytes), maximum: count(MAX_PEM_BYTES) })}</Text>
            <Button type="button" variant="default" size="xs" onClick={() => replaceInput({ pem: '', hostname: '' })}>{t($ => $.cidr.clear)}</Button>
          </Group>
          <TextInput id="certificate-hostname" label={t($ => $.certificate.hostname)} description={t($ => $.certificate.hostnameHelp)}
            placeholder="service.example.com" value={request.hostname ?? ''} autoComplete="off" autoCapitalize="off" spellCheck={false}
            error={Boolean(error?.issues?.some(issue => inputIssuePath(issue)?.[0] === 'hostname'))}
            onChange={event => replaceInput({ ...request, hostname: event.currentTarget.value })} />
          <Button type="submit" loading={checking} fullWidth>{t($ => $.certificate.check)}</Button>
        </Stack></form>
      </ToolPanel>
      <Stack gap="lg">
        <ToolPanel ref={feedback.resultPanel} headingId="certificate-result-heading" title={t($ => $.certificate.result)} aria-busy={checking}>
          <Text size="sm" role="status" aria-label={t($ => $.certificate.result)} aria-live="polite" aria-atomic="true">
            {result && <span key={feedback.completionVersion}>{t($ => $.certificate.completed, { certificates: count(result.certificates.length), findings: count(result.findings.length) })}</span>}
          </Text>
          {result ? <>
            <ToolResultCounts items={[
              { label: t($ => $.certificate.certificates), value: count(result.certificates.length) },
              { label: t($ => $.certificate.verifiedLinks), value: count(result.relationships.filter(link => link.signature === 'verified').length) },
              { label: t($ => $.certificate.findingCount), value: count(result.findings.length) },
            ]} />
            <Text size="xs" c="dimmed">{t($ => $.certificate.evaluation, { time: new Date(result.evaluatedAt).toLocaleString(locale) })}</Text>
            {result.leafIndexes.length > 1 && <Select label={t($ => $.certificate.selectLeaf)} placeholder={t($ => $.certificate.selectPosition)}
              value={result.selectedLeafIndex === null ? null : String(result.selectedLeafIndex)} clearable
              data={result.leafIndexes.map(index => ({ value: String(index), label: `#${index + 1} ${result.certificates[index]!.subject}` }))}
              onChange={value => { void inspect({ pem: request.pem, hostname: request.hostname ?? '', ...(value === null ? {} : { leafIndex: Number(value) }) }); }} />}
            {result.hostname && <Alert color={result.hostname.status === 'matched' ? 'blue' : result.hostname.status === 'mismatched' ? 'red' : 'orange'}
              title={t($ => $.certificate.hostnameTitle, { hostname: result.hostname.expected })}>
              {t($ => $.certificate.hostnameStatus[result.hostname!.status])}
            </Alert>}
            <Title order={3} size="h4">{t($ => $.certificate.relationships)}</Title>
            <CertificateRelationshipGraph result={result} />
            {result.relationships.length > 0 && <Table.ScrollContainer minWidth={420}>
              <Table fz="xs" withTableBorder verticalSpacing="xs">
                <Table.Thead><Table.Tr><Table.Th>{t($ => $.certificate.candidate)}</Table.Th><Table.Th>{t($ => $.certificate.evidence.signature)}</Table.Th><Table.Th>{t($ => $.certificate.constraints)}</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>{result.relationships.map(link => <Table.Tr key={`${link.childIndex}-${link.issuerIndex}`}>
                  <Table.Td>#{link.childIndex + 1} → #{link.issuerIndex + 1}</Table.Td>
                  <Table.Td><CertificateCheckBadge status={link.signature} /></Table.Td>
                  <Table.Td>{t($ => !link.issuerEligible ? $.certificate.constraintsFailed : link.keyIdentifierMatch === false ? $.certificate.keyIdFailed : $.certificate.constraintsPassed)}</Table.Td>
                </Table.Tr>)}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>}
            <Title order={3} size="h4">{t($ => $.certificate.findingsTitle)}</Title>
            <CertificateFindings result={result} />
          </> : <Text size="sm" c="dimmed">{t($ => checking ? $.certificate.checking : $.certificate.pending)}</Text>}
        </ToolPanel>
        {result && <ToolPanel headingId="certificate-details-heading" title={t($ => $.certificate.details)}><CertificateDetails result={result} /></ToolPanel>}
      </Stack>
    </SimpleGrid>
    <Stack component="section" aria-labelledby="certificate-explanation-heading" gap="sm">
      <Title order={2} size="h4" id="certificate-explanation-heading">{t($ => $.certificate.explanationTitle)}</Title>
      <Text size="sm" c="dimmed">{t($ => $.certificate.explanation)}</Text>
      <Text size="sm" c="dimmed">{t($ => $.certificate.dnsRules)}</Text>
    </Stack>
    <ToolExamples title={t($ => $.certificate.examplesTitle)}>
      {toolCatalog.certificate.examples.map((example, index) => <ToolExampleCard key={example.name}
        title={t($ => index === 0 ? $.certificate.samples.normal : $.certificate.samples.omittedRoot)}>
        <Code block>{example.result.certificates.map(certificate => `#${certificate.index + 1} ${certificate.commonName ?? certificate.subject}`).join('\n')}</Code>
        <Text size="sm">{t($ => $.certificate.exampleNote, { time: example.result.evaluatedAt })}</Text>
      </ToolExampleCard>)}
    </ToolExamples>
    <ToolQuestions tool="certificate" />
    <ToolMcpSection tool="certificate" onNavigate={onNavigate} />
  </Stack>;
}
