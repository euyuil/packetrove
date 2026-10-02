import { supportedLocales, type Locale } from './locales';

export function matchBrowserLanguage(preferences: readonly string[]): Locale | null {
  for (const preference of preferences) {
    let preferred: Intl.Locale;
    try {
      preferred = new Intl.Locale(preference).maximize();
    } catch {
      continue;
    }

    const match = supportedLocales.find(locale => {
      const supported = new Intl.Locale(locale).maximize();
      return supported.language === preferred.language && supported.script === preferred.script;
    });
    if (match) return match;
  }
  return null;
}
