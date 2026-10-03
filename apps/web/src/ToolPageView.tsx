import type { ComponentType, MouseEventHandler } from 'react';
import type { ToolPage } from '@packetrove/contracts';
import { CidrCoverPage } from './CidrCoverTool';
import { CidrSubtractPage } from './CidrSubtractTool';
import { RangeToCidrsPage } from './RangeToCidrsTool';
import { PublicIpTool } from './PublicIpTool';

type ToolViewProps = { onNavigate?: MouseEventHandler<HTMLAnchorElement> };

const toolViews = {
  cidr: CidrCoverPage, subtract: CidrSubtractPage, range: RangeToCidrsPage, ip: PublicIpTool,
} satisfies Record<ToolPage, ComponentType<ToolViewProps>>;

export function ToolPageView({ page, onNavigate }: ToolViewProps & { page: ToolPage }) {
  const View = toolViews[page];
  return <View {...(onNavigate ? { onNavigate } : {})} />;
}
