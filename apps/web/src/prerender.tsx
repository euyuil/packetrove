import { renderToString } from 'react-dom/server';
import { Application, IDENTIFIER_PREFIX } from './Application';
import { prepareRoute } from './page-resources';

export async function renderPage(pathname: string) {
  await prepareRoute(pathname);
  return renderToString(<Application pathname={pathname} />, { identifierPrefix: IDENTIFIER_PREFIX });
}
