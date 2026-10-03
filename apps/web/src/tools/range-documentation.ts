import { MAX_INPUT_LENGTH, toolCatalog } from '@packetrove/contracts';
import type { ToolDocumentation } from '../tool-presentation-types';

const result = toolCatalog.range.example.result;
export const rangeDocumentation: ToolDocumentation = {
  mcpInputs: t => t($ => $.discovery.range.inputs, { maximumLength: MAX_INPUT_LENGTH }),
  mcpResult: t => t($ => $.discovery.range.result),
  apiExampleResponse: t => t($ => $.api.rangeResponse, { cidrs: result.cidrs.join(', '), addresses: result.addressCount }),
};
