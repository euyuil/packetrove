import { describe, expect, it } from 'vitest';
import { parseAddressEntries } from './parseAddressEntries';

describe('pasted address locations', () => {
  it('counts every non-empty entry within its physical line, independent of validity', () => {
    const text = ',， \t\r\n 203.0.113.1,,bad，\u00a0\u3000203.0.113.3\r\r::/129\n'
      + '203.0.113.4\u2028\u2029bad\tbroken, ';
    expect(parseAddressEntries(text)).toEqual([
      { value: '203.0.113.1', line: 2, positionInLine: 1, entriesOnLine: 3 },
      { value: 'bad', line: 2, positionInLine: 2, entriesOnLine: 3 },
      { value: '203.0.113.3', line: 2, positionInLine: 3, entriesOnLine: 3 },
      { value: '::/129', line: 4, positionInLine: 1, entriesOnLine: 1 },
      { value: '203.0.113.4', line: 5, positionInLine: 1, entriesOnLine: 1 },
      { value: 'bad', line: 7, positionInLine: 1, entriesOnLine: 2 },
      { value: 'broken', line: 7, positionInLine: 2, entriesOnLine: 2 },
    ]);
  });
});
