/** Retain physical lines, entry positions, and half-open UTF-16 ranges in the original pasted text. */
export function parseAddressEntries(text: string) {
  let offset = 0;
  // Captured line breaks contribute their original length, including both characters in CRLF.
  return text.split(/(\r\n?|[\n\u2028\u2029])/u).flatMap((part, index) => {
    const lineStart = offset;
    offset += part.length;
    if (index % 2 !== 0) return [];
    const values = Array.from(part.matchAll(/[^,，\s]+/gu));
    return values.map((match, position) => ({
      value: match[0], line: index / 2 + 1, positionInLine: position + 1, entriesOnLine: values.length,
      start: lineStart + match.index, end: lineStart + match.index + match[0].length,
    }));
  });
}
