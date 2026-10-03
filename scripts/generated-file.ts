import { readFile, writeFile } from 'node:fs/promises';

/** Check a generated file or write the supplied contents. */
export async function checkOrWriteGeneratedFile(target: URL, generated: string, staleMessage: string): Promise<void> {
  if (process.argv.includes('--check')) {
    if (await readFile(target, 'utf8') !== generated) {
      console.error(staleMessage);
      process.exitCode = 1;
    }
  } else {
    await writeFile(target, generated);
  }
}
