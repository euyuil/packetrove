import { useEffect, useRef, useState } from 'react';
import { matchBrowserLanguage } from './i18n/browser-language';
import type { Locale } from './i18n/locales';

export const languageSuggestionStorageKey = 'packetrove.languageSuggestionHandled';

export function useLanguageSuggestion() {
  const [suggestedLocale, setSuggestedLocale] = useState<Locale | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    try {
      handled.current ||= window.sessionStorage.getItem(languageSuggestionStorageKey) === '1';
    } catch {
      // Browsing still works when session storage is unavailable.
    }

    function detectLanguage() {
      if (handled.current) return;
      const preferences = navigator.languages?.length ? navigator.languages : [navigator.language];
      setSuggestedLocale(matchBrowserLanguage(preferences));
    }

    detectLanguage();
    window.addEventListener('languagechange', detectLanguage);
    return () => window.removeEventListener('languagechange', detectLanguage);
  }, []);

  function dismissSuggestion() {
    if (handled.current) return;
    handled.current = true;
    setSuggestedLocale(null);
    try {
      window.sessionStorage.setItem(languageSuggestionStorageKey, '1');
    } catch {
      // Keep the choice in memory when the browser blocks storage.
    }
  }

  return { suggestedLocale, dismissSuggestion };
}
