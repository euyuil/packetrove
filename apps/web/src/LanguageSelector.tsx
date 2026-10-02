import type { MouseEvent } from 'react';
import { Box, Button, Menu } from '@mantine/core';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import UnitedKingdomFlag from 'country-flag-icons/react/3x2/GB';
import ChinaFlag from 'country-flag-icons/react/3x2/CN';
import SpainFlag from 'country-flag-icons/react/3x2/ES';
import GermanyFlag from 'country-flag-icons/react/3x2/DE';
import JapanFlag from 'country-flag-icons/react/3x2/JP';
import FranceFlag from 'country-flag-icons/react/3x2/FR';
import BrazilFlag from 'country-flag-icons/react/3x2/BR';
import { useTranslation } from 'react-i18next';
import { localizedPath, type Locale } from './i18n/routes';
import { locales, supportedLocales } from './i18n/locales';

const flags = {
  GB: UnitedKingdomFlag, CN: ChinaFlag, ES: SpainFlag, DE: GermanyFlag, JP: JapanFlag,
  FR: FranceFlag, BR: BrazilFlag,
} satisfies Record<(typeof locales)[Locale]['flag'], typeof UnitedKingdomFlag>;

type LanguageSelectorProps = {
  locale: Locale;
  path: string;
  urlSuffix?: string;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function LanguageSelector({ locale, path, urlSuffix = '', onNavigate }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const current = locales[locale];
  return <Menu position="bottom-end" width={200} shadow="md">
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
          onClick={onNavigate} lang={language} hrefLang={language}
          aria-current={language === locale ? 'true' : undefined}
          leftSection={<Box component={flags[option.flag]} w={21} h={14} aria-hidden="true" />}
          rightSection={language === locale ? <IconCheck size={16} aria-hidden="true" /> : undefined}>
          {option.name}
        </Menu.Item>;
      })}
    </Menu.Dropdown>
  </Menu>;
}
