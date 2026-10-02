// Keep English first and use a fixed menu order.
// Group Chinese, Japanese, and Korean in that order.
export const locales = {
  en: { name: 'English', prefix: '', flag: 'GB' },
  de: { name: 'Deutsch', prefix: '/de', flag: 'DE' },
  es: { name: 'Español', prefix: '/es', flag: 'ES' },
  fr: { name: 'Français', prefix: '/fr', flag: 'FR' },
  it: { name: 'Italiano', prefix: '/it', flag: 'IT' },
  'pt-BR': { name: 'Português', prefix: '/pt', flag: 'PT' },
  ru: { name: 'Русский', prefix: '/ru', flag: 'RU' },
  'zh-Hans': { name: '中文', prefix: '/zh', flag: 'CN' },
  ja: { name: '日本語', prefix: '/ja', flag: 'JP' },
  ko: { name: '한국어', prefix: '/ko', flag: 'KR' },
} as const;

export type Locale = keyof typeof locales;
export const supportedLocales = Object.keys(locales) as Locale[];

export function resolveLocale(language: string | undefined): Locale {
  return language && Object.hasOwn(locales, language) ? language as Locale : 'en';
}
