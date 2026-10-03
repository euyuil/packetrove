import { supportedLocales, type Locale } from './locales';
import { translationLoaders } from './translation-loaders';
export type { TranslationResource } from './translation-resource';

type CompleteResources = {
  [Language in Locale]: { translation: Awaited<ReturnType<(typeof translationLoaders)[Language]>> };
};

// Complete resources are used only by build scripts and tests.
export const resources = Object.fromEntries(await Promise.all(supportedLocales.map(async locale =>
  [locale, { translation: await translationLoaders[locale]() }],
))) as CompleteResources;

export const en = resources.en.translation;
export const zhHans = resources['zh-Hans'].translation;
