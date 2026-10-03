import { es } from './translations/es';
import { de } from './translations/de';
import { ja } from './translations/ja';
import { fr } from './translations/fr';
import { ptBR } from './translations/pt-BR';
import { ru } from './translations/ru';
import { ko } from './translations/ko';
import { it } from './translations/it';
import type { Locale } from './locales';

import { en } from './translations/en';
import { zhHans } from './translations/zh-Hans';
import type { TranslationResource } from './translation-resource';

// Complete resources are used only by build scripts and tests.
export { en, zhHans };
export type { TranslationResource };

export const resources = {
  en: { translation: en }, 'zh-Hans': { translation: zhHans },
  es: { translation: es }, de: { translation: de }, ja: { translation: ja },
  fr: { translation: fr }, 'pt-BR': { translation: ptBR },
  ru: { translation: ru }, ko: { translation: ko }, it: { translation: it },
} satisfies Record<Locale, { translation: TranslationResource }>;
