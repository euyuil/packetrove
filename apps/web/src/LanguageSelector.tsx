import type { MouseEvent } from 'react';
import { Box, Button, Menu } from '@mantine/core';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import UnitedKingdomFlag from 'country-flag-icons/react/3x2/GB';
import ChinaFlag from 'country-flag-icons/react/3x2/CN';
import SpainFlag from 'country-flag-icons/react/3x2/ES';
import GermanyFlag from 'country-flag-icons/react/3x2/DE';
import JapanFlag from 'country-flag-icons/react/3x2/JP';
import { useTranslation } from 'react-i18next';
import { localizedPath, type Locale } from './i18n/routes';
import { locales, supportedLocales } from './i18n/locales';

const flags = {
  GB: UnitedKingdomFlag, CN: ChinaFlag, ES: SpainFlag, DE: GermanyFlag, JP: JapanFlag,
} satisfies Record<(typeof locales)[Locale]['flag'], typeof UnitedKingdomFlag>;

type LanguageSelectorProps = {
  locale: Locale;
  path: string;
  urlSuffix?: string;
  onOpen: () => void;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function LanguageSelector({ locale, path, urlSuffix = '', onOpen, onNavigate }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const current = locales[locale];

  function refreshLink(link: HTMLAnchorElement, language: Locale) {
    // The reference can change the URL again while the menu is open.
    link.href = localizedPath(path, language) + window.location.search + window.location.hash;
  }

  return <Menu position="bottom-end" width={200} shadow="md" onOpen={onOpen}>
    <Menu.Target>
      <Button size="sm" variant="light" aria-label={`${t($ => $.common.language)}: ${current.name}`}
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
          onAuxClick={event => refreshLink(event.currentTarget, language)}
          onClick={event => {
            refreshLink(event.currentTarget, language);
            onNavigate(event);
          }} lang={language} hrefLang={language}
          aria-current={language === locale ? 'true' : undefined}
          leftSection={<Box component={flags[option.flag]} w={21} h={14} aria-hidden="true" />}
          rightSection={language === locale ? <IconCheck size={16} aria-hidden="true" /> : undefined}>
          {option.name}
        </Menu.Item>;
      })}
    </Menu.Dropdown>
  </Menu>;
}
