import { useRef, useState, type MouseEvent } from 'react';
import { Box, Button, Group, Menu, Popover, Stack, Text } from '@mantine/core';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import UnitedKingdomFlag from 'country-flag-icons/react/3x2/GB';
import ChinaFlag from 'country-flag-icons/react/3x2/CN';
import SpainFlag from 'country-flag-icons/react/3x2/ES';
import GermanyFlag from 'country-flag-icons/react/3x2/DE';
import JapanFlag from 'country-flag-icons/react/3x2/JP';
import FranceFlag from 'country-flag-icons/react/3x2/FR';
import PortugalFlag from 'country-flag-icons/react/3x2/PT';
import RussiaFlag from 'country-flag-icons/react/3x2/RU';
import SouthKoreaFlag from 'country-flag-icons/react/3x2/KR';
import ItalyFlag from 'country-flag-icons/react/3x2/IT';
import { useTranslation } from 'react-i18next';
import { localizedPath, type Locale } from './i18n/routes';
import { locales, supportedLocales } from './i18n/locales';
import { useLanguageSuggestion } from './useLanguageSuggestion';

const flags = {
  GB: UnitedKingdomFlag, CN: ChinaFlag, ES: SpainFlag, DE: GermanyFlag, JP: JapanFlag,
  FR: FranceFlag, PT: PortugalFlag,
  RU: RussiaFlag, KR: SouthKoreaFlag, IT: ItalyFlag,
} satisfies Record<(typeof locales)[Locale]['flag'], typeof UnitedKingdomFlag>;

type LanguageSelectorProps = {
  locale: Locale;
  path: string;
  urlSuffix?: string;
  onOpen: () => void;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function LanguageSelector({ locale, path, urlSuffix = '', onOpen, onNavigate }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const current = locales[locale];
  const trigger = useRef<HTMLButtonElement>(null);
  const suggestionDropdown = useRef<HTMLDivElement>(null);
  const [menuOpened, setMenuOpened] = useState(false);
  const { suggestedLocale, dismissSuggestion } = useLanguageSuggestion();
  const suggestion = suggestedLocale !== locale ? suggestedLocale : null;
  const suggestionText = i18n.getFixedT(suggestion ?? locale);
  const suggestionTitle = suggestionText($ => $.languageSuggestion.title);

  function refreshLink(link: HTMLAnchorElement, language: Locale) {
    // The reference can change the URL again while the menu is open.
    link.href = localizedPath(path, language) + window.location.search + window.location.hash;
  }

  function closeSuggestion() {
    if (suggestionDropdown.current?.contains(document.activeElement)) trigger.current?.focus();
    dismissSuggestion();
  }

  return <Popover opened={suggestion !== null && !menuOpened} onDismiss={closeSuggestion}
    position="bottom-end" width={300} withArrow shadow="md" withinPortal={false}
    withRoles={false} trapFocus={false} returnFocus={false} closeOnClickOutside={false}>
    <Popover.Target>
      <Box>
        <Menu position="bottom-end" width={200} shadow="md" onOpen={() => {
          setMenuOpened(true);
          onOpen();
        }} onClose={() => setMenuOpened(false)}>
          <Menu.Target>
            <Button ref={trigger} size="sm" variant="light" aria-label={`${t($ => $.common.language)}: ${current.name}`}
              leftSection={<Box component={flags[current.flag]} w={21} h={14} aria-hidden="true" />}
              rightSection={<IconChevronDown size={14} aria-hidden="true" />}>
              <span lang={locale}>{current.name}</span>
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {supportedLocales.map(language => {
              const option = locales[language];
              return <Menu.Item key={language} component="a"
                href={localizedPath(path, language) + urlSuffix}
                onPointerDown={event => refreshLink(event.currentTarget, language)}
                onContextMenu={event => refreshLink(event.currentTarget, language)}
                onAuxClick={event => {
                  refreshLink(event.currentTarget, language);
                  if (event.button === 1) dismissSuggestion();
                }}
                onClick={event => {
                  refreshLink(event.currentTarget, language);
                  dismissSuggestion();
                  onNavigate(event);
                }} lang={language} hrefLang={language}
                aria-current={language === locale ? 'true' : undefined}
                leftSection={<Box component={flags[option.flag]} w={21} h={14} aria-hidden="true" />}
                rightSection={language === locale ? <IconCheck size={16} aria-hidden="true" /> : undefined}>
                {option.name}
              </Menu.Item>;
            })}
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Popover.Target>
    <Popover.Dropdown ref={suggestionDropdown} maw="calc(100vw - 2rem)" role="region" aria-label={suggestionTitle}
      lang={suggestion ?? undefined}>
      {suggestion && <Stack gap="sm">
        <Text size="sm" fw={500}>{suggestionTitle}</Text>
        <Group gap="xs">
          <Button component="a" size="xs" href={localizedPath(path, suggestion) + urlSuffix}
            hrefLang={suggestion}
            onPointerDown={event => refreshLink(event.currentTarget, suggestion)}
            onContextMenu={event => refreshLink(event.currentTarget, suggestion)}
            onAuxClick={event => {
              refreshLink(event.currentTarget, suggestion);
              if (event.button === 1) dismissSuggestion();
            }}
            onClick={event => {
              refreshLink(event.currentTarget, suggestion);
              closeSuggestion();
              onNavigate(event);
            }}>
            {suggestionText($ => $.languageSuggestion.switch)}
          </Button>
          <Button size="xs" variant="default" onClick={closeSuggestion}>
            {suggestionText($ => $.languageSuggestion.dismiss)}
          </Button>
        </Group>
      </Stack>}
    </Popover.Dropdown>
  </Popover>;
}
