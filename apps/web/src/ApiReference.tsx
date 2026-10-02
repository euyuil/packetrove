import type { ComponentProps } from 'react';
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

export default function ApiReference() {
  return <div className="api-reference"><ApiReferenceReact configuration={configuration} /></div>;
}
