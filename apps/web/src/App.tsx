import { useEffect } from 'react';
import { CidrCoverTool } from './CidrCoverTool';
import { PublicIpTool } from './PublicIpTool';

export function App() {
  const ipPage = window.location.pathname.replace(/\/+$/, '') === '/ip';
  useEffect(() => {
    document.title = `${ipPage ? 'My Public IP' : 'Smallest Covering CIDR'} — Packetrove`;
  }, [ipPage]);

  return <div className="site">
    <header className="site-header">
      <a className="brand" href="/" aria-label="Packetrove home">
        <span className="brand-mark" aria-hidden="true">P</span>Packetrove
      </a>
      <a className="api-link" href="/api/openapi.json">API specification <span aria-hidden="true">↗</span></a>
    </header>
    <nav className="tool-navigation" aria-label="Network tools">
      <a href="/" aria-current={!ipPage ? 'page' : undefined}>Smallest Covering CIDR</a>
      <a href="/ip" aria-current={ipPage ? 'page' : undefined}>My Public IP</a>
    </nav>
    <main>{ipPage ? <PublicIpTool /> : <CidrCoverTool />}</main>
    <footer>Packetrove <span aria-hidden="true">·</span> Network tools for humans and agents</footer>
  </div>;
}
