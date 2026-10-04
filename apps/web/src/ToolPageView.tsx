import type { ComponentType, MouseEventHandler } from 'react';
import type { ToolPage } from '@packetrove/contracts';
import { createResourceCache } from './resource-cache';

type ToolViewProps = { onNavigate?: MouseEventHandler<HTMLAnchorElement> };

const toolViews = createResourceCache<ToolPage, ComponentType<ToolViewProps>>({
  cidr: () => import('./CidrCoverTool').then(module => module.CidrCoverPage),
  subtract: () => import('./CidrSubtractTool').then(module => module.CidrSubtractPage),
  range: () => import('./RangeToCidrsTool').then(module => module.RangeToCidrsPage),
  ip: () => import('./PublicIpTool').then(module => module.PublicIpTool),
  certificate: () => import('./CertificateBundleTool').then(module => module.CertificateBundlePage),
});

export const prepareToolPage = (page: ToolPage) => toolViews.load(page);
export const isToolPagePrepared = (page: ToolPage) => toolViews.has(page);

export function ToolPageView({ page, onNavigate }: ToolViewProps & { page: ToolPage }) {
  const View = toolViews.get(page);
  return <View {...(onNavigate ? { onNavigate } : {})} />;
}
