import type { InputIssueDetail } from './errors';

export type IpInputIssueDetail = (
  | { reason: 'INVALID_INPUT' | 'INVALID_ADDRESS' | 'EMPTY_INPUTS' }
  | { reason: 'TOO_MANY_INPUTS' | 'INPUT_TOO_LONG' | 'TOO_MANY_OUTPUTS'; limit: number }
  | { reason: 'EXPECTED_FAMILY'; family: 'ipv4' | 'ipv6' }
) & Pick<InputIssueDetail, 'list' | 'field'>;

/** Validate local interpolation data before a generic error reaches an IP view. */
export function isIpInputIssueDetail(detail: unknown): detail is IpInputIssueDetail {
  if (!detail || typeof detail !== 'object' || !('reason' in detail)) return false;
  if ('list' in detail && detail.list !== undefined && typeof detail.list !== 'string') return false;
  if ('field' in detail && detail.field !== undefined && typeof detail.field !== 'string') return false;
  switch (detail.reason) {
    case 'INVALID_INPUT': case 'INVALID_ADDRESS': case 'EMPTY_INPUTS': return true;
    case 'TOO_MANY_INPUTS': case 'INPUT_TOO_LONG': case 'TOO_MANY_OUTPUTS':
      return 'limit' in detail && typeof detail.limit === 'number' && Number.isFinite(detail.limit) && detail.limit >= 0;
    case 'EXPECTED_FAMILY':
      return 'family' in detail && (detail.family === 'ipv4' || detail.family === 'ipv6');
    default: return false;
  }
}
