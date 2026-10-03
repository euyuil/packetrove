import { AUTOMATION_RUN_ID_HEADER, AUTOMATION_TOKEN_HEADER, isAutomationRunId, isAutomationToken } from './automation-headers';

export type AutomationBindings = { PACKETROVE_AUTOMATION_TOKEN?: string };
export type McpTrafficSource = { traffic_source: 'public_call' }
  | { traffic_source: 'automated_check'; automation_run_id?: string };

export function getMcpTrafficSource(request: Request | undefined, configuredToken: unknown): McpTrafficSource {
  const publicCall: McpTrafficSource = { traffic_source: 'public_call' };
  const suppliedToken = request?.headers.get(AUTOMATION_TOKEN_HEADER);
  if (!isAutomationToken(configuredToken) || !isAutomationToken(suppliedToken)) return publicCall;
  try {
    const encoder = new TextEncoder();
    if (!crypto.subtle.timingSafeEqual(encoder.encode(configuredToken), encoder.encode(suppliedToken))) return publicCall;
    const runId = request?.headers.get(AUTOMATION_RUN_ID_HEADER);
    return { traffic_source: 'automated_check', ...(isAutomationRunId(runId) ? { automation_run_id: runId } : {}) };
  } catch {
    // Classification is optional metadata and must never change the tool result.
    return publicCall;
  }
}
