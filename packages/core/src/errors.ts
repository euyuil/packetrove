import type { ErrorCode, ErrorResponse, InputIssue } from '@packetrove/contracts';

export type InputIssueDetail = (
  | { reason: 'INVALID_INPUT' | 'INVALID_ADDRESS' | 'EMPTY_INPUTS' }
  | { reason: 'TOO_MANY_INPUTS' | 'INPUT_TOO_LONG' | 'TOO_MANY_OUTPUTS'; limit: number }
  | { reason: 'EXPECTED_FAMILY'; family: 'ipv4' | 'ipv6' }
) & { list?: 'include' | 'exclude' };

export class ToolError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly issues?: InputIssue[],
    // Local presentation details follow the issues array and are omitted from toResponse().
    public readonly details?: InputIssueDetail[],
  ) {
    super(message);
    this.name = 'ToolError';
  }

  toResponse(): ErrorResponse {
    return { error: {
      code: this.code, message: this.message,
      ...(this.issues ? { issues: this.issues } : {}),
    } };
  }
}
