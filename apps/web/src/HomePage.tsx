import type { MouseEventHandler } from 'react';
import { Anchor, Badge, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';

export function HomePage({ onNavigate, documentationUrl }: {
  onNavigate: MouseEventHandler<HTMLAnchorElement>; documentationUrl: string;
}) {
  return <Stack gap="xl">
    <Stack component="section" aria-labelledby="project-title" gap="md" py={{ base: 'md', sm: 'xl' }}>
      <Title order={1} id="project-title" maw={760}>Network tools for humans and agents</Title>
      <Text size="lg" c="dimmed" maw={760}>
        Packetrove helps developers and network administrators simplify firewall IP lists,
        check a connection's public IP, and use the same tools from a browser, scripts, or an AI agent.
      </Text>
      <Group gap="sm">
        <Badge variant="light">Open source</Badge>
        <Badge variant="light">IPv4 and IPv6</Badge>
        <Badge variant="light">No account required</Badge>
      </Group>
    </Stack>
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
      <Stack gap="xs">
        <Title order={2} size="h4">Keep address lists local</Title>
        <Text size="sm" c="dimmed">The CIDR calculator runs in your browser. Your address list stays on your device.</Text>
      </Stack>
      <Stack gap="xs">
        <Title order={2} size="h4">Understand the coverage</Title>
        <Text size="sm" c="dimmed">See the full address range and exact counts, including any addresses added beyond your original list.</Text>
      </Stack>
      <Stack gap="xs">
        <Title order={2} size="h4">Fit your workflow</Title>
        <Text size="sm" c="dimmed">Use the website for a quick check, JSON results for scripts, or Model Context Protocol tools for AI agents.</Text>
      </Stack>
    </SimpleGrid>
    <Stack component="section" aria-labelledby="tools-heading" gap="md">
      <Title order={2} size="h3" id="tools-heading">Explore the tools</Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <Paper withBorder p={{ base: 'md', sm: 'xl' }}>
          <Stack gap="md" h="100%">
            <Title order={3} size="h4">Smallest Covering CIDR</Title>
            <Text c="dimmed">Combine IPv4 or IPv6 addresses and ranges into one covering CIDR, and review the additional allowlist or blocklist coverage.</Text>
            <Text size="sm" c="var(--mantine-primary-color-filled)">Calculated in your browser</Text>
            <Button component="a" href="/cidr" onClick={onNavigate} mt="auto">Open CIDR calculator</Button>
          </Stack>
        </Paper>
        <Paper withBorder p={{ base: 'md', sm: 'xl' }}>
          <Stack gap="md" h="100%">
            <Title order={3} size="h4">My Public IP</Title>
            <Text c="dimmed">See and copy the public IPv4 or IPv6 address used by your current connection. With a VPN or proxy, this is its exit address.</Text>
            <Text size="sm" c="var(--mantine-primary-color-filled)">Checked online when you open the tool</Text>
            <Button component="a" href="/ip" onClick={onNavigate} mt="auto">Open public IP tool</Button>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
    <Stack component="section" aria-labelledby="integrations-heading" gap="md">
      <Title order={2} size="h3" id="integrations-heading">Use Packetrove beyond the browser</Title>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        <Stack gap="xs">
          <Title order={3} size="h4">Web API</Title>
          <Text size="sm" c="dimmed">Call the hosted tools and receive structured JSON results without an API key.</Text>
          <Anchor size="sm" href="/docs/api" onClick={onNavigate}>Read the API guide</Anchor>
        </Stack>
        <Stack gap="xs">
          <Title order={3} size="h4">Command-line interface</Title>
          <Text size="sm" c="dimmed">Build the CLI from the repository for offline CIDR calculations and public IP checks from your machine.</Text>
          <Anchor size="sm" href={`${documentationUrl}/docs/integrations/cli.md`}>Read the CLI guide</Anchor>
        </Stack>
        <Stack gap="xs">
          <Title order={3} size="h4">AI agents</Title>
          <Text size="sm" c="dimmed">Connect an agent through Model Context Protocol to calculate ranges or check its connection's public IP.</Text>
          <Anchor size="sm" href={`${documentationUrl}/docs/integrations/mcp.md`}>Read the agent connection guide</Anchor>
        </Stack>
      </SimpleGrid>
    </Stack>
  </Stack>;
}
