import type { en } from './translations/en';

type Translations<T> = { [Key in keyof T]: T[Key] extends string ? string : Translations<T[Key]> };
export type TranslationResource = Translations<typeof en>;
