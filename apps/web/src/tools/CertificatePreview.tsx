import { Stack, Text } from '@mantine/core';
import { toolCatalog } from '@packetrove/contracts';

export function CertificatePreview() {
  return <Stack gap="xs">{toolCatalog.certificate.example.result.certificates.map(certificate =>
    <Text key={certificate.index} size="sm">#{certificate.index + 1} {certificate.commonName ?? certificate.subject}</Text>)}</Stack>;
}
