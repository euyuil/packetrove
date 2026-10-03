import { createRoot, hydrateRoot } from 'react-dom/client';
import { Application, IDENTIFIER_PREFIX } from './Application';
import { Alert, Button, MantineProvider, Stack, Text } from '@mantine/core';
import { prepareRoute } from './page-resources';
import { cssVariablesResolver, theme } from './theme';

export function startApplication(root: HTMLElement) {
  const pathname = root.dataset.prerenderedPath || window.location.pathname;
  let active = true;
  let applicationRoot: ReturnType<typeof createRoot> | undefined;
  let starting = false;
  let failureElement: HTMLDivElement | undefined;
  let failureRoot: ReturnType<typeof createRoot> | undefined;
  async function start() {
    if (starting || !active) return;
    starting = true;
    try {
      await prepareRoute(pathname);
      if (!active) return;
      failureRoot?.unmount();
      failureElement?.remove();
      failureRoot = undefined;
      failureElement = undefined;
      const application = <Application pathname={pathname} />;
      if (root.dataset.prerenderedPath) applicationRoot = hydrateRoot(root, application, { identifierPrefix: IDENTIFIER_PREFIX });
      else {
        applicationRoot = createRoot(root, { identifierPrefix: IDENTIFIER_PREFIX });
        applicationRoot.render(application);
      }
    } catch {
      if (!active) return;
      // Keep the static page readable when an initial resource fails to load.
      // Its localized retry wording does not depend on the failed language chunk.
      if (!failureRoot) {
        failureElement = document.createElement('div');
        root.before(failureElement);
        failureRoot = createRoot(failureElement);
      }
      failureRoot.render(<MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} forceColorScheme="light">
        <Alert role="alert" color="red" m="md"><Stack gap="sm">
          <Text>{root.dataset.loadFailure || 'This page could not be loaded. Please try again.'}</Text>
          <Button variant="light" onClick={() => { void start(); }}>{root.dataset.loadRetry || 'Retry'}</Button>
        </Stack></Alert>
      </MantineProvider>);
    } finally {
      starting = false;
    }
  }
  void start();
  return () => {
    active = false;
    applicationRoot?.unmount();
    failureRoot?.unmount();
    failureElement?.remove();
  };
}
