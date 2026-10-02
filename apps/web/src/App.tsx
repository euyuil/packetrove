import { lazy, Suspense, useEffect, useLayoutEffect, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, Box, Button, Container, Divider, Group, Loader, Stack, Text, Title } from '@mantine/core';
import packetroveLogo from './assets/packetrove-logo-160x160.png';
import { CidrCoverTool, type CidrCoverDraft } from './CidrCoverTool';
import { PublicIpTool } from './PublicIpTool';
import { HomePage } from './HomePage';
import { ApiDocumentationBoundary } from './ApiDocumentationBoundary';
import { localizedPath, resolveRoute } from './i18n/routes';
import { updatePageMetadata } from './i18n/metadata';

const ApiDocumentation = lazy(() => import('./ApiDocumentation'));

export function App() {
  const { t, i18n } = useTranslation();
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [draft, setDraft] = useState<CidrCoverDraft>({ input: '', result: null, error: null });
  const { locale, page, path } = resolveRoute(pathname);
  const homePage = page === 'home';
  const ipPage = page === 'ip';
  const cidrPage = page === 'cidr';
  const apiPage = page === 'api';
  const href = (destination: string) => localizedPath(destination, locale);
  const repository = import.meta.env.VITE_GITHUB_REPOSITORY || 'euyuil/packetrove';
  const commit = import.meta.env.VITE_GIT_COMMIT;
  const sourceUrl = `https://github.com/${repository}${commit ? `/tree/${commit}` : ''}`;
  const documentationUrl = `https://github.com/${repository}/blob/${commit || 'main'}`;
  useLayoutEffect(() => { void i18n.changeLanguage(locale); }, [i18n, locale]);
  useEffect(() => { updatePageMetadata(locale, page, path); }, [locale, page, path]);
  useEffect(() => {
    const updatePath = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const destination = event.currentTarget.href;
    if (window.location.href !== destination) {
      window.history.pushState(null, '', destination);
    }
    setPathname(window.location.pathname);
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
        <Group gap="xs" role="group" aria-label={t($ => $.common.language)}>
            <Button component="a" href={localizedPath(path, 'en') + window.location.search + window.location.hash}
              onClick={navigate} size="xs" variant={locale === 'en' ? 'light' : 'subtle'} lang="en" hrefLang="en"
              aria-current={locale === 'en' ? 'true' : undefined}>English</Button>
            <Button component="a" href={localizedPath(path, 'zh-Hans') + window.location.search + window.location.hash}
              onClick={navigate} size="xs" variant={locale === 'zh-Hans' ? 'light' : 'subtle'} lang="zh-Hans" hrefLang="zh-Hans"
              aria-current={locale === 'zh-Hans' ? 'true' : undefined}>简体中文</Button>
        </Group>
      </Group>
      <Divider />
      <Group component="nav" aria-label={t($ => $.common.navigation)} gap="sm">
        <Button component="a" href={href('/')} onClick={navigate} variant={homePage ? 'light' : 'subtle'}
          aria-current={homePage ? 'page' : undefined}>{t($ => $.common.home)}</Button>
        <Button component="a" href={href('/cidr')} onClick={navigate} variant={cidrPage ? 'light' : 'subtle'}
          aria-current={cidrPage ? 'page' : undefined}>{t($ => $.cidr.title)}</Button>
        <Button component="a" href={href('/ip')} onClick={navigate} variant={ipPage ? 'light' : 'subtle'}
          aria-current={ipPage ? 'page' : undefined}>{t($ => $.ip.title)}</Button>
      </Group>
      <Box component="main">
        {homePage ? <HomePage onNavigate={navigate} documentationUrl={documentationUrl} repositoryUrl={`https://github.com/${repository}`} />
          : ipPage ? <PublicIpTool /> : cidrPage ? <CidrCoverTool draft={draft} onDraftChange={setDraft} />
          : apiPage ? <ApiDocumentationBoundary fallback={
            <Stack component="section" role="alert" aria-labelledby="api-documentation-error-heading">
              <Title order={1} size="h2" id="api-documentation-error-heading">{t($ => $.api.unavailableTitle)}</Title>
              <Text c="dimmed">{t($ => $.api.unavailableDescription)}</Text>
              <Anchor href={href('/cidr')} onClick={navigate}>{t($ => $.api.returnToCalculator)}</Anchor>
            </Stack>
          }>
            <Suspense fallback={<Group role="status"><Loader size="sm" /><Text>{t($ => $.api.loading)}</Text></Group>}>
              <ApiDocumentation />
            </Suspense>
          </ApiDocumentationBoundary> : <Stack component="section" py="xl">
          <Text size="sm" c="var(--mantine-primary-color-filled)" fw={600}>404</Text>
          <Title order={1}>{t($ => $.common.notFound)}</Title>
          <Text c="dimmed">{t($ => $.common.notFoundDescription)}</Text>
          <Anchor href={href('/')} onClick={navigate}>{t($ => $.common.returnHome)}</Anchor>
        </Stack>}
      </Box>
      <Divider />
      <Group component="footer" justify="space-between">
        <Text size="xs" c="dimmed">Packetrove · {t($ => $.common.tagline)}</Text>
        <Group gap="xs">
          <Anchor size="xs" href={sourceUrl} target="_blank" rel="noopener noreferrer"
            title={commit ? t($ => $.common.sourceCommit, { commit }) : t($ => $.common.source)}>
            GitHub{commit && <> · <code>{commit.slice(0, 7)}</code></>}
          </Anchor>
          <Text component="span" size="xs" c="dimmed" aria-hidden="true">·</Text>
          <Anchor size="xs" href={`${documentationUrl}/LICENSE`} target="_blank" rel="noopener noreferrer">
            {t($ => $.common.sourceLicense)}
          </Anchor>
        </Group>
      </Group>
    </Stack>
  </Container>;
}
