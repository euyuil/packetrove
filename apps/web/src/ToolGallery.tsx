import { useRef, useState, type KeyboardEvent, type MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionIcon, Badge, Button, Code, Flex, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title, VisuallyHidden,
} from '@mantine/core';
import { IconArrowRight, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { toolCatalog, type tools } from '@packetrove/contracts';
import { localizedPath } from './i18n/routes';
import { resolveLocale } from './i18n/locales';
import { ToolIcon } from './ToolIcon';

// Curate homepage order without copying tool definitions or examples.
export const featuredTools = [toolCatalog.cidr, toolCatalog.subtract, toolCatalog.ip];
type CatalogTool = (typeof tools)[number];

function ToolPreview({ tool }: { tool: CatalogTool }) {
  const { t, i18n } = useTranslation();
  const format = (value: string) => new Intl.NumberFormat(resolveLocale(i18n.resolvedLanguage)).format(BigInt(value));
  return <Paper withBorder p="md" bg="var(--mantine-color-gray-0)" data-tool-preview={tool.id}>
    <Stack gap="sm">
      <Badge size="sm" variant="outline">{t($ => $.home.previewLabel)}</Badge>
      {tool.page === 'cidr' ? <>
        <Text size="xs" c="dimmed">{t($ => $.home.previewInputs)}</Text>
        <Code block>{tool.example.request.inputs.join('\n')}</Code>
        <Text size="xs" c="dimmed">{t($ => $.cidr.resultLabel)}</Text>
        <Text size="xl" fw={600} className="network-value">{tool.example.result.cidr}</Text>
        <Text size="sm">{t($ => $.cidr.additional)}: {format(tool.example.result.additionalAddressCount)}</Text>
      </> : tool.page === 'subtract' ? <>
        <SimpleGrid cols={2} spacing="sm">
          <Stack gap={4} miw={0}>
            <Text size="xs" c="dimmed">{t($ => $.subtract.includeLabel)}</Text>
            <Text size="sm" className="network-value">{tool.example.request.include.join(', ')}</Text>
          </Stack>
          <Stack gap={4} miw={0}>
            <Text size="xs" c="dimmed">{t($ => $.subtract.excludeLabel)}</Text>
            <Text size="sm" className="network-value">{tool.example.request.exclude.join(', ')}</Text>
          </Stack>
        </SimpleGrid>
        <Text size="xs" c="dimmed">{t($ => $.subtract.blocks)}</Text>
        <Code block>{tool.example.result.cidrs.join('\n')}</Code>
        <Text size="sm">{t($ => $.subtract.remaining)}: {format(tool.example.result.remainingAddressCount)}</Text>
      </> : <>
        <Text size="xs" c="dimmed">{t($ => $.ip.resultLabel)}</Text>
        <Text size="xl" fw={600} className="network-value">{tool.example.result.ip}</Text>
        <Badge variant="light">{tool.example.result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</Badge>
        <Text size="sm" c="dimmed">{t($ => $.home.ipPreview)}</Text>
      </>}
    </Stack>
  </Paper>;
}

export function ToolGallery({ onNavigate }: { onNavigate: MouseEventHandler<HTMLAnchorElement> }) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const viewport = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function show(index: number) {
    const next = Math.max(0, Math.min(featuredTools.length - 1, index));
    const card = viewport.current?.querySelectorAll<HTMLElement>('[data-tool-id]')[next];
    if (!card) return;
    setActive(next);
    viewport.current!.scrollTo({ left: card.offsetLeft, behavior: 'auto' });
  }

  function updatePosition() {
    const element = viewport.current;
    if (!element) return;
    const cards = Array.from(element.querySelectorAll<HTMLElement>('[data-tool-id]'));
    const nearest = cards.reduce((best, card, index) =>
      Math.abs(card.offsetLeft - element.scrollLeft) < Math.abs(cards[best]!.offsetLeft - element.scrollLeft)
        ? index : best, 0);
    setActive(nearest);
  }

  function navigateGallery(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const destination = event.key === 'ArrowRight' ? active + 1 : event.key === 'ArrowLeft' ? active - 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? featuredTools.length - 1 : undefined;
    if (destination === undefined) return;
    event.preventDefault();
    show(destination);
  }

  return <Stack component="section" gap="md" aria-labelledby="tool-gallery-heading">
    <Group justify="space-between" gap="sm">
      <Title order={2} size="h3" id="tool-gallery-heading">{t($ => $.home.galleryTitle)}</Title>
      <Group gap="xs">
        <Text size="sm" c="dimmed" role="status" aria-live="polite" aria-atomic="true">
          {t($ => $.home.galleryPosition, { current: active + 1, total: featuredTools.length })}
          <VisuallyHidden> · {t($ => $[featuredTools[active]!.page].title)}</VisuallyHidden>
        </Text>
        <ActionIcon variant="default" size="lg" aria-label={t($ => $.home.galleryPrevious)}
          aria-controls="tool-gallery-viewport" disabled={active === 0} onClick={() => show(active - 1)}>
          <IconChevronLeft size={20} aria-hidden="true" />
        </ActionIcon>
        <ActionIcon variant="default" size="lg" aria-label={t($ => $.home.galleryNext)}
          aria-controls="tool-gallery-viewport" disabled={active === featuredTools.length - 1} onClick={() => show(active + 1)}>
          <IconChevronRight size={20} aria-hidden="true" />
        </ActionIcon>
      </Group>
    </Group>
    <Text size="sm" c="dimmed" id="tool-gallery-help">{t($ => $.home.galleryDescription)}</Text>
    <Flex ref={viewport} id="tool-gallery-viewport" gap="md" align="stretch" pos="relative" miw={0}
      role="group" aria-labelledby="tool-gallery-heading" aria-describedby="tool-gallery-help" tabIndex={0}
      className="tool-gallery mantine-focus-auto" onScroll={updatePosition} onKeyDown={navigateGallery}>
      {featuredTools.map(tool => <Paper key={tool.id} component="article" withBorder p={{ base: 'lg', sm: 'xl' }}
        w={{ base: 'calc(100% - 28px)', sm: 'calc(100% - 56px)' }} flex="0 0 auto"
        data-tool-id={tool.id} aria-labelledby={'home-' + tool.page + '-heading'}>
        <Stack gap="lg" h="100%">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" style={{ flex: 1 }}>
            <Stack gap="md">
              <ThemeIcon variant="light" size={48}><ToolIcon tool={tool.page} size={28} /></ThemeIcon>
              <Title order={3} size="h2" id={'home-' + tool.page + '-heading'}>{t($ => $[tool.page].title)}</Title>
              <Text c="dimmed">{t($ => $.home[`${tool.page}Description`])}</Text>
            </Stack>
            <ToolPreview tool={tool} />
          </SimpleGrid>
          <Group>
            <Button component="a" href={localizedPath(tool.webPath, locale)} onClick={onNavigate}
              rightSection={<IconArrowRight size={18} aria-hidden="true" />}>
              {t($ => $.home[`${tool.page}Link`])}
            </Button>
          </Group>
        </Stack>
      </Paper>)}
    </Flex>
  </Stack>;
}
