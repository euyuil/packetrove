import { IconArrowsMinimize, IconLayersSubtract, IconWorld } from '@tabler/icons-react';

const toolIcons = {
  cidr: IconArrowsMinimize,
  subtract: IconLayersSubtract,
  ip: IconWorld,
};

export function ToolIcon({ tool, size = 20 }: { tool: keyof typeof toolIcons; size?: number }) {
  const Icon = toolIcons[tool];
  return <Icon size={size} stroke={1.75} aria-hidden="true" focusable="false" />;
}
