import type { ErrorCode, ErrorResponse, InputIssue } from '@packetrove/contracts';

export type InputIssueDetail = { reason: string; list?: string; field?: string };

export class ToolError<Detail extends InputIssueDetail = InputIssueDetail> extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly issues?: InputIssue[],
    // Local presentation details follow the issues array and are omitted from toResponse().
    public readonly details?: Detail[],
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
