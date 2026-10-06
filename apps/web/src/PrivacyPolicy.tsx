import type { MouseEventHandler } from 'react';
import { Anchor, Stack, Text, Title } from '@mantine/core';
import { SUPPORT_EMAIL } from '@packetrove/contracts';
import { useTranslation } from 'react-i18next';
import { localizedPath, pagePaths } from './i18n/routes';
import { resolveLocale } from './i18n/locales';

const sections = ['local', 'remote', 'connection', 'feedback', 'logs', 'providers', 'controls', 'correspondence', 'contact'] as const;

export function PrivacyPolicy({ onNavigate }: { onNavigate: MouseEventHandler<HTMLAnchorElement> }) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
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
      {section === 'contact' && <>
        <Anchor href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Anchor>
        <Anchor href={localizedPath(pagePaths.support, locale)} onClick={onNavigate}>{t($ => $.support.title)}</Anchor>
      </>}
    </Stack>)}
  </Stack>;
}
