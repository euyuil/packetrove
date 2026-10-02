import type { ComponentProps } from 'react';
import { Anchor, Group, Stack, Text, Title } from '@mantine/core';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';
import { getApiUrl } from './api';
import { fetchApiReference } from './api-reference';

const configuration: ComponentProps<typeof ApiReferenceReact>['configuration'] = {
  url: getApiUrl('/openapi.json'),
  servers: [{ url: new URL(getApiUrl('/')).origin, description: 'Packetrove API' }],
  proxyUrl: '',
  customFetch: fetchApiReference,
  agent: { disabled: true },
  telemetry: false,
  persistAuth: false,
  withDefaultFonts: false,
  showDeveloperTools: 'never',
  hideClientButton: true,
  theme: 'none',
  darkMode: false,
  hideDarkModeToggle: true,
};

export default function ApiDocumentation() {
  return <Stack component="section" gap="lg" aria-labelledby="api-documentation-heading">
    <Group justify="space-between" align="center">
      <Title order={1} size="h2" id="api-documentation-heading">API documentation</Title>
      <Anchor href={getApiUrl('/openapi.json')} size="sm">OpenAPI specification <span aria-hidden="true">↗</span></Anchor>
    </Group>
    <Text c="dimmed" size="sm">
      Explore the endpoints, copy request examples, and try the API without an account or API key.
      Sending a request submits its inputs to the API. Public IP checks observe your browser&apos;s connection.
    </Text>
    <div className="api-reference"><ApiReferenceReact configuration={configuration} /></div>
  </Stack>;
}
