import { MAX_INPUTS, MAX_INPUT_LENGTH, toolCatalog } from '@packetrove/contracts';
import type { ToolDocumentation } from '../tool-presentation-types';

const result = toolCatalog.cidr.example.result;
export const cidrDocumentation: ToolDocumentation = {
  mcpInputs: (t, locale) => t($ => $.discovery.cidr.inputs, {
    maximumInputs: new Intl.NumberFormat(locale).format(MAX_INPUTS), maximumLength: MAX_INPUT_LENGTH,
  }),
  mcpResult: t => t($ => $.discovery.cidr.result),
  apiExampleResponse: t => t($ => $.api.cidrResponse, { cidr: result.cidr, additional: result.additionalAddressCount }),
  mcpExampleNote: t => t($ => $.cidr.exampleResult, {
    cidr: result.cidr, covered: result.coveredAddressCount, additional: result.additionalAddressCount,
  }),
};
