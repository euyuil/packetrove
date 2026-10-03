import type { en } from './translations/en';

type Translations<T> = { [Key in keyof T]: T[Key] extends string ? string : Translations<T[Key]> };
type EnglishStructure = Translations<typeof en>;
type EntryCountTranslations = { entryCount_other: string }
  & Partial<Record<`entryCount_${Exclude<Intl.LDMLPluralRule, 'other'>}`, string>>;

export type TranslationResource = Omit<EnglishStructure, 'cidr'> & {
  cidr: Omit<EnglishStructure['cidr'], 'entryCount_one' | 'entryCount_other'> & EntryCountTranslations;
};
