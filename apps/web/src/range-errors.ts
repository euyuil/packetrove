import type { TFunction } from 'i18next';
import type { InputIssue } from '@packetrove/contracts';
import { isIpInputIssueDetail, type InputIssueDetail } from '@packetrove/core';
import type { Locale } from './i18n/locales';
import { issueMessage } from './i18n/errors';

/** Range-specific guidance belongs to the range view, not the shared renderer. */
export function rangeIssueMessage(issue: InputIssue, detail: InputIssueDetail | undefined, t: TFunction, locale: Locale) {
  if (locale === 'en') return issue.message;
  switch (detail?.reason) {
    case 'EMPTY_ENDPOINT': return t($ => $.range.emptyEndpoint);
    case 'INVALID_ENDPOINT': return t($ => $.range.invalidEndpoint);
    case 'ENDPOINT_CIDR': return t($ => $.range.endpointCidr);
    case 'REVERSED_RANGE': return t($ => $.range.reversedRange);
    case 'EXPECTED_FAMILY':
      if (isIpInputIssueDetail(detail) && detail.reason === 'EXPECTED_FAMILY') {
        return t($ => $.range.expectedFamily, { family: detail.family === 'ipv4' ? 'IPv4' : 'IPv6' });
      }
  }
  return issueMessage(issue, detail, t, locale);
}
