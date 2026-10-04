import { Box, Text } from '@mantine/core';
import type { BundleResult } from './checker';

export function RelationshipGraph({ result }: { result: BundleResult }) {
  const count = result.certificates.length;
  const height = count > 8 ? 440 : 330;
  const nodes = result.certificates.map((certificate, index) => {
    const angle = 2 * Math.PI * index / count - Math.PI / 2;
    return { certificate, x: count === 1 ? 320 : 320 + 236 * Math.cos(angle),
      y: count === 1 ? height / 2 : height / 2 + (height / 2 - 54) * Math.sin(angle) };
  });
  const positive = 'var(--mantine-color-violet-7)';
  const negative = 'var(--mantine-color-orange-8)';
  return <Box>
    <Box component="svg" viewBox={`0 0 640 ${height}`} w="100%" role="img"
      aria-label="证书签发关系图。箭头从被签发证书指向候选签发者；原始输入位置见下方表格。">
      <defs>
        {[['verified', positive], ['other', negative]].map(([id, color]) =>
          <marker key={id} id={`arrow-${id}`} viewBox="0 0 10 10" refX={9} refY={5}
            markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>)}
      </defs>
      {result.relationships.map(link => {
        const from = nodes[link.childIndex]!;
        const to = nodes[link.issuerIndex]!;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.hypot(dx, dy);
        const offsetX = dx / distance * 32;
        const offsetY = dy / distance * 32;
        const verified = link.signature === 'verified' && link.issuerEligible && link.keyIdentifierMatch !== false;
        return <line key={`${link.childIndex}-${link.issuerIndex}`} x1={from.x + offsetX} y1={from.y + offsetY}
          x2={to.x - offsetX} y2={to.y - offsetY} stroke={verified ? positive : negative} strokeWidth={2}
          strokeDasharray={verified ? undefined : '6 5'} markerEnd={`url(#arrow-${verified ? 'verified' : 'other'})`} />;
      })}
      {nodes.map(({ certificate, x, y }) => <g key={certificate.index}>
        <circle cx={x} cy={y} r={28} fill={certificate.ca ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-violet-0)'}
          stroke={result.selectedLeafIndex === certificate.index ? positive : 'var(--mantine-color-gray-5)'} strokeWidth={2} />
        <text x={x} y={y + 5} textAnchor="middle" fontFamily="sans-serif" fontWeight={700} fontSize={15}
          fill="var(--mantine-color-gray-9)">#{certificate.index + 1}</text>
        <text x={x} y={y + 46} textAnchor="middle" fontFamily="sans-serif" fontSize={13}
          fill="var(--mantine-color-gray-7)">{certificate.ca ? 'CA 证书' : '非 CA 证书'}</text>
      </g>)}
    </Box>
    <Text size="xs" c="dimmed">箭头：被签发证书 → 候选签发者。实线表示签名与本地签发约束通过，虚线表示未通过或未完成检查。自签名结果见证书详情。</Text>
  </Box>;
}
