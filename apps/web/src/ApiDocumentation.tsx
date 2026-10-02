import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, Group, Stack, Text, Title } from '@mantine/core';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';
import { getApiUrl } from './api';
import { fetchApiReference } from './api-reference';
import { resolveLocale } from './i18n/locales';

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
  const { t, i18n } = useTranslation();
  return <Stack component="section" gap="lg" aria-labelledby="api-documentation-heading">
    <Group justify="space-between" align="center">
      <Title order={1} size="h2" id="api-documentation-heading">{t($ => $.api.title)}</Title>
      <Anchor href={getApiUrl('/openapi.json')} size="sm">{t($ => $.api.specification)} <span aria-hidden="true">↗</span></Anchor>
    </Group>
    <Text c="dimmed" size="sm">
      {t($ => $.api.description)}
    </Text>
    {resolveLocale(i18n.resolvedLanguage) !== 'en' && <Text size="sm" c="dimmed">{t($ => $.api.englishReference)}</Text>}
    <div className="api-reference"><ApiReferenceReact configuration={configuration} /></div>
  </Stack>;
}
