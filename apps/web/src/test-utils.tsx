import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { render as renderComponent, type RenderOptions } from '@testing-library/react';
import { theme } from './theme';

export function render(ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) {
  return renderComponent(ui, {
    ...options,
    wrapper: ({ children }) => (
      <MantineProvider theme={theme} forceColorScheme="light" env="test">{children}</MantineProvider>
    ),
  });
}
