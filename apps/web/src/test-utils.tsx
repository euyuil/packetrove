import { useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createI18n } from './i18n';
import { resolveRoute } from './i18n/routes';
import { MantineProvider } from '@mantine/core';
import { render as renderComponent, type RenderOptions } from '@testing-library/react';
import { cssVariablesResolver, theme } from './theme';

function TestProviders({ children }: { children: ReactNode }) {
  const [i18n] = useState(() => createI18n(resolveRoute(window.location.pathname).locale));
  return <I18nextProvider i18n={i18n}>
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} forceColorScheme="light" env="test">
      {children}
    </MantineProvider>
  </I18nextProvider>;
}

export function render(ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) {
  return renderComponent(ui, {
    ...options,
    wrapper: TestProviders,
  });
}

export function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Value>((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}
