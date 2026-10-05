import { useTranslation } from 'react-i18next';
import { Accordion, Badge, Card, Code, Group, Stack, Text, Textarea, Box } from '@mantine/core';
import type { CertificateBundleResult, CertificateCheckStatus } from '@packetrove/contracts';
import { resolveLocale } from './i18n/locales';

const severityColor = { error: 'red', warning: 'orange', info: 'blue' };
const statusColor = { verified: 'teal', failed: 'red', unsupported: 'orange', unavailable: 'gray' };
export function CertificateCheckBadge({ status }: { status: CertificateCheckStatus }) {
  const { t } = useTranslation();
  return <Badge color={statusColor[status]} variant="light">{t($ => $.certificate.status[status])}</Badge>;
}

export function CertificateFindings({ result }: { result: CertificateBundleResult }) {
  const { t } = useTranslation();
  const severityOrder = ['error', 'warning', 'info'];
  const findings = [...result.findings].sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));
  return <Stack gap="sm">
    <Text size="sm" c="dimmed" maw="75ch">{t($ => $.certificate.severityHelp)}</Text>
    {findings.map((finding, index) => <Card key={`${finding.code}-${index}`} withBorder padding="md">
      <Stack gap="xs">
        <Group gap="xs">
          <Badge color={severityColor[finding.severity]} variant="light">{t($ => $.certificate.severity[finding.severity])}</Badge>
          <Text size="sm" fw={600}>{t($ => $.certificate.findings[finding.code].title)}</Text>
          <Text size="xs" c="dimmed">{finding.certificateIndexes.map(index => `#${index + 1}`).join(', ')}</Text>
        </Group>
        <Text size="sm" maw="75ch"><Text span fw={600}>{t($ => $.certificate.nextAction)}: </Text>{t($ => $.certificate.findings[finding.code].action)}</Text>
        <Accordion variant="contained" radius="sm">
          <Accordion.Item value="evidence">
            <Accordion.Control py="xs" aria-label={`${t($ => $.certificate.evidenceTitle)}: ${t($ => $.certificate.findings[finding.code].title)}`}>
              <Text size="sm">{t($ => $.certificate.evidenceTitle)}</Text>
            </Accordion.Control>
            <Accordion.Panel><Stack gap="xs">
              <Code fz="xs" w="fit-content" style={{ overflowWrap: 'anywhere' }}>{finding.code}</Code>
              {Object.entries(finding.evidence).map(([key, value]) => <Text key={key} size="xs" style={{ overflowWrap: 'anywhere' }}>
                <Text span fw={600}>{t($ => $.certificate.evidence[key as keyof typeof $.certificate.evidence])}: </Text>
                {typeof value === 'boolean' ? t($ => value ? $.certificate.yes : $.certificate.no)
                  : value === null || value === '(none)' ? t($ => $.certificate.notProvided)
                    : typeof value === 'string' && value in statusColor ? t($ => $.certificate.status[value as CertificateCheckStatus]) : String(value)}
              </Text>)}
            </Stack></Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Card>)}
    {!findings.length && <Text c="dimmed" size="sm">{t($ => $.certificate.noFindings)}</Text>}
  </Stack>;
}

export function CertificateDetails({ result }: { result: CertificateBundleResult }) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const date = (value: string) => new Date(value).toLocaleString(locale);
  const absent = t($ => $.certificate.notProvided);
  return <Stack gap="md">
    <Accordion variant="separated" multiple>
      {result.certificates.map(certificate => <Accordion.Item key={certificate.index} value={String(certificate.index)}>
        <Accordion.Control>
          <Group gap="xs" wrap="wrap">
            <Text fw={600}>#{certificate.index + 1}</Text>
            <Badge variant="light" color={certificate.ca ? 'gray' : 'violet'}>{t($ => certificate.ca ? $.certificate.ca : $.certificate.nonCa)}</Badge>
            <Text size="sm" style={{ overflowWrap: 'anywhere' }}>{certificate.subject}</Text>
          </Group>
        </Accordion.Control>
        <Accordion.Panel><Stack gap="xs">
          {[
            [t($ => $.certificate.originalPosition), t($ => $.certificate.position, { number: certificate.index + 1, line: certificate.line })],
            [t($ => $.certificate.evidence.subject), certificate.subject], [t($ => $.certificate.evidence.issuer), certificate.issuer],
            ['SAN', certificate.sans.map(name => `${name.type}: ${name.value}`).join('; ') || absent],
            [t($ => $.certificate.evidence.notBefore), date(certificate.notBefore)], [t($ => $.certificate.evidence.notAfter), date(certificate.notAfter)],
            ['basicConstraints', certificate.basicConstraintsPresent ? `CA=${certificate.ca}` : absent],
            ['keyCertSign', certificate.keyCertSign === null ? absent : t($ => certificate.keyCertSign ? $.certificate.yes : $.certificate.no)],
            [t($ => $.certificate.evidence.algorithm), certificate.signatureAlgorithm], [t($ => $.certificate.serial), certificate.serialNumber],
            [t($ => $.certificate.evidence.fingerprintSha256), certificate.fingerprintSha256],
          ].map(([label, value]) => <Box key={label}>
            <Text size="xs" c="dimmed">{label}</Text>
            <Text size="sm" style={{ overflowWrap: 'anywhere' }}>{value}</Text>
          </Box>)}
          {certificate.selfSignature && <Group gap="xs"><Text size="sm">{t($ => $.certificate.selfSignature)}</Text><CertificateCheckBadge status={certificate.selfSignature} /></Group>}
        </Stack></Accordion.Panel>
      </Accordion.Item>)}
    </Accordion>
    <Accordion variant="contained"><Accordion.Item value="json"><Accordion.Control>{t($ => $.certificate.json)}</Accordion.Control>
      <Accordion.Panel><Textarea aria-label={t($ => $.certificate.json)} value={JSON.stringify(result, null, 2)} readOnly autosize
        minRows={8} maxRows={20} spellCheck={false} classNames={{ input: 'network-value' }} /></Accordion.Panel>
    </Accordion.Item></Accordion>
  </Stack>;
}
