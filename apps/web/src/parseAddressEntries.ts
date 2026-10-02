/** Split pasted address lists while retaining physical lines for validation errors. */
export function parseAddressEntries(text: string) {
  return text.split(/\r\n?|[\n\u2028\u2029]/u).flatMap((line, index) =>
    line.split(/[,，\s]+/u)
      .filter(value => value.length > 0)
      .map(value => ({ value, line: index + 1 })));
}
