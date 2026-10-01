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

function install(automatic) {
  const ci = process.env.CI && !['0', 'false'].includes(process.env.CI.toLowerCase());
  if (automatic && (ci || process.env.NODE_ENV === 'production' || process.env.npm_config_production === 'true')) {
    console.log('Git hook setup skipped in continuous integration or production.');
    return;
  }
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (automatic && !existsSync(resolve(root, '.git'))) {
    console.log('Git hook setup skipped: this source directory has no Git metadata.');
    return;
  }
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
  let version;
  try {
    version = requireGitleaks();
  } catch (error) {
    if (!automatic) throw error;
    console.warn(`${error.message} Commit checks will block until Gitleaks is available.`);
  }
  for (const name of ['pre-commit', 'commit-msg']) chmodSync(resolve(hooks, name), 0o755);
  if (git(['config', '--local', '--get', 'core.hooksPath'], true) !== '.githooks') {
    git(['config', '--local', 'core.hooksPath', '.githooks']);
  }
  console.log(`Repository-local Git hooks enabled${version ? ` with Gitleaks ${version}` : ''}.`);
}

const automatic = process.argv.length === 3 && process.argv[2] === '--auto';
try {
  if (!automatic && process.argv.length !== 2) throw new Error('Usage: node scripts/install-hooks.mjs [--auto]');
  install(automatic);
} catch (error) {
  if (automatic) {
    console.warn(`Automatic Git hook setup skipped: ${error.message} Review the configuration and run pnpm hooks:install before committing.`);
  } else {
    console.error(error.message);
    process.exitCode = 1;
  }
}
