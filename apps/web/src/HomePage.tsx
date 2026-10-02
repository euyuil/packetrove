import { Anchor, Badge, Code, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { PUBLIC_IP_PATH } from '@packetrove/contracts';
import cliPackage from '../../../packages/cli/package.json';
import { getApiUrl } from './api';

export function HomePage({ documentationUrl, repositoryUrl }: {
  documentationUrl: string; repositoryUrl: string;
}) {
  const apiExample = `curl -fsS ${getApiUrl(PUBLIC_IP_PATH)} \\
  -H 'Accept: text/plain'`;
  const cliInstall = [
    `git clone ${repositoryUrl}.git`,
    'cd packetrove',
    'pnpm install',
    'pnpm --filter @packetrove/cli pack --pack-destination "$PWD"',
    `npm install --global ./packetrove-cli-${cliPackage.version}.tgz`,
  ].join('\n');
  const mcpUrl = getApiUrl('/mcp');

  return <Stack gap="xl">
    <Stack component="section" aria-labelledby="project-title" gap="md" py={{ base: 'md', sm: 'xl' }}>
      <Title order={1} id="project-title" maw={760}>Network tools for humans and agents</Title>
      <Text size="lg" c="dimmed" maw={760}>
        Open source network utilities for your browser, terminal, and AI agents.
        Use the navigation to open a tool, or connect Packetrove to your own workflow below.
      </Text>
      <Group gap="sm">
        <Badge variant="light">Open source</Badge>
        <Badge variant="light">No account or API key required</Badge>
      </Group>
    </Stack>
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} miw={0} aria-labelledby="api-heading">
        <Stack gap="md">
          <Title order={2} size="h3" id="api-heading">Web API</Title>
          <Text c="dimmed">Call Packetrove from any HTTP client. For example, get your current public IP with curl:</Text>
          <Code block>{apiExample}</Code>
          <Text size="sm" c="dimmed">The response is the IP address followed by a newline, with <Code>Content-Type: text/plain</Code>.</Text>
          <Anchor size="sm" href={`${documentationUrl}/docs/api/README.md`}>Read the API guide</Anchor>
        </Stack>
      </Paper>
      <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} miw={0} aria-labelledby="cli-heading">
        <Stack gap="md">
          <Title order={2} size="h3" id="cli-heading">Command-line interface</Title>
          <Text c="dimmed">Install from source with Node.js and pnpm:</Text>
          <Code block>{cliInstall}</Code>
          <Text size="sm" c="dimmed">Then print your current public IP:</Text>
          <Code block>packetrove ip</Code>
          <Anchor size="sm" href={`${documentationUrl}/docs/integrations/cli.md`}>Read the CLI guide</Anchor>
        </Stack>
      </Paper>
    </SimpleGrid>
    <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="mcp-heading">
      <Stack gap="md">
        <Title order={2} size="h3" id="mcp-heading">Model Context Protocol</Title>
        <Text c="dimmed">Connect your AI agent to Packetrove over Streamable HTTP. No authentication or local server is needed.</Text>
        <Stack gap="xs">
          <Text size="sm" fw={600}>Server address</Text>
          <Code block>{mcpUrl}</Code>
        </Stack>
        <Text size="sm" c="dimmed">With your client installed, add the server:</Text>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Stack gap="sm" miw={0}>
            <Title order={3} size="h4">Claude Code</Title>
            <Code block>{`claude mcp add --transport http --scope user packetrove \\
  ${mcpUrl}`}</Code>
          </Stack>
          <Stack gap="sm" miw={0}>
            <Title order={3} size="h4">Codex</Title>
            <Code block>{`codex mcp add packetrove \\
  --url ${mcpUrl}`}</Code>
          </Stack>
        </SimpleGrid>
        <Text size="sm" c="dimmed">Use <Code>/mcp</Code> in your client to check the connection. Public IP checks observe the connection used by the agent.</Text>
        <Anchor size="sm" href={`${documentationUrl}/docs/integrations/mcp.md`}>Read the MCP guide</Anchor>
      </Stack>
    </Paper>
  </Stack>;
}
