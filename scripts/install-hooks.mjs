import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireGitleaks } from './check-secrets.mjs';

function git(args, optional = false) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (optional && result.status === 1) return '';
  if (result.error || result.status !== 0) throw new Error('Unable to inspect or configure repository Git hooks.');
  return result.stdout.trim();
}

try {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (resolve(process.cwd()) !== root || git(['rev-parse', '--show-toplevel']) !== root) {
    throw new Error('Run hook setup from the Packetrove repository root.');
  }
  const hooks = resolve(root, '.githooks');
  const current = git(['config', '--get', 'core.hooksPath'], true);
  if (current && resolve(root, current) !== hooks) {
    throw new Error('An existing core.hooksPath is configured. Review it before replacing it.');
  }
  if (!current) {
    const defaults = git(['rev-parse', '--git-path', 'hooks']);
    if (existsSync(defaults) && readdirSync(defaults).some(name => !name.endsWith('.sample'))) {
      throw new Error('Existing Git hooks were found. Review them before replacing them.');
    }
  }
  const version = requireGitleaks();
  for (const name of ['pre-commit', 'commit-msg']) chmodSync(resolve(hooks, name), 0o755);
  git(['config', '--local', 'core.hooksPath', '.githooks']);
  console.log(`Repository-local Git hooks enabled with Gitleaks ${version}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
