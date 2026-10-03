import type { ErrorCode, ToolId } from '@packetrove/contracts';

export type McpToolExecutionOutcome = { outcome: 'success' }
  | { outcome: 'error'; error_code: ErrorCode };

export function logMcpToolExecution(tool: ToolId, outcome: McpToolExecutionOutcome) {
  try {
    console.log({ event: 'mcp_tool_execution', tool, outcome: outcome.outcome,
      ...(outcome.outcome === 'error' ? { error_code: outcome.error_code } : {}),
    });
  } catch {
    // Logging must not change the tool result or turn a failure into a retry.
  }
}

export function logUnexpectedRequestFailure() {
  try {
    console.error({ event: 'request_failure', error_code: 'INTERNAL_ERROR' });
  } catch {
    // Logging must not replace the original error response.
  }
}
