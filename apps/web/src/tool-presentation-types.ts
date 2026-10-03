import type { TFunction } from 'i18next';
import type { Locale } from './i18n/locales';

export type ToolDocumentation = {
  mcpInputs: (t: TFunction, locale: Locale) => string;
  mcpResult: (t: TFunction, locale: Locale) => string;
  apiExampleResponse?: (t: TFunction) => string;
  mcpExampleNote?: (t: TFunction) => string;
};
