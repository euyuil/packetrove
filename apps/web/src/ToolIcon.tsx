import { IconArrowsMinimize, IconLayersSubtract, IconWorld, IconListNumbers, IconCertificate } from '@tabler/icons-react';

const toolIcons = {
  cidr: IconArrowsMinimize,
  subtract: IconLayersSubtract,
  range: IconListNumbers,
  ip: IconWorld,
  certificate: IconCertificate,
};

export function ToolIcon({ tool, size = 20 }: { tool: keyof typeof toolIcons; size?: number }) {
  const Icon = toolIcons[tool];
  return <Icon size={size} stroke={1.75} aria-hidden="true" focusable="false" />;
}
