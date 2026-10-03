import { describe, expect, it } from 'vitest';
import { ErrorResponseSchema } from '@packetrove/contracts';
import { ToolError } from './errors';
import { isIpInputIssueDetail } from './ip-input-errors';

describe('tool-owned error details', () => {
  it('keeps arbitrary typed presentation details out of the public response', () => {
    const issues = [{ path: ['records', 1, 'hostname'], message: 'Use a supported hostname.' }];
    const error = new ToolError<{ reason: 'UNSUPPORTED_HOSTNAME'; hostname: string }>(
      'INVALID_INPUT', 'Invalid input.', issues, [{ reason: 'UNSUPPORTED_HOSTNAME', hostname: 'example.invalid' }],
    );
    expect(error.details?.[0]?.hostname).toBe('example.invalid');
    expect(error.toResponse()).toEqual({ error: { code: 'INVALID_INPUT', message: 'Invalid input.', issues } });
    expect(ErrorResponseSchema.parse(error.toResponse())).toEqual(error.toResponse());
  });
  it('requires valid interpolation values before recognizing shared IP reasons', () => {
    expect(isIpInputIssueDetail({ reason: 'TOO_MANY_INPUTS', limit: 1000 })).toBe(true);
    expect(isIpInputIssueDetail({ reason: 'EXPECTED_FAMILY', family: 'ipv6' })).toBe(true);
    for (const detail of [undefined, { reason: 'TOO_MANY_INPUTS' },
      { reason: 'TOO_MANY_INPUTS', limit: NaN }, { reason: 'TOO_MANY_INPUTS', limit: -1 },
      { reason: 'EXPECTED_FAMILY', family: 'unknown' }, { reason: 'UNSUPPORTED_HOSTNAME' }]) {
      expect(isIpInputIssueDetail(detail)).toBe(false);
    }
  });
});
