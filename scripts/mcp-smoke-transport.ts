import { AUTOMATION_RUN_ID_HEADER, AUTOMATION_TOKEN_HEADER, isAutomationRunId, isAutomationToken } from '../apps/worker/src/automation-headers';

export type SmokeAutomation = { token: string; runId: string };

export function readSmokeAutomation(environment: Readonly<Record<string, string | undefined>>): SmokeAutomation | undefined {
  const token = environment.PACKETROVE_AUTOMATION_TOKEN;
  if (!token && environment.GITHUB_ACTIONS !== 'true') return undefined;
  if (!isAutomationToken(token)) {
    throw new Error('Configure PACKETROVE_AUTOMATION_TOKEN as a 64-character lowercase hexadecimal secret for automated smoke checks.');
  }
  const runId = environment.GITHUB_RUN_ID;
  if (!isAutomationRunId(runId)) throw new Error('Automated smoke checks require a valid GITHUB_RUN_ID.');
  return { token, runId };
}

export function createMcpSmokeFetch(endpoint: URL, automation: SmokeAutomation | undefined,
  fetcher: typeof fetch = fetch): typeof fetch {
  const expectedUrl = endpoint.href;
  return async (input, init) => {
    const request = new Request(input, init);
    if (request.url !== expectedUrl) throw new Error('MCP smoke requests must use the configured MCP endpoint.');
    if (automation) {
      request.headers.set(AUTOMATION_TOKEN_HEADER, automation.token);
      request.headers.set(AUTOMATION_RUN_ID_HEADER, automation.runId);
    } else {
      request.headers.delete(AUTOMATION_TOKEN_HEADER);
      request.headers.delete(AUTOMATION_RUN_ID_HEADER);
    }
    // Do not forward the automation credential through a redirect.
    return fetcher(request, { redirect: 'error' });
  };
}
