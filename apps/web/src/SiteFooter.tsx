import type { MouseEventHandler, ReactNode } from 'react';
import { Anchor, Box, Flex, Group, Stack, Text, Title } from '@mantine/core';
import { IconBook, IconBrandGithub, IconBug, IconBulb, IconExternalLink, IconMail, IconScale, type TablerIcon } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import packetroveLogo from './assets/packetrove-logo-160x160.png';

function FooterLink({ href, icon: Icon, external = false, label, onClick, children }: {
  href: string; icon: TablerIcon; external?: boolean; label?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>; children?: ReactNode;
}) {
  return <Anchor size="sm" href={href} onClick={onClick} c="dimmed" underline="hover" display="inline-flex"
    target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
    aria-label={label} title={label}>
    <Group component="span" gap={6} wrap="nowrap">
      <Box component={Icon} w={16} h={16} flex="0 0 auto" stroke={1.75} aria-hidden="true" focusable="false" />
      {children && <Text component="span" inherit>{children}</Text>}
      {external && <Box component={IconExternalLink} w={12} h={12} flex="0 0 auto" stroke={1.75}
        aria-hidden="true" focusable="false" />}
    </Group>
  </Anchor>;
}

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
          <FooterLink href={sourceUrl} icon={IconBrandGithub} external label={sourceLabel}>
            {commit && <Text component="code" inherit ff="monospace">{commit.slice(0, 7)}</Text>}
          </FooterLink>
          <FooterLink href={apiDocumentationHref} icon={IconBook} onClick={onNavigate}>
            {t($ => $.api.title)}
          </FooterLink>
          <FooterLink href={`${documentationUrl}/LICENSE`} icon={IconScale} external>
            {t($ => $.common.sourceLicense)}
          </FooterLink>
        </Stack>
        <Stack gap="sm" align="flex-start" component="section" aria-labelledby="footer-contact-heading">
          <Title order={2} size="sm" fw={600} id="footer-contact-heading">{t($ => $.footer.contact)}</Title>
          <FooterLink href={`${newIssueUrl}?template=bug-report.yml`} icon={IconBug} external>
            {t($ => $.common.reportBug)}
          </FooterLink>
          <FooterLink href={`${newIssueUrl}?template=feature-request.yml`} icon={IconBulb} external>
            {t($ => $.common.requestFeature)}
          </FooterLink>
          <FooterLink href="mailto:hello@packetrove.com" icon={IconMail}>
            {t($ => $.footer.sendEmail)}
          </FooterLink>
        </Stack>
      </Flex>
    </Flex>
  </Box>;
}
