import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';
import { supportedLocales } from './locales';
import type { Locale } from './routes';

export function createI18n(locale: Locale) {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources, lng: locale, fallbackLng: 'en', supportedLngs: supportedLocales, load: 'currentOnly',
    initAsync: false, enableSelector: true, interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}
