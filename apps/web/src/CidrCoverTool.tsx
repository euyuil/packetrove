import { useState, type FormEvent } from 'react';
import { CIDR_COVER_EXAMPLES, MAX_INPUTS, type CidrCoverResult, type ErrorResponse } from '@packetrove/contracts';
import { smallestCoveringCidr, ToolError } from '@packetrove/core';

function inputRows(text: string) {
  return text.split(/\r?\n/).map((value, index) => ({ value: value.trim(), line: index + 1 }))
    .filter(row => row.value.length > 0);
}

function formatCount(count: string) {
  return BigInt(count).toLocaleString('en-US');
}

export function CidrCoverTool() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<CidrCoverResult | null>(null);
  const [error, setError] = useState<ErrorResponse['error'] | null>(null);
  const [copyMessage, setCopyMessage] = useState('');
  const rows = inputRows(input);

  function replaceInput(value: string) {
    setInput(value);
    setResult(null);
    setError(null);
    setCopyMessage('');
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopyMessage('');
    try {
      setResult(smallestCoveringCidr({ inputs: rows.map(row => row.value) }));
      setError(null);
    } catch (failure) {
      setResult(null);
      setError(failure instanceof ToolError ? failure.toResponse().error : {
        code: 'INTERNAL_ERROR', message: 'Unable to calculate this input. Please try again.',
      });
    }
  }

  async function copyCidr() {
    if (!result) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable');
      await navigator.clipboard.writeText(result.cidr);
      setCopyMessage('CIDR copied.');
    } catch {
      setCopyMessage('Copy is unavailable. Select and copy the CIDR above.');
    }
  }

  return (
    <>
        <section className="intro" aria-labelledby="tool-title">
          <p className="eyebrow">IP ADDRESS TOOLS</p>
          <h1 id="tool-title">Smallest Covering CIDR</h1>
          <p className="intro-description">Combine IPv4 or IPv6 addresses and ranges into the smallest single CIDR that covers them all.</p>
          <p className="local-badge"><span aria-hidden="true" className="status-dot" />Calculated in your browser · No API request</p>
        </section>
        <div className="workspace">
          <section className="panel input-panel" aria-labelledby="input-heading">
            <div className="panel-heading">
              <h2 id="input-heading">Your addresses</h2>
              <span className="subtle">IPv4 / IPv6</span>
            </div>
            <form onSubmit={calculate}>
              <label htmlFor="addresses">IP addresses or CIDR ranges</label>
              <p id="input-help" className="help-text">One entry per line. Use one address family per calculation. Up to {MAX_INPUTS.toLocaleString('en-US')} entries.</p>
              <textarea id="addresses" value={input} spellCheck={false} autoCapitalize="off"
                autoCorrect="off" aria-invalid={error !== null}
                aria-describedby={error ? 'input-help input-error' : 'input-help'}
                placeholder={'203.0.113.1\n203.0.113.2\n203.0.113.6'}
                onChange={event => replaceInput(event.target.value)} />
              <div className="input-meta">
                <span>{rows.length.toLocaleString('en-US')} {rows.length === 1 ? 'entry' : 'entries'}</span>
                <button type="button" className="text-button" onClick={() => replaceInput('')} disabled={!input}>Clear</button>
              </div>
              <div className="examples">
                <span className="subtle">Try an example</span>
                <button type="button" className="example-button" onClick={() => replaceInput(CIDR_COVER_EXAMPLES[1]!.request.inputs.join('\n'))}>IPv4</button>
                <button type="button" className="example-button" onClick={() => replaceInput(CIDR_COVER_EXAMPLES[2]!.request.inputs.join('\n'))}>IPv6</button>
              </div>
              {error && <div id="input-error" className="error-box" role="alert">
                <strong>{error.message}</strong>
                {error.issues && <ul>{error.issues.map((issue, index) => <li key={index}>
                  {issue.index === undefined ? '' : `Line ${rows[issue.index]?.line ?? issue.index + 1}: `}{issue.message}
                </li>)}</ul>}
              </div>}
              <button className="primary-button" type="submit">Calculate covering CIDR <span aria-hidden="true">→</span></button>
            </form>
          </section>
          <section className="panel result-panel" aria-labelledby="result-heading">
            <div className="panel-heading">
              <h2 id="result-heading">Coverage result</h2>
              {result && <span className="family-badge">{result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</span>}
            </div>
            {result ? <div aria-live="polite">
              <p className="result-label">SMALLEST COVERING CIDR</p>
              <div className="cidr-row"><code className="cidr-value">{result.cidr}</code>
                <button type="button" className="copy-button" onClick={copyCidr}>Copy CIDR</button></div>
              <p className="copy-status" role="status">{copyMessage}</p>
              <dl className="address-range"><div><dt>First address</dt><dd>{result.range.first}</dd></div>
                <div><dt>Last address</dt><dd>{result.range.last}</dd></div></dl>
              <dl className="counts">
                <div><dt>Unique input addresses</dt><dd>{formatCount(result.inputAddressCount)}</dd></div>
                <div><dt>Covered addresses</dt><dd>{formatCount(result.coveredAddressCount)}</dd></div>
                <div className="additional-count"><dt>Additional addresses</dt><dd>{formatCount(result.additionalAddressCount)}</dd></div>
              </dl>
              <p className={`coverage-note ${result.additionalAddressCount === '0' ? 'exact' : 'expanded'}`}>
                {result.additionalAddressCount === '0'
                  ? 'Exact coverage: this CIDR adds no addresses.'
                  : `This CIDR adds ${formatCount(result.additionalAddressCount)} addresses. Applying it expands the addresses allowed or blocked by your list.`}
              </p>
              <details className="normalized-inputs"><summary>Normalized inputs ({result.normalizedInputs.length})</summary>
                <ol>{result.normalizedInputs.map((entry, index) => <li key={index}><code>{entry}</code></li>)}</ol>
              </details>
            </div> : <div className="empty-result">
              <span className="empty-symbol" aria-hidden="true">/n</span>
              <h3>Your result will appear here</h3>
              <p>Enter your addresses to see their covering CIDR, address range, and any extra coverage.</p>
            </div>}
          </section>
        </div>
        <section className="explanation" aria-labelledby="explanation-heading">
          <h2 id="explanation-heading">Understand the coverage</h2>
          <p>The longest possible prefix gives the smallest single covering range. That range can include addresses outside your original entries. Overlapping entries are counted once, and CIDRs with host bits are normalized.</p>
          <p>Counts include every address in a range, including network and broadcast addresses. Review additional coverage before using a result in an allowlist or blocklist.</p>
        </section>
    </>
  );
}
