import { describe, expect, it } from 'vitest';
import { matchBrowserLanguage } from './browser-language';

describe('browser language matching', () => {
  it.each([
    ['en-US', 'en'], ['en-GB', 'en'], ['EN-us', 'en'],
    ['de-AT', 'de'], ['es-419', 'es'], ['fr-CA', 'fr'], ['it-IT', 'it'],
    ['pt-BR', 'pt-BR'], ['pt-PT', 'pt-BR'], ['pt', 'pt-BR'],
    ['ru-RU', 'ru'], ['ja-JP', 'ja'], ['ko-KR', 'ko'],
    ['zh', 'zh-Hans'], ['zh-CN', 'zh-Hans'], ['zh-SG', 'zh-Hans'],
    ['zh-Hans', 'zh-Hans'], ['zh-Hans-TW', 'zh-Hans'],
  ])('matches %s to %s', (preference, locale) => {
    expect(matchBrowserLanguage([preference])).toBe(locale);
  });

  it.each(['zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant', 'zh-Hant-CN', 'ru-Latn', 'ar', 'yue', '', 'en_US'])
    ('does not suggest an unsupported language or writing system for %s', preference => {
      expect(matchBrowserLanguage([preference])).toBeNull();
    });

  it('respects preference order while skipping unsupported and malformed tags', () => {
    expect(matchBrowserLanguage(['en_US', 'ar', 'zh-Hant', 'fr-CA', 'zh-CN', 'en-US'])).toBe('fr');
    expect(matchBrowserLanguage(['ja-JP', 'en-US'])).toBe('ja');
    expect(matchBrowserLanguage([])).toBeNull();
  });
});
