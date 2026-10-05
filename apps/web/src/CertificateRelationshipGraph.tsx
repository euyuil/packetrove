import { useEffect, useRef } from 'react';
import { Box, ScrollArea, Text } from '@mantine/core';
import { useMergedRef, useResizeObserver } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import type { CertificateBundleResult } from '@packetrove/contracts';

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

export function CertificateRelationshipGraph({ result }: { result: CertificateBundleResult }) {
  const { t } = useTranslation();
  const viewport = useRef<HTMLDivElement>(null);
  const [observeViewport, viewportBounds] = useResizeObserver<HTMLDivElement>();
  const viewportRef = useMergedRef(viewport, observeViewport);
  useEffect(() => {
    const element = viewport.current;
    if (element) element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
  }, [viewport, viewportBounds.width]);
  const commonName = (name: string | null) => name || t($ => $.certificate.noCommonName);
  const count = result.certificates.length;
  const labels = result.certificates.map(certificate => labelLines(`#${certificate.index + 1} ${commonName(certificate.commonName)}`));
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
    <ScrollArea type="auto" scrollbars="x" offsetScrollbars="present" viewportRef={viewportRef}
      viewportProps={{ tabIndex: 0, role: 'region', 'aria-label': t($ => $.certificate.graphLabel) }}>
      <Box component="svg" viewBox={`0 0 640 ${height}`} w={640} role="img"
        aria-label={t($ => $.certificate.graphLabel)}>
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
          <title>#{certificate.index + 1} {commonName(certificate.commonName)}</title>
          <rect x={x - nodeWidth / 2} y={y - nodeHeight / 2} width={nodeWidth} height={nodeHeight} rx={12}
            fill={certificate.ca ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-violet-0)'}
            stroke={result.selectedLeafIndex === certificate.index ? positive : 'var(--mantine-color-gray-5)'} strokeWidth={2} />
          <text textAnchor="middle" fontFamily="sans-serif" fontWeight={700} fontSize={15} fill="var(--mantine-color-gray-9)">
            {lines.map((line, index) => <tspan key={index} x={x} y={y - nodeHeight / 2 + 22 + index * 20}>{line}</tspan>)}
          </text>
          <text x={x} y={y + nodeHeight / 2 - 10} textAnchor="middle" fontFamily="sans-serif" fontSize={12}
            fill="var(--mantine-color-gray-7)">{t($ => certificate.ca ? $.certificate.ca : $.certificate.nonCa)}</text>
        </g>)}
      </Box>
    </ScrollArea>
    <Text size="xs" c="dimmed">{t($ => $.certificate.graphHelp)}</Text>
    <Text size="xs" c="dimmed" hiddenFrom="sm">{t($ => $.certificate.graphScrollHelp)}</Text>
  </Box>;
}
