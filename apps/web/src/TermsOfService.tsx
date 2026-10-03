import type { MouseEventHandler } from 'react';
import { Anchor, Stack, Text, Title } from '@mantine/core';
import { SUPPORT_EMAIL } from '@packetrove/contracts';
import { useTranslation } from 'react-i18next';
import { localizedPath, pagePaths } from './i18n/routes';
import { resolveLocale } from './i18n/locales';

const sections = ['use', 'results', 'availability', 'license', 'privacy', 'changes'] as const;

export function TermsOfService({ onNavigate, documentationUrl }: {
  onNavigate: MouseEventHandler<HTMLAnchorElement>; documentationUrl: string;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  return <Stack component="article" gap="lg" aria-labelledby="terms-heading">
    <Stack gap="xs">
      <Title order={1} id="terms-heading">{t($ => $.terms.title)}</Title>
      <Text size="sm" c="dimmed">{t($ => $.terms.updated)}</Text>
      <Text>{t($ => $.terms.introduction)}</Text>
    </Stack>
    {sections.map(section => <Stack key={section} component="section" gap="sm" aria-labelledby={`terms-${section}-heading`}>
      <Title order={2} size="h3" id={`terms-${section}-heading`}>{t($ => $.terms.sections[section].title)}</Title>
      <Text>{t($ => $.terms.sections[section].body)}</Text>
      {section === 'license' && <Anchor href={`${documentationUrl}/LICENSE`} target="_blank" rel="noopener noreferrer">
        {t($ => $.common.sourceLicense)}
      </Anchor>}
      {section === 'privacy' && <Anchor href={localizedPath(pagePaths.privacy, locale)} onClick={onNavigate}>
        {t($ => $.privacy.title)}
      </Anchor>}
    </Stack>)}
    <Stack component="section" gap="sm" aria-labelledby="terms-contact-heading">
      <Title order={2} size="h3" id="terms-contact-heading">{t($ => $.terms.contactTitle)}</Title>
      <Text>{t($ => $.terms.contactBody)}</Text>
      <Anchor href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Anchor>
      <Anchor href={localizedPath(pagePaths.support, locale)} onClick={onNavigate}>{t($ => $.support.title)}</Anchor>
    </Stack>
  </Stack>;
}
