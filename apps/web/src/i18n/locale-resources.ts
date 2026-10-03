import type { i18n } from 'i18next';
import { createResourceCache } from '../resource-cache';
import type { Locale } from './locales';
import type { TranslationResource } from './translation-resource';
import { translationLoaders } from './translation-loaders';

const localeResources = createResourceCache<Locale, TranslationResource>(translationLoaders);

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
