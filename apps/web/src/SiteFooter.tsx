import type { MouseEventHandler } from 'react';
import { Anchor, Box, Flex, Group, Stack, Text, Title } from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import packetroveLogo from './assets/packetrove-logo-160x160.png';

export function SiteFooter({ sourceUrl, documentationUrl, apiDocumentationHref, newIssueUrl, commit, onNavigate }: {
  sourceUrl: string; documentationUrl: string; newIssueUrl: string; commit?: string;
  apiDocumentationHref: string; onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { t } = useTranslation();
  const sourceLabel = commit ? t($ => $.common.sourceCommit, { commit }) : t($ => $.common.source);

  return <Box component="footer" id="site-footer" pt="xs" pb="sm">
    <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between"
      align={{ base: 'stretch', sm: 'flex-start' }} gap={{ base: 'xl', sm: 64 }}>
      <Stack gap="sm" align="flex-start" maw={300}>
        <Group gap="xs">
          <img src={packetroveLogo} width="28" height="28" alt="" />
          <Text size="md" fw={700}>Packetrove</Text>
        </Group>
        <Text size="sm" c="dimmed">{t($ => $.common.tagline)}</Text>
      </Stack>
      <Flex justify="space-between" align="flex-start" gap={{ base: 'lg', sm: 64 }} w={{ base: '100%', sm: 'auto' }}>
        <Stack gap="sm" align="flex-start" component="section" aria-labelledby="footer-project-heading">
          <Title order={2} size="sm" fw={600} id="footer-project-heading">{t($ => $.footer.project)}</Title>
          <Anchor size="sm" ff="monospace" href={sourceUrl} target="_blank" rel="noopener noreferrer" c="dimmed" underline="hover"
            aria-label={sourceLabel} title={sourceLabel}>
            {/* Align the inline SVG to the text baseline without overriding the footer line height. */}
            <Box component={IconBrandGithub} w="1em" h="1em" stroke={1.75} mr={commit ? 6 : 0}
              style={{ verticalAlign: '-0.125em' }} aria-hidden="true" focusable="false" />
            {commit && <Text component="code" inherit ff="inherit">{commit.slice(0, 7)}</Text>}
          </Anchor>
          <Anchor size="sm" href={apiDocumentationHref} onClick={onNavigate} c="dimmed" underline="hover">
            {t($ => $.api.title)}
          </Anchor>
          <Anchor size="sm" href={`${documentationUrl}/LICENSE`} target="_blank" rel="noopener noreferrer" c="dimmed" underline="hover">
            {t($ => $.common.sourceLicense)}
          </Anchor>
        </Stack>
        <Stack gap="sm" align="flex-start" component="section" aria-labelledby="footer-contact-heading">
          <Title order={2} size="sm" fw={600} id="footer-contact-heading">{t($ => $.footer.contact)}</Title>
          <Anchor size="sm" href={`${newIssueUrl}?template=bug-report.yml`} target="_blank" rel="noopener noreferrer" c="dimmed" underline="hover">
            {t($ => $.common.reportBug)} <span aria-hidden="true">↗</span>
          </Anchor>
          <Anchor size="sm" href={`${newIssueUrl}?template=feature-request.yml`} target="_blank" rel="noopener noreferrer" c="dimmed" underline="hover">
            {t($ => $.common.requestFeature)} <span aria-hidden="true">↗</span>
          </Anchor>
          <Anchor size="sm" href="mailto:hello@packetrove.com" c="dimmed" underline="hover">
            {t($ => $.footer.sendEmail)}
          </Anchor>
        </Stack>
      </Flex>
    </Flex>
  </Box>;
}
