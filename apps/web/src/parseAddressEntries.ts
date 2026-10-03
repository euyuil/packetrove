/** Split pasted address lists while retaining physical lines and entry positions for validation errors. */
export function parseAddressEntries(text: string) {
  return text.split(/\r\n?|[\n\u2028\u2029]/u).flatMap((line, index) => {
    const values = line.split(/[,，\s]+/u).filter(value => value.length > 0);
    return values.map((value, position) => ({
      value, line: index + 1, positionInLine: position + 1, entriesOnLine: values.length,
    }));
  });
}
