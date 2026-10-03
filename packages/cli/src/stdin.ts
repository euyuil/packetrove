import { fstatSync } from 'node:fs';
import type { Readable } from 'node:stream';
import { MAX_INPUT_LENGTH, MAX_INPUTS } from '@packetrove/contracts';
import { ToolError } from '@packetrove/core';

/** Append trimmed lines without buffering an unbounded raw line. */
export async function appendStandardInput(inputs: string[], source: Readable): Promise<void> {
  let input = '';
  let trailingWhitespace = '';
  let afterCarriageReturn = false;
  const appendLine = () => {
    if (input) {
      // A 65-character prefix represents an already confirmed overlong input.
      // Do not trim that prefix again: it may end within internal whitespace.
      inputs.push(input);
      if (inputs.length > MAX_INPUTS) {
        throw new ToolError('INVALID_INPUT', `Use at most ${MAX_INPUTS} inputs per calculation.`);
      }
    }
    input = '';
    trailingWhitespace = '';
  };

  try {
    // Some platforms report EOF for a directory instead of a stream read error.
    const fd = (source as Readable & { fd?: number }).fd;
    if (typeof fd === 'number' && fstatSync(fd).isDirectory()) {
      throw new ToolError('INVALID_INPUT', 'Standard input is a directory. Redirect a text file or pipe address lines instead.');
    }
    source.setEncoding('utf8');
    for await (const chunk of source) {
      for (const character of chunk as string) {
        if (character === '\n') {
          if (!afterCarriageReturn) appendLine();
          afterCarriageReturn = false;
          continue;
        }
        afterCarriageReturn = character === '\r';
        if (afterCarriageReturn) {
          appendLine();
          continue;
        }
        if (input.length > MAX_INPUT_LENGTH) continue;
        if (!character.trim()) {
          // Leading whitespace is discarded; possible trailing whitespace stays
          // bounded until a later nonblank character proves it is internal.
          if (input && input.length + trailingWhitespace.length <= MAX_INPUT_LENGTH) {
            trailingWhitespace += character;
          }
          continue;
        }
        input = (input + trailingWhitespace + character).slice(0, MAX_INPUT_LENGTH + 1);
        trailingWhitespace = '';
      }
    }
    appendLine();
  } finally {
    source.destroy();
  }
}
