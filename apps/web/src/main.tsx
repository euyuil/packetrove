import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { I18nextProvider } from 'react-i18next';
import { createI18n } from './i18n';
import { resolveRoute } from './i18n/routes';
import { App } from './App';
import { theme } from './theme';
import '@mantine/core/styles.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={createI18n(resolveRoute(window.location.pathname).locale)}>
      <MantineProvider theme={theme} forceColorScheme="light"><App /></MantineProvider>
    </I18nextProvider>
  </StrictMode>,
);
