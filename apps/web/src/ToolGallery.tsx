import { useCallback, useMemo, useRef, useState, type KeyboardEventHandler, type MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title, VisuallyHidden,
} from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import { useReducedMotion } from '@mantine/hooks';
import type { EmblaCarouselType } from 'embla-carousel';
import { IconArrowRight } from '@tabler/icons-react';
import { toolCatalog } from '@packetrove/contracts';
import { localizedPath } from './i18n/routes';
import { resolveLocale } from './i18n/locales';
import { ToolHeading } from './ToolHeading';
import { ToolPreview } from './ToolPreview';

// Curate homepage order without copying tool definitions or examples.
export const featuredTools = [toolCatalog.cidr, toolCatalog.subtract, toolCatalog.range, toolCatalog.ip];
export function ToolGallery({ onNavigate }: { onNavigate: MouseEventHandler<HTMLAnchorElement> }) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
  const carousel = useRef<HTMLDivElement>(null);
  const [embla, setEmbla] = useState<EmblaCarouselType | null>(null);
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const emblaOptions = useMemo(() => ({ align: 'start' as const, loop: false, duration: reducedMotion ? 0 : 25 }), [reducedMotion]);

  const handleSlideChange = useCallback((index: number) => {
    const root = carousel.current;
    // Move focus before React makes the old card inert; controls outside the cards retain focus.
    if (root && embla?.slideNodes().some((slide, slideIndex) =>
      slideIndex !== index && slide.contains(root.ownerDocument.activeElement))) {
      root.focus({ preventScroll: true });
    }
    setActive(index);
  }, [embla]);

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = event => {
    if (!embla || event.target !== event.currentTarget || event.defaultPrevented
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing) return;
    switch (event.key) {
      case 'ArrowRight': event.preventDefault(); embla.scrollNext(); break;
      case 'ArrowLeft': event.preventDefault(); embla.scrollPrev(); break;
      case 'Home': event.preventDefault(); embla.scrollTo(0); break;
      case 'End': event.preventDefault(); embla.scrollTo(embla.scrollSnapList().length - 1); break;
    }
  };

  return <Stack component="section" gap="md" aria-labelledby="tool-gallery-heading">
    <Title order={2} size="h3" id="tool-gallery-heading">{t($ => $.home.galleryTitle)}</Title>
    <Text size="sm" c="dimmed" id="tool-gallery-help">{t($ => $.home.galleryDescription)}</Text>
    <Box miw={0}>
      <Carousel ref={carousel} id="tool-gallery-carousel" className="tool-gallery mantine-focus-auto" role="group"
        aria-roledescription={undefined} aria-labelledby="tool-gallery-heading" aria-describedby="tool-gallery-help tool-gallery-status"
        tabIndex={0} withIndicators withKeyboardEvents={false} onKeyDown={handleKeyDown}
        emblaOptions={emblaOptions} getEmblaApi={setEmbla} onSlideChange={handleSlideChange}
        previousControlProps={{ 'aria-label': t($ => $.home.galleryPrevious) }}
        nextControlProps={{ 'aria-label': t($ => $.home.galleryNext) }}
        attributes={{ indicators: { 'aria-labelledby': 'tool-gallery-heading' } }}
        getIndicatorProps={index => ({
          'aria-label': t($ => $.home.galleryPosition, { current: index + 1, total: featuredTools.length })
            + ' · ' + t($ => $[featuredTools[index]!.page].title),
        })}
        styles={{
          viewport: {
            overflowX: embla ? 'hidden' : 'auto', scrollSnapType: embla ? undefined : 'x mandatory',
            overscrollBehaviorX: 'contain', touchAction: embla ? 'pan-y pinch-zoom' : 'auto',
          },
          slide: { display: 'flex', minWidth: 0, scrollSnapAlign: 'start' },
          indicator: { backgroundColor: 'var(--mantine-primary-color-filled)' },
        }}>
        {featuredTools.map((tool, index) => <Carousel.Slide key={tool.id} aria-roledescription={undefined}
          aria-label={t($ => $[tool.page].title)} aria-hidden={embla && active !== index ? true : undefined}
          inert={embla && active !== index ? true : undefined}>
          <Paper component="article" withBorder px={48} pt={{ base: 'lg', sm: 'xl' }} pb={48} w="100%"
            data-tool-id={tool.id} aria-labelledby={'home-' + tool.page + '-heading'}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
              <Stack gap="md">
                <ToolHeading tool={tool.page} order={3} size="h2" id={'home-' + tool.page + '-heading'} />
                <Text c="dimmed">{t($ => $.home[`${tool.page}Description`])}</Text>
                <Group>
                  <Button component="a" href={localizedPath(tool.webPath, locale)} onClick={onNavigate}
                    rightSection={<IconArrowRight size={18} aria-hidden="true" />}>
                    {t($ => $.home[`${tool.page}Link`])}
                  </Button>
                </Group>
              </Stack>
              <ToolPreview tool={tool.page} />
            </SimpleGrid>
          </Paper>
        </Carousel.Slide>)}
      </Carousel>
      <VisuallyHidden id="tool-gallery-status" role="status" aria-live="polite" aria-atomic="true">
        {t($ => $.home.galleryPosition, { current: active + 1, total: featuredTools.length })}
        {' · '}{t($ => $[featuredTools[active]!.page].title)}
      </VisuallyHidden>
    </Box>
  </Stack>;
}
