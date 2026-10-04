import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { cssVariablesResolver, theme } from '../../web/src/theme';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<StrictMode>
  <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} forceColorScheme="light">
    <App />
  </MantineProvider>
</StrictMode>);
