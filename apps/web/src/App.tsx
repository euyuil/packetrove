import { useEffect, useState, type MouseEvent } from 'react';
import { Anchor, Box, Button, Container, Divider, Group, Stack, Text, Title } from '@mantine/core';
import packetroveLogo from './assets/packetrove-logo-160x160.png';
import { CidrCoverTool, type CidrCoverDraft } from './CidrCoverTool';
import { PublicIpTool } from './PublicIpTool';
import { HomePage } from './HomePage';
import { getApiUrl } from './api';

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [draft, setDraft] = useState<CidrCoverDraft>({ input: '', result: null, error: null });
  const path = pathname.replace(/\/+$/, '') || '/';
  const homePage = path === '/' || path === '/index.html';
  const ipPage = path === '/ip' || path === '/ip.html';
  const cidrPage = path === '/cidr' || path === '/cidr.html';
  const pageTitle = homePage ? 'Packetrove — Network tools for humans and agents'
    : `${ipPage ? 'My Public IP' : cidrPage ? 'Smallest Covering CIDR' : 'Page not found'} — Packetrove`;
  const repository = import.meta.env.VITE_GITHUB_REPOSITORY || 'euyuil/packetrove';
  const commit = import.meta.env.VITE_GIT_COMMIT;
  const sourceUrl = `https://github.com/${repository}${commit ? `/tree/${commit}` : ''}`;
  const documentationUrl = `https://github.com/${repository}/blob/${commit || 'main'}`;
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);
  useEffect(() => {
    const updatePath = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const destination = event.currentTarget.getAttribute('href')!;
    if (window.location.pathname !== destination || window.location.search || window.location.hash) {
      window.history.pushState(null, '', destination);
    }
    setPathname(window.location.pathname);
  }

  return <Container size="lg" px={{ base: 'md', sm: 'xl' }} py="xl">
    <Stack gap="xl">
      <Group component="header" justify="space-between">
        <Anchor href="/" onClick={navigate} aria-label="Packetrove home" underline="never" c="var(--mantine-color-text)">
          <Group gap="sm">
            <img src={packetroveLogo} width="40" height="40" alt="" />
            <Text component="span" size="xl" fw={700}>Packetrove</Text>
          </Group>
        </Anchor>
        <Anchor size="sm" href={getApiUrl('/openapi.json')}>
          API specification <span aria-hidden="true">↗</span>
        </Anchor>
      </Group>
      <Divider />
      <Group component="nav" aria-label="Main navigation" gap="sm">
        <Button component="a" href="/" onClick={navigate} variant={homePage ? 'light' : 'subtle'}
          aria-current={homePage ? 'page' : undefined}>Home</Button>
        <Button component="a" href="/cidr" onClick={navigate} variant={cidrPage ? 'light' : 'subtle'}
          aria-current={cidrPage ? 'page' : undefined}>Smallest Covering CIDR</Button>
        <Button component="a" href="/ip" onClick={navigate} variant={ipPage ? 'light' : 'subtle'}
          aria-current={ipPage ? 'page' : undefined}>My Public IP</Button>
      </Group>
      <Box component="main">
        {homePage ? <HomePage documentationUrl={documentationUrl} repositoryUrl={`https://github.com/${repository}`} />
          : ipPage ? <PublicIpTool /> : cidrPage ? <CidrCoverTool draft={draft} onDraftChange={setDraft} /> : <Stack component="section" py="xl">
          <Text size="sm" c="var(--mantine-primary-color-filled)" fw={600}>404</Text>
          <Title order={1}>Page not found</Title>
          <Text c="dimmed">The page you requested does not exist.</Text>
          <Anchor href="/" onClick={navigate}>Return to home</Anchor>
        </Stack>}
      </Box>
      <Divider />
      <Group component="footer" justify="space-between">
        <Text size="xs" c="dimmed">Packetrove · Network tools for humans and agents</Text>
        <Anchor size="xs" href={sourceUrl} target="_blank" rel="noopener noreferrer"
          title={commit ? `View source for commit ${commit} on GitHub` : 'View Packetrove on GitHub'}>
          GitHub{commit && <> · <code>{commit.slice(0, 7)}</code></>}
        </Anchor>
      </Group>
    </Stack>
  </Container>;
}
