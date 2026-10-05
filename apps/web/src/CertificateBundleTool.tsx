import { useState, type FormEvent, type MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Code, Group, Modal, Select, SimpleGrid, Stack, Table, Text, Textarea, TextInput, Title, VisuallyHidden } from '@mantine/core';
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
  request: { pem: '', hostname: '' }, result: null, error: null,
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
  const [examplesOpen, setExamplesOpen] = useState(false);
  const { checking, replaceInput, inspect } = useCertificateBundleCheck(draft, onDraftChange, feedback.complete);
  const { request, result, error } = draft;
  const bytes = new TextEncoder().encode(request.pem).length;
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
    <ToolPanel headingId="certificate-input-heading" title={t($ => $.certificate.inputs)}>
      <Text size="sm" c="dimmed">{t($ => $.certificate.pending)}</Text>
      <form onSubmit={submit}><Stack gap="md">
        {error && <ToolErrorSummary ref={feedback.errorSummary} id="certificate-errors" title={errorTitle} issues={issues} />}
        <Textarea id="certificate-pem" label={t($ => $.certificate.pem)}
          description={t($ => $.certificate.pemHelp, { maximum: MAX_CERTIFICATES, kib: MAX_PEM_BYTES / 1024 })}
          value={request.pem} onChange={event => replaceInput({ pem: event.currentTarget.value, hostname: request.hostname ?? '' })}
          minRows={8} maxRows={14} autosize spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
          classNames={{ input: 'network-value' }} error={Boolean(error?.issues?.some(issue => inputIssuePath(issue)?.[0] === 'pem'))}
          attributes={{ input: { 'aria-describedby': 'certificate-pem-help' + (error ? ' certificate-errors' : '') } }}
          descriptionProps={{ id: 'certificate-pem-help' }} />
        <Text size="xs" c={bytes > MAX_PEM_BYTES ? 'red' : 'dimmed'}>{t($ => $.certificate.bytes, { current: count(bytes), maximum: count(MAX_PEM_BYTES) })}</Text>
        <TextInput id="certificate-hostname" label={t($ => $.certificate.hostname)} description={t($ => $.certificate.hostnameHelp)}
          placeholder="service.example.com" value={request.hostname ?? ''} maw={560} w="100%" autoComplete="off" autoCapitalize="off" spellCheck={false}
          error={Boolean(error?.issues?.some(issue => inputIssuePath(issue)?.[0] === 'hostname'))}
          onChange={event => replaceInput({ ...request, hostname: event.currentTarget.value })} />
        <Group justify="space-between">
          <Button type="submit" loading={checking} w={{ base: '100%', sm: 'auto' }}>{t($ => $.certificate.check)}</Button>
          <Group gap="xs">
            <Button type="button" variant="default" onClick={() => replaceInput({ pem: '', hostname: '' })}
              disabled={!request.pem && !request.hostname && !result && !error}>{t($ => $.cidr.clear)}</Button>
            <Button type="button" variant="default" onClick={() => setExamplesOpen(true)}>{t($ => $.certificate.loadSample)}</Button>
          </Group>
        </Group>
      </Stack></form>
    </ToolPanel>
    <VisuallyHidden role="status" aria-label={t($ => $.certificate.result)} aria-live="polite" aria-atomic="true">
      {result ? <span key={feedback.completionVersion}>{t($ => $.certificate.completed, { certificates: count(result.certificates.length), findings: count(result.findings.length) })}</span>
        : checking ? t($ => $.certificate.checking) : ''}
    </VisuallyHidden>
    {(checking || result) && <Stack gap="lg">
      <ToolPanel ref={feedback.resultPanel} headingId="certificate-result-heading" title={t($ => $.certificate.result)} aria-busy={checking}>
        {result ? <>
          <ToolResultCounts columns={{ base: 2, sm: 3 }} items={[
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
          <Title order={3} size="h4">{t($ => $.certificate.findingsTitle)}</Title>
          <CertificateFindings result={result} />
        </> : <Text size="sm" c="dimmed">{t($ => $.certificate.checking)}</Text>}
      </ToolPanel>
      {result && <>
        <ToolPanel headingId="certificate-relationships-heading" title={t($ => $.certificate.relationships)}>
          <Box maw={640} w="100%" mx="auto"><CertificateRelationshipGraph result={result} /></Box>
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
        </ToolPanel>
        <ToolPanel headingId="certificate-details-heading" title={t($ => $.certificate.details)}><CertificateDetails result={result} /></ToolPanel>
      </>}
    </Stack>}
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
    <Modal opened={examplesOpen} onClose={() => setExamplesOpen(false)} title={t($ => $.certificate.samplesLabel)} size="lg"
      closeButtonProps={{ 'aria-label': t($ => $.certificate.closeExamples), style: { border: '1px solid var(--mantine-color-default-border)' } }}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">{t($ => $.certificate.samplesHelp)}</Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }} role="group" aria-label={t($ => $.certificate.samplesLabel)}>
          {CERTIFICATE_BUNDLE_SAMPLES.map(sample => <Button key={sample.name} type="button" variant="default" h="auto" py="sm"
            styles={{ label: { whiteSpace: 'normal' } }} onClick={() => { replaceInput(sample.request); setExamplesOpen(false); }}>
            {t($ => $.certificate.samples[sample.name])}
          </Button>)}
        </SimpleGrid>
      </Stack>
    </Modal>
  </Stack>;
}
