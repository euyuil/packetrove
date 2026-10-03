import type { toolCatalog, ToolPage } from '@packetrove/contracts';
import type { z } from 'zod';
import { rangeToCidrs, smallestCoveringCidr, subtractCidrs } from '@packetrove/core';
import { getPublicIp } from './ip';
import { assertToolExecutionActive, type ToolExecutionContext } from './tool-context';

export type ToolResult<Page extends ToolPage> = z.output<(typeof toolCatalog)[Page]['outputSchema']>;
export type ToolHandlers = {
  [Page in ToolPage]: (input: unknown, context: ToolExecutionContext) => ToolResult<Page> | Promise<ToolResult<Page>>;
};
export type ToolExecutor = <Page extends ToolPage>(page: Page, input: unknown,
  context: ToolExecutionContext) => Promise<ToolResult<Page>>;

export const toolHandlers = Object.freeze({
  cidr: smallestCoveringCidr,
  subtract: subtractCidrs,
  range: rangeToCidrs,
  ip: (_input, context) => getPublicIp(context.connection),
} satisfies ToolHandlers);

/** API and MCP share one awaited execution boundary and a context for each call. */
export function createToolExecutor(handlers: ToolHandlers): ToolExecutor {
  return async <Page extends ToolPage>(page: Page, input: unknown, context: ToolExecutionContext) => {
    assertToolExecutionActive(context);
    let result: ToolResult<Page>;
    try {
      result = await handlers[page](input, context);
    } catch (error) {
      assertToolExecutionActive(context);
      throw error;
    }
    assertToolExecutionActive(context);
    return result;
  };
}

export const executeTool = createToolExecutor(toolHandlers);
