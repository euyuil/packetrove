import { describe, expect, it } from 'vitest';
import { createInstance } from 'i18next';
import { supportedLocales } from './locales';
import { en, resources } from './resources';
import { validateTranslationResource } from './translation-validation';

describe('registered translation resources', () => {
  it.each(supportedLocales)('validates every original %s message and plural branch without fallback', locale => {
    expect(validateTranslationResource(en, resources[locale].translation, locale)).toEqual([]);
  });
});

describe('translation validation failures', () => {
  const reference = {
    common: { label: 'Read {{name}} using <code>/v1/example</code> and <code>{{localUrl}}</code>.' },
    entries: { count_one: '{{total}} entry', count_other: '{{total}} entries' },
  };
  const russian = {
    common: { label: 'Read {{name}} using <code>/v1/example</code> and <code>{{localUrl}}</code>.' },
    entries: { count_one: '{{total}} запись', count_few: '{{total}} записи', count_many: '{{total}} записей', count_other: '{{total}} записи' },
  };
  function validate(value: unknown) { return validateTranslationResource(reference, value, 'ru'); }

  it.each([
    [{ ...russian, common: {} }, 'common.label: missing translation'],
    [{ ...russian, common: { ...russian.common, typo: 'Text' } }, 'common.typo: unknown translation key'],
    [{ ...russian, common: { label: '   ' } }, 'common.label: translation must not be blank'],
    [{ ...russian, common: { label: 1 } }, 'common.label: expected a string'],
    [{ ...russian, common: { label: {} } }, 'common.label: expected a string'],
    [{ ...russian, common: 'Text' }, 'common: expected a translation object'],
    [{ ...russian, common: null }, 'common: expected a translation object'],
    [{ ...russian, common: [] }, 'common: expected a translation object'],
    [null, '<root>: expected a translation object'],
  ])('rejects incorrect resource structure (%#)', (value, error) => {
    expect(validate(value)).toContain(error);
  });

  it('does not accept inherited fields as translations', () => {
    expect(validate({ ...russian, common: Object.create(russian.common) })).toContain('common.label: missing translation');
  });

  it.each([
    ['Read {{wrong}} using <code>/v1/example</code> and <code>{{localUrl}}</code>.', 'interpolation parameter names differ'],
    ['Read {{name}} and {{extra}} using <code>/v1/example</code> and <code>{{localUrl}}</code>.', 'interpolation parameter names differ'],
    ['Read {{name using <code>/v1/example</code> and <code>{{localUrl}}</code>.', 'incomplete or unsupported interpolation'],
    ['Read name }} using <code>/v1/example</code> and <code>{{localUrl}}</code>.', 'incomplete or unsupported interpolation'],
    ['Read {{}} using <code>/v1/example</code> and <code>{{localUrl}}</code>.', 'invalid named interpolation'],
    ['Read {{-name}} using <code>/v1/example</code> and <code>{{localUrl}}</code>.', 'invalid named interpolation'],
    ['Read {{name, number}} using <code>/v1/example</code> and <code>{{localUrl}}</code>.', 'invalid named interpolation'],
    ['Read $t(name) using <code>/v1/example</code> and <code>{{localUrl}}</code>.', 'incomplete or unsupported interpolation'],
    ['Read {{{name}}} using <code>/v1/example</code> and <code>{{localUrl}}</code>.', 'incomplete or unsupported interpolation'],
  ])('rejects invalid or changed parameters (%#)', (label, error) => {
    expect(validate({ ...russian, common: { label } })).toContain(`common.label: ${error}`);
  });

  it.each(['\n', '\r', '\u2028', '\u2029'])('rejects a line terminator inside interpolation (%#)', separator => {
    const label = `Read {{${separator}name${separator}}} using <code>/v1/example</code> and <code>{{localUrl}}</code>.`;
    expect(validate({ ...russian, common: { label } })).toContain('common.label: incomplete or unsupported interpolation');
  });

  it.each([
    '<code>/v1/example', '</code>/v1/example', '<strong>/v1/example</strong>',
    '<code class="value">/v1/example</code>', '<code/>', '<code><code>/v1/example</code></code>',
    '<code>/v1/example</code',
    '<!-- <code>/v1/example</code> -->', '<!-- <code>/v1/example</code>',
    '<!DOCTYPE html>', '<?xml version="1.0"?>',
    '<0><code>/v1/example</code></0>', '<1><code>/v1/example</code></1>', '<0/>',
  ])('rejects malformed or unsupported markers (%#)', label => {
    expect(validate({ ...russian, common: { label } })).toContain(
      'common.label: use only paired, non-nested code markers without attributes');
  });

  it.each([
    'Read {{name}} using <code>/v1/changed</code> and <code>{{localUrl}}</code>.',
    'Read {{name}} using <code>/v1/example</code> and {{localUrl}}.',
    'Read {{name}} using <code>/v1/example</code>, <code>/v1/example</code> and <code>{{localUrl}}</code>.',
    'Read {{name}} using <code> /v1/example</code> and <code>{{localUrl}}</code>.',
  ])('rejects changed, missing or additional code content (%#)', label => {
    expect(validate({ ...russian, common: { label } })).toContain('common.label: code contents or occurrences differ');
  });

  it('checks required forms and misspellings against the original resource', () => {
    const { count_few: _removed, ...entries } = russian.entries;
    expect(validate({ ...russian, entries })).toContain('entries.count_few: missing required plural form');
    expect(validate({ ...russian, entries: { ...entries, count_fwe: '{{total}} записи' } }))
      .toContain('entries.count_fwe: unknown plural suffix');
    expect(validate({ ...russian, entries: { ...russian.entries, typo_other: '{{total}}' } }))
      .toContain('entries.typo_other: unknown translation key');
  });

  it('checks every additional plural branch, including the optional zero override', () => {
    expect(validate({ ...russian, entries: { ...russian.entries, count_zero: '{{total}} записей' } })).toEqual([]);
    expect(validate({ ...russian, entries: { ...russian.entries, count_zero: '{{wrong}} записей' } }))
      .toContain('entries.count_zero: interpolation parameter names differ');
    expect(validate({ ...russian, entries: { ...russian.entries, count_few: ' ' } }))
      .toContain('entries.count_few: translation must not be blank');
  });

  it('accepts only other where the language has no other required forms', () => {
    expect(validateTranslationResource(reference, {
      ...russian, entries: { count_other: '{{total}} 件' },
    }, 'ja')).toEqual([]);
  });

  it('keeps plural families with overlapping names independent', () => {
    const original = {
      count_one: '{{total}} entry', count_other: '{{total}} entries',
      count_visible_one: '{{visible}} visible entry', count_visible_other: '{{visible}} visible entries',
    };
    const translated = { count_other: '{{total}} 件', count_visible_other: '{{visible}} 件を表示' };
    expect(validateTranslationResource(original, translated, 'ja')).toEqual([]);
    expect(validateTranslationResource(original, {
      ...translated, count_visible_other: '{{total}} 件を表示',
    }, 'ja')).toContain('count_visible_other: interpolation parameter names differ');
  });

  it('validates known ordinary keys beside a plural family without treating them as suffixes', () => {
    const original = {
      count_one: '{{total}} entry', count_other: '{{total}} entries',
      count_label: 'Entries', count_options: { label: 'Visible entries' },
    };
    const translated = {
      count_other: '{{total}} 件', count_label: '項目', count_options: { label: '表示項目' },
    };
    expect(validateTranslationResource(original, translated, 'ja')).toEqual([]);
    expect(validateTranslationResource(original, { ...translated, count_label: ' ' }, 'ja'))
      .toContain('count_label: translation must not be blank');
    expect(validateTranslationResource(original, { ...translated, count_options: {} }, 'ja'))
      .toContain('count_options.label: missing translation');
    expect(validateTranslationResource(original, { ...translated, count_fwe: '{{total}} 件' }, 'ja'))
      .toContain('count_fwe: unknown plural suffix');
  });

  it('allows reordered and repeated parameters, whole code fragments and ordinary comparison characters', () => {
    expect(validate({ ...russian, common: {
      label: '<code>{{ localUrl }}</code> と <code>/v1/example</code>: {{\tname\t}} {{name}}. a < b, c > d; {}.',
    } })).toEqual([]);
  });

  it('does not mutate either resource while checking it', () => {
    const originalBefore = JSON.stringify(reference);
    const translatedBefore = JSON.stringify(russian);
    expect(validate(russian)).toEqual([]);
    expect(JSON.stringify(reference)).toBe(originalBefore);
    expect(JSON.stringify(russian)).toBe(translatedBefore);
  });

  it('allows ordinary JSON braces after a named interpolation', async () => {
    const translation = { cidr: { explanation: '{"total":{{total}}}' } };
    expect(validateTranslationResource(translation, translation, 'en')).toEqual([]);
    const instance = createInstance();
    await instance.init({ lng: 'en', resources: { en: { translation } }, initAsync: false });
    expect(instance.t($ => $.cidr.explanation, { total: 21 })).toBe('{"total":21}');
  });
});
