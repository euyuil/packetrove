import { StrictMode, useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { I18nextProvider } from 'react-i18next';
import { createI18n } from './i18n';
import { resolveRoute } from './i18n/routes';
import { App } from './App';
import { cssVariablesResolver, theme } from './theme';

export const IDENTIFIER_PREFIX = 'packetrove-';

export function Application({ pathname }: { pathname: string }) {
  const [i18n] = useState(() => createI18n(resolveRoute(pathname).locale));
  return <StrictMode>
    <I18nextProvider i18n={i18n}>
      <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} forceColorScheme="light">
        <App initialPathname={pathname} />
      </MantineProvider>
    </I18nextProvider>
  </StrictMode>;
}
