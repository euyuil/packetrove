import type { MouseEventHandler, ReactNode } from 'react';
import { Anchor, Box, Flex, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconBook, IconBrandGithub, IconBug, IconBulb, IconExternalLink, IconHelp, IconMail, IconScale, IconShieldLock, IconTerminal2, type TablerIcon } from '@tabler/icons-react';
import { SUPPORT_EMAIL } from '@packetrove/contracts';
import { useTranslation } from 'react-i18next';
import packetroveLogo from './assets/packetrove-logo-160x160.png';
import { localizedPath, pagePaths, type Locale, type Page } from './i18n/routes';

function FooterLink({ href, icon: Icon, external = false, current = false, label, onClick, children }: {
  href: string; icon: TablerIcon; external?: boolean; label?: string;
  current?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>; children?: ReactNode;
}) {
  return <Anchor size="sm" href={href} onClick={onClick} c="dimmed" underline="hover" display="inline-flex" maw="100%"
    mih={{ base: 44, sm: 0 }}
    target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
    aria-label={label} title={label} aria-current={current ? 'page' : undefined}>
    <Group component="span" gap={6} wrap="nowrap">
      <Box component={Icon} w={16} h={16} flex="0 0 auto" stroke={1.75} aria-hidden="true" focusable="false" />
      {children && <Text component="span" inherit miw={0}>{children}</Text>}
      {external && <Box component={IconExternalLink} w={12} h={12} flex="0 0 auto" stroke={1.75}
        aria-hidden="true" focusable="false" />}
    </Group>
  </Anchor>;
}

export function SiteFooter({ sourceUrl, documentationUrl, locale, page, newIssueUrl, commit, onNavigate }: {
  sourceUrl: string; documentationUrl: string; newIssueUrl: string; commit?: string;
  locale: Locale; page: Page; onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { t } = useTranslation();
  const sourceLabel = commit ? t($ => $.common.sourceCommit, { commit }) : t($ => $.common.source);

  return <Box component="footer" id="site-footer" pt="xs" pb="sm">
    <Flex direction={{ base: 'column', md: 'row' }} gap="xl" align="flex-start">
      <Stack gap="sm" align="flex-start" flex={{ md: '1.4 1 0' }} w={{ base: '100%', md: 'auto' }} miw={0}>
        <Group gap="xs">
          <img src={packetroveLogo} width="28" height="28" alt="" />
          <Text size="md" fw={700}>Packetrove</Text>
        </Group>
        <Text size="sm" c="dimmed" maw={300}>{t($ => $.common.tagline)}</Text>
      </Stack>
      <Box flex={{ md: '3 1 0' }} w={{ base: '100%', md: 'auto' }} miw={0}>
        <SimpleGrid type="container" cols={{ base: 1, '20rem': 2, '36rem': 3 }}
          spacing={{ base: 'lg', '36rem': 'xl' }} verticalSpacing="xl">
          <Stack gap="sm" align="flex-start" miw={0} component="section" aria-labelledby="footer-project-heading">
            <Title order={2} size="sm" fw={600} id="footer-project-heading">{t($ => $.footer.project)}</Title>
            <FooterLink href={sourceUrl} icon={IconBrandGithub} external label={sourceLabel}>
              {commit && <Text component="code" inherit ff="monospace">{commit.slice(0, 7)}</Text>}
            </FooterLink>
            <FooterLink href={`${documentationUrl}/LICENSE`} icon={IconScale} external>
              {t($ => $.common.sourceLicense)}
            </FooterLink>
            <FooterLink href={localizedPath(pagePaths.privacy, locale)} icon={IconShieldLock} current={page === 'privacy'} onClick={onNavigate}>
              {t($ => $.privacy.title)}
            </FooterLink>
            <FooterLink href={localizedPath(pagePaths.terms, locale)} icon={IconScale} current={page === 'terms'} onClick={onNavigate}>
              {t($ => $.terms.title)}
            </FooterLink>
          </Stack>
          <Stack gap="sm" align="flex-start" miw={0} component="section" aria-labelledby="footer-integrations-heading">
            <Title order={2} size="sm" fw={600} id="footer-integrations-heading">{t($ => $.footer.integrations)}</Title>
            <FooterLink href={localizedPath(pagePaths.api, locale)} icon={IconBook} current={page === 'api'} onClick={onNavigate}>
              {t($ => $.footer.apiDocumentation)}
            </FooterLink>
            <FooterLink href={localizedPath(pagePaths.mcp, locale)} icon={IconBook} current={page === 'mcp'} onClick={onNavigate}>
              {t($ => $.mcp.navigation)}
            </FooterLink>
            <FooterLink href={`${documentationUrl}/docs/integrations/cli.md`} icon={IconTerminal2} external>
              {t($ => $.footer.cliGuide)}
            </FooterLink>
          </Stack>
          <Stack gap="sm" align="flex-start" miw={0} component="section" aria-labelledby="footer-contact-heading">
            <Title order={2} size="sm" fw={600} id="footer-contact-heading">{t($ => $.footer.contact)}</Title>
            <FooterLink href={localizedPath(pagePaths.support, locale)} icon={IconHelp} current={page === 'support'} onClick={onNavigate}>
              {t($ => $.support.title)}
            </FooterLink>
            <FooterLink href={`${newIssueUrl}?template=bug-report.yml`} icon={IconBug} external>
              {t($ => $.common.reportBug)}
            </FooterLink>
            <FooterLink href={`${newIssueUrl}?template=feature-request.yml`} icon={IconBulb} external>
              {t($ => $.common.requestFeature)}
            </FooterLink>
            <FooterLink href={`mailto:${SUPPORT_EMAIL}`} icon={IconMail}>
              {t($ => $.footer.sendEmail)}
            </FooterLink>
          </Stack>
        </SimpleGrid>
      </Box>
    </Flex>
  </Box>;
}
