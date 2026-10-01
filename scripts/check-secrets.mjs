import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scanOptions = ['--redact=100', '--no-banner', '--no-color', '--ignore-gitleaks-allow'];

function gitleaks(args, input) {
  const result = spawnSync('gitleaks', args, {
    input,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error?.code === 'ENOENT') {
    throw new Error('Gitleaks is required. On macOS, install it once with: brew install gitleaks');
  }
  if (result.error) throw new Error(`Unable to run Gitleaks: ${result.error.message}`);
  if (result.status !== 0) {
    // Scanner output is redacted; never print its input or rejected commit message.
    if (args[0] !== 'version') {
      process.stderr.write(result.stdout ?? '');
      process.stderr.write(result.stderr ?? '');
    }
    throw new Error('Credential scan failed. Resolve the finding or scanner error before committing.');
  }
  return result.stdout.trim();
}

export function requireGitleaks() {
  return gitleaks(['version']);
}

export function scanStaged() {
  gitleaks(['git', '--pre-commit', '--staged', '--verbose', ...scanOptions, '.']);
}

export function scanMessage(message) {
  gitleaks(['stdin', '--verbose', ...scanOptions], message);
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 2) throw new Error('Usage: node scripts/check-secrets.mjs');
    scanStaged();
    console.log('Staged credential scan passed.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
