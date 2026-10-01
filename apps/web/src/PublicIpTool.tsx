import { useCallback, useEffect, useRef, useState } from 'react';
import { PUBLIC_IP_PATH, type PublicIpResult } from '@packetrove/contracts';
import { lookupPublicIp, ToolError } from '@packetrove/core';
import { useClipboardFeedback } from './useClipboardFeedback';

export function PublicIpTool() {
  const [result, setResult] = useState<PublicIpResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { copyMessage, clearCopyMessage, copyText } = useClipboardFeedback();
  const activeRequest = useRef<AbortController | null>(null);

  const lookup = useCallback(async () => {
    activeRequest.current?.abort();
    const request = new AbortController();
    activeRequest.current = request;
    setLoading(true);
    setResult(null);
    setError('');
    clearCopyMessage();
    try {
      const current = await lookupPublicIp(PUBLIC_IP_PATH, request.signal);
      if (!request.signal.aborted) setResult(current);
    } catch (failure) {
      if (!request.signal.aborted) {
        setError(failure instanceof ToolError ? failure.message : 'Unable to check your IP. Please try again.');
      }
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, [clearCopyMessage]);

  useEffect(() => {
    void lookup();
    return () => activeRequest.current?.abort();
  }, [lookup]);

  function copyIp() {
    if (!result) return;
    void copyText(result.ip, 'IP address copied.', 'Copy is unavailable. Select and copy the IP address above.');
  }

  return <>
    <section className="intro" aria-labelledby="tool-title">
      <p className="eyebrow">IP ADDRESS TOOLS</p>
      <h1 id="tool-title">My Public IP</h1>
      <p className="intro-description">See the public IP address used by your current connection to Packetrove.</p>
      <p className="local-badge"><span aria-hidden="true" className="status-dot" />Checked online · Not stored by the application</p>
    </section>
    <section className="panel ip-panel" aria-labelledby="ip-result-heading" aria-busy={loading}>
      <div className="panel-heading">
        <h2 id="ip-result-heading">Your current connection</h2>
        {result && <span className="family-badge">{result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</span>}
      </div>
      <div className="ip-result" aria-live="polite">
        {loading && <p className="ip-loading">Checking your public IP…</p>}
        {error && <p className="error-box" role="alert">{error}</p>}
        {result && <>
          <p className="result-label">PUBLIC IP ADDRESS</p>
          <div className="cidr-row">
            <code className="ip-value">{result.ip}</code>
            <button type="button" className="copy-button" onClick={copyIp}>Copy IP</button>
          </div>
        </>}
      </div>
      <p className="copy-status" role="status">{copyMessage}</p>
      <button type="button" className="primary-button" onClick={() => void lookup()} disabled={loading}>
        {loading ? 'Checking…' : error ? 'Try again' : 'Refresh IP'}<span aria-hidden="true">↻</span>
      </button>
    </section>
    <section className="explanation" aria-labelledby="explanation-heading">
      <h2 id="explanation-heading">What this address tells you</h2>
      <p>This is the address seen by Packetrove for this request. If you use a VPN or proxy, it is the exit address. Your browser and command-line tools can use different network paths.</p>
      <p>A connection uses either IPv4 or IPv6. This check shows that address; it does not discover both families or your private local address. Refresh after changing networks or proxy settings.</p>
    </section>
  </>;
}
