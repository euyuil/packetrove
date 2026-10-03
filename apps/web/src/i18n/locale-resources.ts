import type { i18n } from 'i18next';
import { createResourceCache } from '../resource-cache';
import type { Locale } from './locales';
import type { TranslationResource } from './translation-resource';

const localeResources = createResourceCache<Locale, TranslationResource>({
  en: () => import('./translations/en').then(module => module.en),
  'zh-Hans': () => import('./translations/zh-Hans').then(module => module.zhHans),
  es: () => import('./translations/es').then(module => module.es),
  de: () => import('./translations/de').then(module => module.de),
  ja: () => import('./translations/ja').then(module => module.ja),
  fr: () => import('./translations/fr').then(module => module.fr),
  'pt-BR': () => import('./translations/pt-BR').then(module => module.ptBR),
  ru: () => import('./translations/ru').then(module => module.ru),
  ko: () => import('./translations/ko').then(module => module.ko),
  it: () => import('./translations/it').then(module => module.it),
});

export const isLocalePrepared = (locale: Locale) => localeResources.has('en') && localeResources.has(locale);
export const prepareLocale = (locale: Locale) => Promise.all([localeResources.load('en'), localeResources.load(locale)]);
export const getLocaleTranslation = (locale: Locale) => localeResources.get(locale);
export const getLocaleResources = (locale: Locale) => ({
  en: { translation: localeResources.get('en') },
  [locale]: { translation: localeResources.get(locale) },
});

export function installLocale(instance: i18n, locale: Locale) {
  if (!instance.hasResourceBundle(locale, 'translation')) {
    instance.addResourceBundle(locale, 'translation', getLocaleTranslation(locale));
  }
}
