export const locales = {
  en: { name: 'English', prefix: '', flag: 'GB' },
  'zh-Hans': { name: '简体中文', prefix: '/zh', flag: 'CN' },
  es: { name: 'Español', prefix: '/es', flag: 'ES' },
  de: { name: 'Deutsch', prefix: '/de', flag: 'DE' },
  ja: { name: '日本語', prefix: '/ja', flag: 'JP' },
} as const;

export type Locale = keyof typeof locales;
export const supportedLocales = Object.keys(locales) as Locale[];

export function resolveLocale(language: string | undefined): Locale {
  return language && Object.hasOwn(locales, language) ? language as Locale : 'en';
}
