import type { MouseEvent } from 'react';
import { Box, Button, Menu } from '@mantine/core';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import GB from 'country-flag-icons/react/3x2/GB';
import CN from 'country-flag-icons/react/3x2/CN';
import { useTranslation } from 'react-i18next';
import { localizedPath, type Locale } from './i18n/routes';

const languages = {
  en: { name: 'English', Flag: GB },
  'zh-Hans': { name: '简体中文', Flag: CN },
} satisfies Record<Locale, { name: string; Flag: typeof GB }>;

type LanguageSelectorProps = {
  locale: Locale;
  path: string;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function LanguageSelector({ locale, path, onNavigate }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const current = languages[locale];
  return <Menu position="bottom-end" width={200} shadow="md">
    <Menu.Target>
      <Button size="sm" variant="light" aria-label={`${t($ => $.common.language)}: ${current.name}`}
        leftSection={<Box component={current.Flag} w={21} h={14} aria-hidden="true" />}
        rightSection={<IconChevronDown size={14} aria-hidden="true" />}>
        <span lang={locale}>{current.name}</span>
      </Button>
    </Menu.Target>
    <Menu.Dropdown>
      {(Object.keys(languages) as Locale[]).map(language => {
        const option = languages[language];
        return <Menu.Item key={language} component="a"
          href={localizedPath(path, language) + window.location.search + window.location.hash}
          onClick={onNavigate} lang={language} hrefLang={language}
          aria-current={language === locale ? 'true' : undefined}
          leftSection={<Box component={option.Flag} w={21} h={14} aria-hidden="true" />}
          rightSection={language === locale ? <IconCheck size={16} aria-hidden="true" /> : undefined}>
          {option.name}
        </Menu.Item>;
      })}
    </Menu.Dropdown>
  </Menu>;
}
