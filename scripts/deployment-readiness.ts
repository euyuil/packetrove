const WAIT_BUDGET_MS = 90_000;
const POLL_INTERVAL_MS = 5_000;
const REQUEST_TIMEOUT_MS = 15_000;

/** Wait for the public website's bundled source revision before functional checks. */
export async function waitForDeployment(value: string, expectedCommit: string): Promise<void> {
  let target: URL;
  try { target = new URL(value); } catch { throw new Error('Use an HTTP or HTTPS origin.'); }
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password
    || target.pathname !== '/' || target.search || target.hash) {
    throw new Error('Use an HTTP or HTTPS origin without credentials, a path, query, or fragment.');
  }
  if (!/^[0-9a-f]{40}$/i.test(expectedCommit)) {
    throw new Error('Set VITE_GIT_COMMIT to the expected full Git commit SHA.');
  }

  const deadline = performance.now() + WAIT_BUDGET_MS;
  const budget = new AbortController();
  const budgetTimer = setTimeout(() => budget.abort(), WAIT_BUDGET_MS);

  async function readText(url: URL, contentType: string): Promise<string | null> {
    const remaining = deadline - performance.now();
    if (remaining <= 0) return null;
    const request = new AbortController();
    const requestTimer = setTimeout(() => request.abort(), Math.min(REQUEST_TIMEOUT_MS, remaining));
    try {
      const response = await fetch(url, {
        cache: 'no-store', credentials: 'omit', redirect: 'error',
        signal: AbortSignal.any([budget.signal, request.signal]),
      });
      if (response.status !== 200 || !response.headers.get('content-type')?.includes(contentType)) {
        await response.body?.cancel();
        return null;
      }
      return await response.text();
    } finally {
      clearTimeout(requestTimer);
    }
  }

  try {
    while (performance.now() < deadline) {
      try {
        const html = await readText(target, 'text/html');
        if (html) {
          const scripts = Array.from(html.matchAll(/src="(\/assets\/[A-Za-z0-9_.-]+\.js)"/g), match => match[1]!);
          for (const path of scripts) {
            const javascript = await readText(new URL(path, target), 'javascript');
            if (javascript?.includes(expectedCommit) && performance.now() < deadline) return;
          }
        }
      } catch {
        // A transient request or body-read failure stays within the same wait budget.
      }
      const remaining = deadline - performance.now();
      if (remaining <= 0) break;
      await new Promise<void>(resolve => setTimeout(resolve, Math.min(POLL_INTERVAL_MS, remaining)));
    }
    throw new Error('The expected website version was not ready within 90 seconds. Production checks were not run.');
  } finally {
    clearTimeout(budgetTimer);
  }
}
