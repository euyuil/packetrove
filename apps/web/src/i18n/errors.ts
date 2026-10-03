import type { TFunction } from 'i18next';
import type { ErrorCode, InputIssue } from '@packetrove/contracts';
import type { InputIssueDetail, ToolError } from '@packetrove/core';
import type { Locale } from './routes';

export function errorMessage(error: ToolError, t: TFunction, locale: Locale) {
  if (locale === 'en') return error.message;
  const messages = {
    INVALID_INPUT: t($ => $.errors.invalidInput), MIXED_ADDRESS_FAMILIES: t($ => $.errors.mixedFamilies),
    INVALID_JSON: t($ => $.errors.invalidJson), PAYLOAD_TOO_LARGE: t($ => $.errors.payloadTooLarge),
    UNSUPPORTED_MEDIA_TYPE: t($ => $.errors.unsupportedMediaType), NOT_FOUND: t($ => $.errors.notFound),
    METHOD_NOT_ALLOWED: t($ => $.errors.methodNotAllowed), INTERNAL_ERROR: t($ => $.errors.internal),
    CLIENT_IP_UNAVAILABLE: t($ => $.errors.ipUnavailable), NETWORK_ERROR: t($ => $.errors.network),
    INVALID_RESPONSE: t($ => $.errors.invalidResponse),
  } satisfies Record<ErrorCode, string>;
  return messages[error.code];
}

export function issueMessage(issue: InputIssue, detail: InputIssueDetail | undefined, t: TFunction, locale: Locale) {
  if (locale === 'en') return issue.message;
  switch (detail?.reason) {
    case 'INVALID_ADDRESS': return t($ => $.errors.invalidAddress);
    case 'EMPTY_ENDPOINT': return t($ => $.range.emptyEndpoint);
    case 'INVALID_ENDPOINT': return t($ => $.range.invalidEndpoint);
    case 'ENDPOINT_CIDR': return t($ => $.range.endpointCidr);
    case 'REVERSED_RANGE': return t($ => $.range.reversedRange);
    case 'EMPTY_INPUTS': return t($ => $.errors.emptyInputs);
    case 'TOO_MANY_INPUTS': return t($ => $.errors.tooManyInputs, { limit: detail.limit });
    case 'INPUT_TOO_LONG': return t($ => $.errors.inputTooLong, { limit: detail.limit });
    case 'TOO_MANY_OUTPUTS': return t($ => $.errors.tooManyOutputs, { limit: detail.limit });
    case 'EXPECTED_FAMILY': return t($ => detail.field ? $.range.expectedFamily : $.errors.expectedFamily,
      { family: detail.family === 'ipv4' ? 'IPv4' : 'IPv6' });
    default: return t($ => $.errors.invalidInput);
  }
}
