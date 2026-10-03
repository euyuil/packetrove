import type { CidrCoverResult, CidrSubtractResult, PublicIpResult, RangeToCidrsResult, ToolPage } from '@packetrove/contracts';
import { rangeToCidrs, smallestCoveringCidr, subtractCidrs } from '@packetrove/core';
import { getPublicIp } from './ip';

const handlers: Record<ToolPage, (input: unknown, headers?: Headers) => CidrCoverResult | CidrSubtractResult | PublicIpResult | RangeToCidrsResult> = {
  cidr: smallestCoveringCidr,
  subtract: subtractCidrs,
  range: rangeToCidrs,
  ip: (_input, headers) => getPublicIp(headers),
};

/** API and MCP use the same handlers with metadata from the current request. */
export function executeTool(page: ToolPage, input: unknown, headers?: Headers) {
  return handlers[page](input, headers);
}
