import { useEffect } from 'react';
import { Anchor, Box, Button, Container, Divider, Group, Stack, Text, Title } from '@mantine/core';
import packetroveLogo from './assets/packetrove-logo-160x160.png';
import { CidrCoverTool } from './CidrCoverTool';
import { PublicIpTool } from './PublicIpTool';
import { getApiUrl } from './api';

export function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const ipPage = path === '/ip' || path === '/ip.html';
  const cidrPage = path === '/' || path === '/index.html';
  const pageTitle = ipPage ? 'My Public IP' : cidrPage ? 'Smallest Covering CIDR' : 'Page not found';
  const repository = import.meta.env.VITE_GITHUB_REPOSITORY || 'euyuil/packetrove';
  const commit = import.meta.env.VITE_GIT_COMMIT;
  const sourceUrl = `https://github.com/${repository}${commit ? `/tree/${commit}` : ''}`;
  useEffect(() => {
    document.title = `${pageTitle} — Packetrove`;
  }, [pageTitle]);

  return <Container size="lg" px={{ base: 'md', sm: 'xl' }} py="xl">
    <Stack gap="xl">
      <Group component="header" justify="space-between">
        <Anchor href="/" aria-label="Packetrove home" underline="never" c="var(--mantine-color-text)">
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
      <Group component="nav" aria-label="Network tools" gap="sm">
        <Button component="a" href="/" variant={cidrPage ? 'light' : 'subtle'}
          aria-current={cidrPage ? 'page' : undefined}>Smallest Covering CIDR</Button>
        <Button component="a" href="/ip" variant={ipPage ? 'light' : 'subtle'}
          aria-current={ipPage ? 'page' : undefined}>My Public IP</Button>
      </Group>
      <Box component="main">
        {ipPage ? <PublicIpTool /> : cidrPage ? <CidrCoverTool /> : <Stack component="section" py="xl">
          <Text size="sm" c="var(--mantine-primary-color-filled)" fw={600}>404</Text>
          <Title order={1}>Page not found</Title>
          <Text c="dimmed">The page you requested does not exist.</Text>
          <Anchor href="/">Return to home</Anchor>
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
