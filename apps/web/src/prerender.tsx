import { renderToString } from 'react-dom/server';
import { Application, IDENTIFIER_PREFIX } from './Application';

export function renderPage(pathname: string) {
  return renderToString(<Application pathname={pathname} />, { identifierPrefix: IDENTIFIER_PREFIX });
}
