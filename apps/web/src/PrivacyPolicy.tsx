import { Anchor, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const sections = ['local', 'remote', 'connection', 'logs', 'providers', 'controls', 'contact'] as const;

export function PrivacyPolicy() {
  const { t } = useTranslation();
  return <Stack component="article" gap="lg" aria-labelledby="privacy-policy-heading">
    <Stack gap="xs">
      <Title order={1} id="privacy-policy-heading">{t($ => $.privacy.title)}</Title>
      <Text size="sm" c="dimmed">{t($ => $.privacy.updated)}</Text>
      <Text>{t($ => $.privacy.introduction)}</Text>
    </Stack>
    {sections.map(section => <Stack key={section} component="section" gap="sm" aria-labelledby={`privacy-${section}-heading`}>
      <Title order={2} size="h3" id={`privacy-${section}-heading`}>{t($ => $.privacy.sections[section].title)}</Title>
      <Text>{t($ => $.privacy.sections[section].body)}</Text>
      {section === 'providers' && <Anchor href="https://www.cloudflare.com/privacypolicy/">{t($ => $.privacy.cloudflarePolicy)}</Anchor>}
      {section === 'contact' && <Anchor href="mailto:hello@packetrove.com">hello@packetrove.com</Anchor>}
    </Stack>)}
  </Stack>;
}
