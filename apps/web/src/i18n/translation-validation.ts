const pluralCategories = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const childPath = (parent: string, key: string) => parent ? `${parent}.${key}` : key;

type MessageSignature = { parameters: string[]; code: string[] };

function messageSignature(text: string, path: string, errors: string[]): MessageSignature {
  const parameters = new Set<string>();
  const remainder = text.replace(/(?<!\{)\{\{([^{}\r\n\u2028\u2029]*)\}\}/g, (_token, expression: string) => {
    const name = expression.trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) errors.push(`${path}: invalid named interpolation`);
    else parameters.add(name);
    return '';
  });
  if (/\{\{|\}\}|\$t\(/.test(remainder)) errors.push(`${path}: incomplete or unsupported interpolation`);

  const code: string[] = [];
  let codeStart: number | undefined;
  let validMarkers = true;
  for (const marker of text.matchAll(/<\/?[A-Za-z0-9][^<>]*>/g)) {
    if (marker[0] === '<code>' && codeStart === undefined) codeStart = marker.index + marker[0].length;
    else if (marker[0] === '</code>' && codeStart !== undefined) {
      code.push(text.slice(codeStart, marker.index).replace(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g, '{{$1}}'));
      codeStart = undefined;
    } else validMarkers = false;
  }
  const withoutMarkers = text.replace(/<\/?[A-Za-z0-9][^<>]*>/g, '');
  if (codeStart !== undefined || /<\s*\/?\s*code\b/i.test(withoutMarkers) || /<[!?]/.test(text)) validMarkers = false;
  if (!validMarkers) errors.push(`${path}: use only paired, non-nested code markers without attributes`);
  return { parameters: [...parameters].sort(), code: code.sort() };
}

/** Check original resources, before i18next's English fallback can hide missing text. */
export function validateTranslationResource(reference: unknown, translation: unknown, locale: string): string[] {
  const errors: string[] = [];
  const requiredCategories = new Set<string>([
    'other', ...new Intl.PluralRules(locale).resolvedOptions().pluralCategories,
  ]);

  function message(original: string, value: unknown, path: string) {
    if (typeof value !== 'string') {
      errors.push(`${path}: expected a string`);
      return;
    }
    if (!value.trim()) errors.push(`${path}: translation must not be blank`);
    const expected = messageSignature(original, `reference.${path}`, errors);
    const actual = messageSignature(value, path, errors);
    if (JSON.stringify(actual.parameters) !== JSON.stringify(expected.parameters)) {
      errors.push(`${path}: interpolation parameter names differ`);
    }
    if (JSON.stringify(actual.code) !== JSON.stringify(expected.code)) {
      errors.push(`${path}: code contents or occurrences differ`);
    }
  }

  function object(original: unknown, value: unknown, path: string) {
    if (!isObject(original) || !isObject(value)) {
      errors.push(`${path || '<root>'}: expected a translation object`);
      return;
    }
    const families = new Map<string, string>();
    for (const [key, text] of Object.entries(original)) {
      if (key.endsWith('_other') && typeof text === 'string') families.set(key.slice(0, -6), text);
    }
    const familyNames = [...families.keys()].sort((left, right) => right.length - left.length);
    const familyFor = (key: string) => {
      const family = familyNames.find(base => key.startsWith(`${base}_`));
      if (family !== undefined && Object.hasOwn(original, key)
        && !pluralCategories.has(key.slice(family.length + 1))) return undefined;
      return family;
    };

    for (const [key, text] of Object.entries(original)) {
      const family = familyFor(key);
      if (family !== undefined && pluralCategories.has(key.slice(family.length + 1))) continue;
      const location = childPath(path, key);
      if (!Object.hasOwn(value, key)) errors.push(`${location}: missing translation`);
      else if (typeof text === 'string') message(text, value[key], location);
      else object(text, value[key], location);
    }
    for (const [base, text] of families) {
      for (const category of requiredCategories) {
        const key = `${base}_${category}`;
        if (!Object.hasOwn(value, key)) errors.push(`${childPath(path, key)}: missing required plural form`);
      }
      for (const [key, translated] of Object.entries(value)) {
        if (familyFor(key) !== base) continue;
        const location = childPath(path, key);
        if (!pluralCategories.has(key.slice(base.length + 1))) errors.push(`${location}: unknown plural suffix`);
        else message(text, translated, location);
      }
    }
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(original, key) && familyFor(key) === undefined) {
        errors.push(`${childPath(path, key)}: unknown translation key`);
      }
    }
  }
  object(reference, translation, '');
  return errors;
}
