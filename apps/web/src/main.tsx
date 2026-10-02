import { createRoot, hydrateRoot } from 'react-dom/client';
import { Application, IDENTIFIER_PREFIX } from './Application';
import '@mantine/core/styles.css';
import './styles.css';

const root = document.getElementById('root')!;
const pathname = root.dataset.prerenderedPath || window.location.pathname;
const application = <Application pathname={pathname} />;
if (root.dataset.prerenderedPath) hydrateRoot(root, application, { identifierPrefix: IDENTIFIER_PREFIX });
else createRoot(root, { identifierPrefix: IDENTIFIER_PREFIX }).render(application);
