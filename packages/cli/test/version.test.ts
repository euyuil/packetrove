import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ErrorResponseSchema } from '@packetrove/contracts';
import manifest from '../package.json' with { type: 'json' };

const cli = fileURLToPath(new URL('../', import.meta.url));
const bundle = join(cli, 'dist/cli.js');
const noInputOrNetwork = 'data:text/javascript,' + encodeURIComponent(`
  globalThis.fetch = () => { throw new Error('Unexpected network access.'); };
  Object.defineProperty(process, 'stdin', {
    get() { throw new Error('Unexpected standard-input access.'); },
  });
`);
function run(args: string[], executable = bundle, cwd = cli) {
  const result = spawnSync(process.execPath, ['--import', noInputOrNetwork, executable, ...args], {
    cwd, encoding: 'utf8', timeout: 10_000,
  });
  if (result.error) throw result.error;
  return result;
}

describe('bundled CLI version queries', () => {
  it('prints only the CLI package version and a newline without input or network access', () => {
    const execution = run(['--version']);
    expect(execution.status).toBe(0);
    expect(execution.stdout).toBe(`${manifest.version}\n`);
    expect(execution.stderr).toBe('');
  });

  it.each([['--version', '--json'], ['--json', '--version']])('prints a machine-readable version for %s %s', (...args) => {
    const execution = run(args);
    expect(execution.status).toBe(0);
    expect(execution.stdout).toBe(`${JSON.stringify({ version: manifest.version })}\n`);
    expect(execution.stderr).toBe('');
  });

  it.each([
    ['cidr-cover', '--version'],
    ['public-ip', '--version'],
    ['--version', '203.0.113.1'],
    ['--version', '--stdin'],
    ['--version', '--api-origin', 'http://127.0.0.1:1'],
    ['--version', '--help'],
    ['--help', '--version'],
    ['--version', '--', 'cidr-cover'],
  ])('rejects version/action conflicts before reading input or looking up an IP: %j', (...args) => {
    const execution = run(['--json', ...args]);
    expect(execution.status).toBe(1);
    expect(execution.stdout).toBe('');
    const failure = ErrorResponseSchema.parse(JSON.parse(execution.stderr));
    expect(failure.error.code).toBe('INVALID_INPUT');
    expect(failure.error.message).toBe('Use "packetrove --version [--json]" without a command, inputs, --stdin, --api-origin, or --help.');
  });

  it('keeps the readable error format for a conflicting action', () => {
    const execution = run(['--version', '--help']);
    expect(execution.status).toBe(1);
    expect(execution.stdout).toBe('');
    expect(execution.stderr).toMatch(/^INVALID_INPUT: Use "packetrove --version/);
  });

  it('keeps structured parse failures and the option terminator semantics', () => {
    for (const args of [['--version', '--unknown', '--json'], ['--json', '--', '--version']]) {
      const execution = run(args);
      expect(execution.status).toBe(1);
      expect(execution.stdout).toBe('');
      expect(ErrorResponseSchema.parse(JSON.parse(execution.stderr)).error.code).toBe('INVALID_INPUT');
    }
  });

  it('keeps help independent of version queries', () => {
    const execution = run(['--help']);
    expect(execution.status).toBe(0);
    expect(execution.stdout).toContain('packetrove --version [--json]');
    expect(execution.stdout).toContain('packetrove cidr-cover');
    expect(execution.stderr).toBe('');
  });

  it('embeds its own manifest version in a standalone bundle, even when workspace versions differ', () => {
    const directory = mkdtempSync(join(tmpdir(), 'packetrove-version-'));
    try {
      const snapshot = join(directory, 'cli');
      mkdirSync(snapshot);
      cpSync(join(cli, 'src'), join(snapshot, 'src'), { recursive: true });
      copyFileSync(join(cli, 'build.mjs'), join(snapshot, 'build.mjs'));
      const version = '9.8.7-version-test';
      writeFileSync(join(snapshot, 'package.json'), JSON.stringify({ ...manifest, version }));
      symlinkSync(join(cli, 'node_modules'), join(snapshot, 'node_modules'), 'junction');
      const built = spawnSync(process.execPath, [join(snapshot, 'build.mjs')], {
        cwd: snapshot, encoding: 'utf8', timeout: 10_000,
      });
      expect(built.error).toBeUndefined();
      expect(built.status, built.stderr).toBe(0);
      const standalone = join(directory, 'standalone');
      mkdirSync(standalone);
      const executable = join(standalone, 'cli.mjs');
      copyFileSync(join(snapshot, 'dist/cli.js'), executable);
      for (const json of [false, true]) {
        const execution = run(['--version', ...(json ? ['--json'] : [])], executable, standalone);
        expect(execution.status).toBe(0);
        expect(execution.stdout).toBe(json ? `${JSON.stringify({ version })}\n` : `${version}\n`);
        expect(execution.stderr).toBe('');
      }
    } finally {
      rmSync(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });
});
