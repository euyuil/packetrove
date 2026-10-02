import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, Box, Button, Container, Divider, Group, Stack, Text, Title } from '@mantine/core';
import { IconBook, IconHome } from '@tabler/icons-react';
import packetroveLogo from './assets/packetrove-logo-160x160.png';
import { CidrCoverTool, type CidrCoverDraft } from './CidrCoverTool';
import { CidrSubtractTool, type CidrSubtractDraft } from './CidrSubtractTool';
import { PublicIpTool } from './PublicIpTool';
import { HomePage } from './HomePage';
import { LanguageSelector } from './LanguageSelector';
import { SiteFooter } from './SiteFooter';
import { ApiDocumentationBoundary } from './ApiDocumentationBoundary';
import { localizedPath, pagePaths, resolveRoute } from './i18n/routes';
import { updatePageMetadata } from './i18n/metadata';
import ApiDocumentation from './ApiDocumentation';
import { McpDocumentation } from './McpDocumentation';
import { ToolIcon } from './ToolIcon';

export function App({ initialPathname = window.location.pathname }: { initialPathname?: string } = {}) {
  const { t, i18n } = useTranslation();
  const [pathname, setPathname] = useState(initialPathname);
  const [urlSuffix, setUrlSuffix] = useState('');
  const [draft, setDraft] = useState<CidrCoverDraft>({ input: '', result: null, error: null });
  const [subtractDraft, setSubtractDraft] = useState<CidrSubtractDraft>({ include: '', exclude: '', result: null, error: null });
  const { locale, page, path } = resolveRoute(pathname);
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(path);
  const homePage = page === 'home';
  const ipPage = page === 'ip';
  const cidrPage = page === 'cidr';
  const subtractPage = page === 'subtract';
  const apiPage = page === 'api';
  const href = (destination: string) => localizedPath(destination, locale);
  const repository = import.meta.env.VITE_GITHUB_REPOSITORY || 'euyuil/packetrove';
  const commit = import.meta.env.VITE_GIT_COMMIT;
  const sourceUrl = `https://github.com/${repository}${commit ? `/tree/${commit}` : ''}`;
  const documentationUrl = `https://github.com/${repository}/blob/${commit || 'main'}`;
  const newIssueUrl = `https://github.com/${repository}/issues/new`;
  useLayoutEffect(() => { void i18n.changeLanguage(locale); }, [i18n, locale]);
  useEffect(() => { updatePageMetadata(locale, page, path); }, [locale, page, path]);
  useEffect(() => {
    // Canonical paths identify content independently of language and URL fragments.
    if (previousPath.current === path) return;
    previousPath.current = path;
    main.current?.focus({ preventScroll: true });
  }, [path]);
  useEffect(() => {
    const updatePath = () => {
      setPathname(window.location.pathname);
      setUrlSuffix(window.location.search + window.location.hash);
    };
    updatePath();
    window.addEventListener('popstate', updatePath);
    window.addEventListener('hashchange', updatePath);
    return () => {
      window.removeEventListener('popstate', updatePath);
      window.removeEventListener('hashchange', updatePath);
    };
  }, []);

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const destination = event.currentTarget.href;
    if (window.location.href !== destination) {
      window.history.pushState(null, '', destination);
    }
    setPathname(window.location.pathname);
    setUrlSuffix(window.location.search + window.location.hash);
  }

  return <Container size={apiPage ? '100%' : 'lg'} px={{ base: 'md', sm: 'xl' }} py="xl">
    <Stack gap="xl">
      <Group component="header" justify="space-between">
        <Anchor href={href('/')} onClick={navigate} aria-label={t($ => $.common.homeLabel)} underline="never" c="var(--mantine-color-text)">
          <Group gap="sm">
            <img src={packetroveLogo} width="40" height="40" alt="" />
            <Text component="span" size="xl" fw={700}>Packetrove</Text>
          </Group>
        </Anchor>
        <LanguageSelector locale={locale} path={path} urlSuffix={urlSuffix}
          onOpen={() => setUrlSuffix(window.location.search + window.location.hash)} onNavigate={navigate} />
      </Group>
      <Divider />
      <Group component="nav" aria-label={t($ => $.common.navigation)} gap="sm">
        <Button component="a" href={href('/')} onClick={navigate} variant={homePage ? 'light' : 'subtle'}
          leftSection={<IconHome size={18} stroke={1.75} aria-hidden="true" focusable="false" />}
          aria-current={homePage ? 'page' : undefined}>{t($ => $.common.home)}</Button>
        <Button component="a" href={href('/cidr')} onClick={navigate} variant={cidrPage ? 'light' : 'subtle'}
          leftSection={<ToolIcon tool="cidr" size={18} />}
          aria-current={cidrPage ? 'page' : undefined}>{t($ => $.cidr.title)}</Button>
        <Button component="a" href={href('/cidr/subtract')} onClick={navigate} variant={subtractPage ? 'light' : 'subtle'}
          leftSection={<ToolIcon tool="subtract" size={18} />}
          aria-current={subtractPage ? 'page' : undefined}>{t($ => $.subtract.title)}</Button>
        <Button component="a" href={href(pagePaths.ip)} onClick={navigate} variant={ipPage ? 'light' : 'subtle'}
          leftSection={<ToolIcon tool="ip" size={18} />}
          aria-current={ipPage ? 'page' : undefined}>{t($ => $.ip.title)}</Button>
        <Button component="a" href={href(pagePaths.mcp)} onClick={navigate} variant={page === 'mcp' ? 'light' : 'subtle'}
          leftSection={<IconBook size={18} stroke={1.75} aria-hidden="true" focusable="false" />}
          aria-current={page === 'mcp' ? 'page' : undefined}>{t($ => $.mcp.navigation)}</Button>
      </Group>
      <Box component="main" ref={main} tabIndex={-1} className="mantine-focus-never"
        aria-label={homePage ? t($ => $.common.home) : ipPage ? t($ => $.ip.title)
          : cidrPage ? t($ => $.cidr.title) : subtractPage ? t($ => $.subtract.title)
          : apiPage ? t($ => $.api.title) : page === 'mcp' ? t($ => $.mcp.title) : t($ => $.common.notFound)}>
        {homePage ? <HomePage onNavigate={navigate} documentationUrl={documentationUrl} repositoryUrl={`https://github.com/${repository}`} />
          : ipPage ? <PublicIpTool onNavigate={navigate} /> : cidrPage ? <CidrCoverTool draft={draft} onDraftChange={setDraft} onNavigate={navigate} />
          : page === 'mcp' ? <McpDocumentation onNavigate={navigate} documentationUrl={documentationUrl} sourceUrl={sourceUrl} />
          : subtractPage ? <CidrSubtractTool draft={subtractDraft} onDraftChange={setSubtractDraft} onNavigate={navigate} />
          : apiPage ? <ApiDocumentationBoundary fallback={
            <Stack component="section" role="alert" aria-labelledby="api-documentation-error-heading">
              <Title order={1} size="h2" id="api-documentation-error-heading">{t($ => $.api.unavailableTitle)}</Title>
              <Text c="dimmed">{t($ => $.api.unavailableDescription)}</Text>
              <Anchor href={href('/cidr')} onClick={navigate}>{t($ => $.api.returnToCalculator)}</Anchor>
            </Stack>
          }>
            <ApiDocumentation onNavigate={navigate} />
          </ApiDocumentationBoundary> : <Stack component="section" py="xl">
          <Text size="sm" c="var(--mantine-primary-color-filled)" fw={600}>404</Text>
          <Title order={1}>{t($ => $.common.notFound)}</Title>
          <Text c="dimmed">{t($ => $.common.notFoundDescription)}</Text>
          <Anchor href={href('/')} onClick={navigate}>{t($ => $.common.returnHome)}</Anchor>
        </Stack>}
      </Box>
      <Divider />
      <SiteFooter sourceUrl={sourceUrl} documentationUrl={documentationUrl} apiDocumentationHref={href(pagePaths.api)}
        newIssueUrl={newIssueUrl} commit={commit} onNavigate={navigate} />
    </Stack>
  </Container>;
}
