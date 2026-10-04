import { toolCatalog } from '@packetrove/contracts';
import type { ToolDocumentation } from '../tool-presentation-types';

export const certificateDocumentation: ToolDocumentation = {
  mcpInputs: t => t($ => $.discovery.certificate.inputs),
  mcpResult: t => t($ => $.discovery.certificate.result),
  apiExampleResponse: t => t($ => $.certificate.exampleNote, { time: toolCatalog.certificate.example.result.evaluatedAt }),
};
