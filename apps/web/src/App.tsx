import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Anchor, Box, Button, Container, Divider, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { isToolPage } from '@packetrove/contracts';
import packetroveLogo from './assets/packetrove-logo-160x160.png';
import { ToolDraftProvider } from './ToolDraftProvider';
import { ToolPageView } from './ToolPageView';
import { LanguageSelector } from './LanguageSelector';
import { SiteFooter } from './SiteFooter';
import { ApiDocumentationBoundary } from './ApiDocumentationBoundary';
import { localizedPath, pagePaths, resolveRoute } from './i18n/routes';
import { updatePageMetadata } from './i18n/metadata';
import { ToolNavigation } from './ToolNavigation';
import { getPreparedPage, isRoutePrepared, prepareRoute } from './page-resources';
import { installLocale } from './i18n/locale-resources';
import { subscribeHistoryWrites } from './history-writes';

export function App({ initialPathname = window.location.pathname }: { initialPathname?: string } = {}) {
  const { t, i18n } = useTranslation();
  const [pathname, setPathname] = useState(initialPathname);
  const [urlSuffix, setUrlSuffix] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedNavigation, setFailedNavigation] = useState<{ url: URL; mode: 'push' | 'replace' } | null>(null);
  const navigationGeneration = useRef(0);
  const committedUrl = useRef('');
  const { locale, page, path } = resolveRoute(pathname);
  const committedRoute = useRef({ locale, path });
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(path);
  const homePage = page === 'home';
  const apiPage = page === 'api';
  const href = (destination: string) => localizedPath(destination, locale);
  const repository = import.meta.env.VITE_GITHUB_REPOSITORY || 'euyuil/packetrove';
  const commit = import.meta.env.VITE_GIT_COMMIT;
  const sourceUrl = `https://github.com/${repository}${commit ? `/tree/${commit}` : ''}`;
  const documentationUrl = `https://github.com/${repository}/blob/${commit || 'main'}`;
  const newIssueUrl = `https://github.com/${repository}/issues/new`;
  useLayoutEffect(() => { committedRoute.current = { locale, path }; }, [locale, path]);
  useLayoutEffect(() => {
    installLocale(i18n, locale);
    void i18n.changeLanguage(locale);
  }, [i18n, locale]);
  useEffect(() => { updatePageMetadata(locale, page, path); }, [locale, page, path]);
  useEffect(() => {
    // Canonical paths identify content independently of language and URL fragments.
    if (previousPath.current === path) return;
    previousPath.current = path;
    main.current?.focus({ preventScroll: true });
  }, [path]);
  useEffect(() => {
    committedUrl.current = window.location.href;
    const unsubscribeWrites = subscribeHistoryWrites(() => {
      const route = resolveRoute(window.location.pathname);
      if (route.locale !== committedRoute.current.locale || route.path !== committedRoute.current.path) return;
      committedUrl.current = window.location.href;
      setUrlSuffix(window.location.search + window.location.hash);
    });
    const updatePath = () => loadNavigation(new URL(window.location.href), 'replace');
    updatePath();
    window.addEventListener('popstate', updatePath);
    window.addEventListener('hashchange', updatePath);
    return () => {
      navigationGeneration.current++;
      unsubscribeWrites();
      window.removeEventListener('popstate', updatePath);
      window.removeEventListener('hashchange', updatePath);
    };
  }, []);

  function loadNavigation(destination: URL, mode: 'push' | 'replace') {
    const url = new URL(destination.href);
    const locationAtStart = new URL(window.location.href);
    const targetRoute = resolveRoute(url.pathname);
    const currentRoute = resolveRoute(locationAtStart.pathname);
    // Retries can start after the retained reference selects another operation.
    if (targetRoute.path === currentRoute.path && targetRoute.locale !== currentRoute.locale) {
      url.search = locationAtStart.search;
      url.hash = locationAtStart.hash;
    }
    const generation = ++navigationGeneration.current;
    setFailedNavigation(null);
    const commitNavigation = () => {
      if (generation !== navigationGeneration.current) return;
      const currentLocation = new URL(window.location.href);
      if (currentLocation.pathname === locationAtStart.pathname
        && (mode === 'replace' || resolveRoute(url.pathname).path === resolveRoute(locationAtStart.pathname).path)
        && currentLocation.href !== locationAtStart.href) {
        url.search = currentLocation.search;
        url.hash = currentLocation.hash;
      }
      if (window.location.href !== url.href) {
        window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url.href);
      }
      committedUrl.current = url.href;
      setPathname(url.pathname);
      setUrlSuffix(url.search + url.hash);
      setLoading(false);
    };
    if (isRoutePrepared(url.pathname)) {
      commitNavigation();
      return;
    }
    setLoading(true);
    void prepareRoute(url.pathname).then(commitNavigation, () => {
      if (generation !== navigationGeneration.current) return;
      // A history event changes the address before loading. Keep it aligned with
      // the retained page on failure; retry replaces that entry with the target.
      if (mode === 'replace' && committedUrl.current) {
        const currentLocation = new URL(window.location.href);
        const restored = new URL(committedUrl.current);
        if (currentLocation.pathname === locationAtStart.pathname && currentLocation.href !== locationAtStart.href) {
          restored.search = currentLocation.search;
          restored.hash = currentLocation.hash;
        }
        window.history.replaceState(null, '', restored);
      }
      setLoading(false);
      setFailedNavigation({ url, mode });
    });
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    loadNavigation(new URL(event.currentTarget.href), 'push');
  }

  const PageView = page === 'home' || page === 'api' || page === 'mcp' || page === 'privacy' ? getPreparedPage(page) : null;

  return <ToolDraftProvider><Container size={apiPage ? '100%' : 'lg'} px={{ base: 'md', sm: 'xl' }} py={{ base: 'md', sm: 'xl' }}>
    <Stack gap="lg">
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
      <ToolNavigation page={page} locale={locale} onNavigate={navigate} />
      {loading && <Group role="status" aria-label={t($ => $.common.pageLoading)} gap="sm">
        <Loader size="sm" /><Text>{t($ => $.common.pageLoading)}</Text>
      </Group>}
      {failedNavigation && <Alert role="alert" color="red">
        <Stack gap="sm">
          <Text>{t($ => $.common.pageLoadFailure)}</Text>
          <Button variant="light" onClick={() => loadNavigation(failedNavigation.url, failedNavigation.mode)}>
            {t($ => $.common.retryPage)}
          </Button>
        </Stack>
      </Alert>}
      <Box component="main" ref={main} tabIndex={-1} className="mantine-focus-never"
        aria-label={homePage ? t($ => $.common.home) : isToolPage(page) ? t($ => $[page].title)
          : apiPage ? t($ => $.api.title) : page === 'mcp' ? t($ => $.mcp.title)
          : page === 'privacy' ? t($ => $.privacy.title) : t($ => $.common.notFound)}>
        {homePage && PageView ? <PageView onNavigate={navigate} documentationUrl={documentationUrl} sourceUrl={sourceUrl} />
          : isToolPage(page) ? <ToolPageView page={page} onNavigate={navigate} />
          : page === 'mcp' && PageView ? <PageView onNavigate={navigate} documentationUrl={documentationUrl} sourceUrl={sourceUrl} />
          : page === 'privacy' && PageView ? <PageView onNavigate={navigate} documentationUrl={documentationUrl} sourceUrl={sourceUrl} />
          : apiPage ? <ApiDocumentationBoundary fallback={
            <Stack component="section" role="alert" aria-labelledby="api-documentation-error-heading">
              <Title order={1} size="h2" id="api-documentation-error-heading">{t($ => $.api.unavailableTitle)}</Title>
              <Text c="dimmed">{t($ => $.api.unavailableDescription)}</Text>
              <Anchor href={href(pagePaths.cidr)} onClick={navigate}>{t($ => $.api.returnToCalculator)}</Anchor>
            </Stack>
          }>
            {PageView && <PageView onNavigate={navigate} documentationUrl={documentationUrl} sourceUrl={sourceUrl} />}
          </ApiDocumentationBoundary> : <Stack component="section" py="xl">
          <Text size="sm" c="var(--mantine-primary-color-filled)" fw={600}>404</Text>
          <Title order={1}>{t($ => $.common.notFound)}</Title>
          <Text c="dimmed">{t($ => $.common.notFoundDescription)}</Text>
          <Anchor href={href('/')} onClick={navigate}>{t($ => $.common.returnHome)}</Anchor>
        </Stack>}
      </Box>
      <Divider />
      <SiteFooter sourceUrl={sourceUrl} documentationUrl={documentationUrl} locale={locale} page={page}
        newIssueUrl={newIssueUrl} commit={commit} onNavigate={navigate} />
    </Stack>
  </Container></ToolDraftProvider>;
}
