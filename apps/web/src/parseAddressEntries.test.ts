import { describe, expect, it } from 'vitest';
import { parseAddressEntries } from './parseAddressEntries';

describe('pasted address locations', () => {
  it('counts every non-empty entry within its physical line, independent of validity', () => {
    const text = ',， \t\r\n 203.0.113.1,,bad，\u00a0\u3000203.0.113.3\r\r::/129\n'
      + '203.0.113.4\u2028\u2029bad\tbroken, ';
    expect(parseAddressEntries(text)).toEqual([
      { value: '203.0.113.1', line: 2, positionInLine: 1, entriesOnLine: 3, start: 7, end: 18 },
      { value: 'bad', line: 2, positionInLine: 2, entriesOnLine: 3, start: 20, end: 23 },
      { value: '203.0.113.3', line: 2, positionInLine: 3, entriesOnLine: 3, start: 26, end: 37 },
      { value: '::/129', line: 4, positionInLine: 1, entriesOnLine: 1, start: 39, end: 45 },
      { value: '203.0.113.4', line: 5, positionInLine: 1, entriesOnLine: 1, start: 46, end: 57 },
      { value: 'bad', line: 7, positionInLine: 1, entriesOnLine: 2, start: 59, end: 62 },
      { value: 'broken', line: 7, positionInLine: 2, entriesOnLine: 2, start: 63, end: 69 },
    ]);
  });

  it.each(['\n', '\r\n', '\r', '\u2028', '\u2029'])('keeps original UTF-16 ranges with %j line breaks', lineBreak => {
    const text = '😀bad, bad' + lineBreak + lineBreak + '\tbad，::/129, ';
    const entries = parseAddressEntries(text);
    const thirdStart = 11 + 2 * lineBreak.length;
    expect(entries).toEqual([
      { value: '😀bad', line: 1, positionInLine: 1, entriesOnLine: 2, start: 0, end: 5 },
      { value: 'bad', line: 1, positionInLine: 2, entriesOnLine: 2, start: 7, end: 10 },
      { value: 'bad', line: 3, positionInLine: 1, entriesOnLine: 2, start: thirdStart, end: thirdStart + 3 },
      { value: '::/129', line: 3, positionInLine: 2, entriesOnLine: 2, start: thirdStart + 4, end: thirdStart + 10 },
    ]);
    for (const entry of entries) expect(text.slice(entry.start, entry.end)).toBe(entry.value);
  });

  it.each(['', ',， \t\r\n\r\u2028\u2029\u00a0\u3000'])('has no locations for an empty list %j', text => {
    expect(parseAddressEntries(text)).toEqual([]);
  });
});
