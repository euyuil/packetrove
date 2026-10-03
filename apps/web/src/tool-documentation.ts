import type { ToolPage } from '@packetrove/contracts';
import type { ToolDocumentation } from './tool-presentation-types';
import { cidrDocumentation } from './tools/cidr-documentation';
import { subtractDocumentation } from './tools/subtract-documentation';
import { rangeDocumentation } from './tools/range-documentation';
import { ipDocumentation } from './tools/ip-documentation';

const toolDocumentation = {
  cidr: cidrDocumentation, subtract: subtractDocumentation, range: rangeDocumentation, ip: ipDocumentation,
} satisfies Record<ToolPage, ToolDocumentation>;

export function getToolDocumentation(tool: ToolPage): ToolDocumentation {
  return toolDocumentation[tool];
}
