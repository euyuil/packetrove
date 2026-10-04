import 'reflect-metadata';
import { Box, Text } from '@mantine/core';
import { Name } from '@peculiar/x509';
import type { BundleResult } from './checker';

const nodeWidth = 220;

function labelLines(label: string) {
  const lines: string[] = [];
  let line = '';
  let width = 0;
  for (const character of label) {
    const characterWidth = character.charCodeAt(0) > 127 ? 2 : 1;
    if (width + characterWidth > 26) { lines.push(line); line = ''; width = 0; }
    line += character;
    width += characterWidth;
  }
  if (line) lines.push(line);
  return lines;
}

function commonName(subject: string) {
  try { return new Name(subject).getField('CN').join(' / ') || '未提供 CN'; }
  catch { return '未提供 CN'; }
}

export function RelationshipGraph({ result }: { result: BundleResult }) {
  const count = result.certificates.length;
  const labels = result.certificates.map(certificate => labelLines(`#${certificate.index + 1} ${commonName(certificate.subject)}`));
  const nodeHeight = Math.max(...labels.map(lines => lines.length * 20 + 34));
  const grid = count > 6;
  const radiusY = Math.max(110, (nodeHeight + 16) / (1 - Math.cos(2 * Math.PI / Math.max(2, count))));
  const height = grid ? Math.ceil(count / 2) * (nodeHeight + 44) + 32 : 2 * radiusY + nodeHeight + 48;
  const nodes = result.certificates.map((certificate, index) => {
    const angle = 2 * Math.PI * index / count - Math.PI / 2;
    return { certificate, lines: labels[index]!,
      x: grid ? 170 + index % 2 * 300 : count === 1 ? 320 : 320 + 200 * Math.cos(angle),
      y: grid ? 32 + nodeHeight / 2 + Math.floor(index / 2) * (nodeHeight + 44) : count === 1 ? height / 2 : height / 2 + radiusY * Math.sin(angle) };
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
        // End arrows at the rectangle boundary, including diagonal links.
        const scale = Math.min((nodeWidth / 2 + 4) / Math.abs(dx), (nodeHeight / 2 + 4) / Math.abs(dy));
        const offsetX = dx * scale;
        const offsetY = dy * scale;
        const verified = link.signature === 'verified' && link.issuerEligible && link.keyIdentifierMatch !== false;
        return <line key={`${link.childIndex}-${link.issuerIndex}`} x1={from.x + offsetX} y1={from.y + offsetY}
          x2={to.x - offsetX} y2={to.y - offsetY} stroke={verified ? positive : negative} strokeWidth={2}
          strokeDasharray={verified ? undefined : '6 5'} markerEnd={`url(#arrow-${verified ? 'verified' : 'other'})`} />;
      })}
      {nodes.map(({ certificate, lines, x, y }) => <g key={certificate.index}>
        <title>#{certificate.index + 1} {commonName(certificate.subject)}</title>
        <rect x={x - nodeWidth / 2} y={y - nodeHeight / 2} width={nodeWidth} height={nodeHeight} rx={12}
          fill={certificate.ca ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-violet-0)'}
          stroke={result.selectedLeafIndex === certificate.index ? positive : 'var(--mantine-color-gray-5)'} strokeWidth={2} />
        <text textAnchor="middle" fontFamily="sans-serif" fontWeight={700} fontSize={15} fill="var(--mantine-color-gray-9)">
          {lines.map((line, index) => <tspan key={index} x={x} y={y - nodeHeight / 2 + 22 + index * 20}>{line}</tspan>)}
        </text>
        <text x={x} y={y + nodeHeight / 2 - 10} textAnchor="middle" fontFamily="sans-serif" fontSize={12}
          fill="var(--mantine-color-gray-7)">{certificate.ca ? 'CA 证书' : '非 CA 证书'}</text>
      </g>)}
    </Box>
    <Text size="xs" c="dimmed">箭头：被签发证书 → 候选签发者。实线表示签名与本地签发约束通过，虚线表示未通过或未完成检查。自签名结果见证书详情。</Text>
  </Box>;
}
