import type { Locale } from './locales';
import type { TranslationResource } from './translation-resource';

export const translationLoaders = {
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
} satisfies Record<Locale, () => Promise<TranslationResource>>;
