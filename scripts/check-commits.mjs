import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanMessage } from './check-secrets.mjs';

const headerPattern = /^([a-z][a-z0-9-]*)(?:\(([^()\r\n]+)\))?!?: (\S.*)$/i;

export function isConventionalCommit(message) {
  const header = message.trimStart().split(/\r?\n/, 1)[0];
  const match = headerPattern.exec(header);
  return Boolean(match && (!match[2] || match[2].trim()));
}

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options });
}

export function checkCommitRange(range) {
  const commits = git(['rev-list', '--reverse', '--end-of-options', range]).trim().split('\n').filter(Boolean);
  const invalid = commits.filter(commit => !isConventionalCommit(git(['show', '-s', '--format=%B', commit])));
  if (invalid.length) {
    // Do not echo messages: a rejected message could itself contain a credential.
    throw new Error(`Invalid Conventional Commit headers in: ${invalid.map(commit => commit.slice(0, 12)).join(', ')}. Expected type(scope)!: description; scope and ! are optional.`);
  }
  console.log(`Conventional Commit headers verified for ${commits.length} commit(s).`);
}

function main(args) {
  if (args.length === 2 && args[0] === '--edit') {
    const message = readFileSync(args[1], 'utf8');
    const cleaned = git(['stripspace', '--strip-comments'], { input: message });
    if (!isConventionalCommit(cleaned)) {
      throw new Error('Invalid Conventional Commit header. Expected type(scope)!: description; scope and ! are optional.');
    }
    scanMessage(message);
    return;
  }
  if (args.length === 2 && args[0] === '--range') {
    checkCommitRange(args[1]);
    return;
  }
  throw new Error('Usage: node scripts/check-commits.mjs --edit <message-file> | --range <revision-range>');
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
