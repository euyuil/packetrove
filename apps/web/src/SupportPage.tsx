import type { MouseEventHandler } from 'react';
import { Anchor, Button, Group, Stack, Text, Title } from '@mantine/core';
import { SUPPORT_EMAIL, operationCatalog } from '@packetrove/contracts';
import { useTranslation } from 'react-i18next';
import { localizedPath, pagePaths } from './i18n/routes';
import { resolveLocale } from './i18n/locales';

export function SupportPage({ onNavigate, documentationUrl }: {
  onNavigate: MouseEventHandler<HTMLAnchorElement>; documentationUrl: string;
}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const repository = import.meta.env.VITE_GITHUB_REPOSITORY || 'euyuil/packetrove';
  const issues = `https://github.com/${repository}/issues/new`;
  return <Stack component="article" gap="lg" aria-labelledby="support-heading">
    <Stack gap="xs">
      <Title order={1} id="support-heading">{t($ => $.support.title)}</Title>
      <Text>{t($ => $.support.introduction)}</Text>
    </Stack>
    <Stack component="section" gap="sm" aria-labelledby="support-contact-heading">
      <Title order={2} size="h3" id="support-contact-heading">{t($ => $.support.contactTitle)}</Title>
      <Text>{t($ => $.support.contactBody)}</Text>
      <Button component="a" href={`mailto:${SUPPORT_EMAIL}`} variant="light" w="fit-content" maw="100%" h="auto" py="xs"
        styles={{ label: { whiteSpace: 'normal' } }}>
        {t($ => $.footer.sendEmail)}: {SUPPORT_EMAIL}
      </Button>
    </Stack>
    <Stack component="section" gap="sm" aria-labelledby="support-public-heading">
      <Title order={2} size="h3" id="support-public-heading">{t($ => $.support.publicTitle)}</Title>
      <Text>{t($ => $.support.publicBody)}</Text>
      <Group>
        <Button component="a" href={`${issues}?template=bug-report.yml`} target="_blank" rel="noopener noreferrer" variant="outline">
          {t($ => $.common.reportBug)}
        </Button>
        <Button component="a" href={`${issues}?template=feature-request.yml`} target="_blank" rel="noopener noreferrer" variant="default">
          {t($ => $.common.requestFeature)}
        </Button>
      </Group>
    </Stack>
    <Stack component="section" gap="sm" aria-labelledby="support-details-heading">
      <Title order={2} size="h3" id="support-details-heading">{t($ => $.support.detailsTitle)}</Title>
      <Text>{t($ => $.support.detailsBody)}</Text>
    </Stack>
    <Stack component="section" gap="sm" aria-labelledby="support-feedback-heading">
      <Title order={2} size="h3" id="support-feedback-heading">{t($ => $.feedback.title)}</Title>
      <Text>{t($ => $.feedback.availability, { name: operationCatalog.feedback.id })}</Text>
      <Text>{t($ => $.feedback.authorization)}</Text>
      <Anchor href={`${localizedPath(pagePaths.mcp, locale)}#mcp-feedback-heading`} onClick={onNavigate}>{t($ => $.mcp.navigation)}</Anchor>
    </Stack>
    <Stack component="section" gap="sm" aria-labelledby="support-guides-heading">
      <Title order={2} size="h3" id="support-guides-heading">{t($ => $.support.guidesTitle)}</Title>
      <Text>{t($ => $.support.guidesBody)}</Text>
      <Group>
        <Anchor href={localizedPath(pagePaths.api, locale)} onClick={onNavigate}>{t($ => $.footer.apiDocumentation)}</Anchor>
        <Anchor href={localizedPath(pagePaths.mcp, locale)} onClick={onNavigate}>{t($ => $.mcp.navigation)}</Anchor>
        <Anchor href={`${documentationUrl}/docs/integrations/cli.md`} target="_blank" rel="noopener noreferrer">{t($ => $.footer.cliGuide)}</Anchor>
      </Group>
      <Anchor href={localizedPath(pagePaths.privacy, locale)} onClick={onNavigate}>{t($ => $.privacy.title)}</Anchor>
    </Stack>
  </Stack>;
}
