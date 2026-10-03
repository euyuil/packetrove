import type { ToolDocumentation } from '../tool-presentation-types';

export const ipDocumentation: ToolDocumentation = {
  mcpInputs: t => t($ => $.discovery.ip.inputs),
  mcpResult: t => t($ => $.discovery.ip.result),
};
