import { MAX_INPUT_LENGTH, MAX_SUBTRACTION_INPUTS, MAX_SUBTRACTION_OUTPUTS, toolCatalog } from '@packetrove/contracts';
import type { ToolDocumentation } from '../tool-presentation-types';

const result = toolCatalog.subtract.example.result;
export const subtractDocumentation: ToolDocumentation = {
  mcpInputs: (t, locale) => t($ => $.discovery.subtract.inputs, {
    maximumInputs: new Intl.NumberFormat(locale).format(MAX_SUBTRACTION_INPUTS), maximumLength: MAX_INPUT_LENGTH,
  }),
  mcpResult: (t, locale) => t($ => $.discovery.subtract.result, {
    maximumOutputs: new Intl.NumberFormat(locale).format(MAX_SUBTRACTION_OUTPUTS),
  }),
  apiExampleResponse: t => t($ => $.api.subtractResponse, { cidrs: result.cidrs.join(', '), remaining: result.remainingAddressCount }),
};
