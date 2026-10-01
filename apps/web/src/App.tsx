import { useEffect } from 'react';
import packetroveLogo from './assets/packetrove-logo-160x160.png';
import { CidrCoverTool } from './CidrCoverTool';
import { PublicIpTool } from './PublicIpTool';

export function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const ipPage = path === '/ip' || path === '/ip.html';
  const cidrPage = path === '/' || path === '/index.html';
  const pageTitle = ipPage ? 'My Public IP' : cidrPage ? 'Smallest Covering CIDR' : 'Page not found';
  const repository = import.meta.env.VITE_GITHUB_REPOSITORY || 'euyuil/packetrove';
  const commit = import.meta.env.VITE_GIT_COMMIT;
  const sourceUrl = `https://github.com/${repository}${commit ? `/tree/${commit}` : ''}`;
  useEffect(() => {
    document.title = `${pageTitle} — Packetrove`;
  }, [pageTitle]);

  return <div className="site">
    <header className="site-header">
      <a className="brand" href="/" aria-label="Packetrove home">
        <img className="brand-mark" src={packetroveLogo} width="40" height="40" alt="" />Packetrove
      </a>
      <a className="api-link" href="/api/openapi.json">API specification <span aria-hidden="true">↗</span></a>
    </header>
    <nav className="tool-navigation" aria-label="Network tools">
      <a href="/" aria-current={cidrPage ? 'page' : undefined}>Smallest Covering CIDR</a>
      <a href="/ip" aria-current={ipPage ? 'page' : undefined}>My Public IP</a>
    </nav>
    <main>{ipPage ? <PublicIpTool /> : cidrPage ? <CidrCoverTool /> : <section className="intro">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p className="intro-description">The page you requested does not exist.</p>
      <p><a href="/">Return to home</a></p>
    </section>}</main>
    <footer>
      <div>Packetrove <span aria-hidden="true">·</span> Network tools for humans and agents</div>
      <a className="source-link" href={sourceUrl} target="_blank" rel="noopener noreferrer"
        title={commit ? `View source for commit ${commit} on GitHub` : 'View Packetrove on GitHub'}>
        GitHub{commit && <><span aria-hidden="true">·</span>{' '}<code>{commit.slice(0, 7)}</code></>}
      </a>
    </footer>
  </div>;
}
