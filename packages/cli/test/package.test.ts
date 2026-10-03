import { spawnSync } from 'node:child_process';
import { accessSync, constants, copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { CIDR_COVER_EXAMPLES, CidrCoverResultSchema, ErrorResponseSchema } from '@packetrove/contracts';

const workspace = fileURLToPath(new URL('../../../', import.meta.url));
const cli = join(workspace, 'packages/cli');

it('packs a public CLI and installs its executable offline with npm and pnpm', () => {
  const directory = mkdtempSync(join(tmpdir(), 'packetrove-package-'));
  try {
    const snapshot = join(directory, 'workspace');
    const snapshotCli = join(snapshot, 'packages/cli');
    const artifacts = join(directory, 'artifacts');
    for (const path of [snapshot, artifacts]) mkdirSync(path, { recursive: true });

    for (const file of ['package.json', 'pnpm-workspace.yaml', 'tsconfig.base.json', 'LICENSE']) {
      copyFileSync(join(workspace, file), join(snapshot, file));
    }
    for (const name of ['contracts', 'core']) {
      const packageDirectory = join(snapshot, 'packages', name);
      mkdirSync(packageDirectory, { recursive: true });
      copyFileSync(join(workspace, 'packages', name, 'package.json'), join(packageDirectory, 'package.json'));
    }
    // Run prepack against a copy so concurrent CLI tests keep their original dist.
    cpSync(cli, snapshotCli, {
      recursive: true,
      filter: source => source !== join(cli, 'node_modules') && source !== join(cli, 'dist'),
    });
    symlinkSync(join(cli, 'node_modules'), join(snapshotCli, 'node_modules'), 'junction');

    const rootManifest = JSON.parse(readFileSync(join(workspace, 'package.json'), 'utf8'));
    const authConfig = join(directory, 'empty.npmrc');
    writeFileSync(authConfig, '');
    const environment = {
      ...process.env,
      XDG_CACHE_HOME: join(directory, 'cache'),
      npm_config_cache: join(directory, 'npm-cache'),
      npm_config_userconfig: authConfig,
      npm_config_registry: 'http://127.0.0.1:1',
    };
    function pnpm(args: string[], cwd: string) {
      // Reuse the package manager that launched the test, including the CI pin.
      const execution = spawnSync(process.env.npm_execpath ?? 'pnpm', [
        '--store-dir', join(directory, 'store'), '--state-dir', join(directory, 'state'),
        '--registry', 'http://127.0.0.1:1', ...args,
      ], { cwd, env: environment, encoding: 'utf8', timeout: 20_000 });
      if (execution.error) throw execution.error;
      return execution;
    }
    function npm(args: string[], cwd: string) {
      const execution = spawnSync('npm', args, { cwd, env: environment, encoding: 'utf8', timeout: 20_000 });
      if (execution.error) throw execution.error;
      return execution;
    }

    const packed = pnpm(['--filter', '@packetrove/cli', 'pack', '--pack-destination', artifacts], snapshot);
    expect(packed.status, packed.stderr).toBe(0);
    const archives = readdirSync(artifacts).filter(file => file.endsWith('.tgz'));
    expect(archives).toHaveLength(1);
    const archive = join(artifacts, archives[0]!);
    const inspected = npm(['pack', '--offline', '--ignore-scripts', '--dry-run', '--json', archive], directory);
    expect(inspected.status, inspected.stderr).toBe(0);
    const [preview] = JSON.parse(inspected.stdout);
    expect(preview.files.map((file: { path: string }) => file.path).sort()).toEqual([
      'LICENSE', 'README.md', 'THIRD_PARTY_NOTICES', 'dist/cli.js', 'dist/cli.js.map', 'package.json',
    ]);
    for (const manager of ['npm', 'pnpm'] as const) {
      const consumer = join(directory, manager);
      mkdirSync(consumer);
      writeFileSync(join(consumer, 'package.json'), JSON.stringify({
        name: 'packetrove-installation-test', private: true, packageManager: rootManifest.packageManager,
      }));
      const installed = manager === 'npm'
        ? npm(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', archive], consumer)
        : pnpm(['add', '--offline', '--ignore-scripts', archive], consumer);
      expect(installed.status, installed.stderr).toBe(0);

      const installedPackage = join(consumer, 'node_modules/@packetrove/cli');
      const manifest = JSON.parse(readFileSync(join(installedPackage, 'package.json'), 'utf8'));
      expect(manifest).toMatchObject({
        name: '@packetrove/cli', version: JSON.parse(readFileSync(join(cli, 'package.json'), 'utf8')).version,
        license: 'MIT', bin: { packetrove: './dist/cli.js' },
        repository: { url: 'git+https://github.com/euyuil/packetrove.git', directory: 'packages/cli' },
        publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/' },
      });
      expect(manifest.private).not.toBe(true);
      expect(manifest.dependencies ?? {}).toEqual({});
      expect(readdirSync(join(installedPackage, 'dist')).sort()).toEqual(['cli.js', 'cli.js.map']);
      const executable = join(consumer, 'node_modules/.bin', process.platform === 'win32' ? 'packetrove.cmd' : 'packetrove');
      accessSync(executable, process.platform === 'win32' ? constants.F_OK : constants.X_OK);
      for (const file of ['README.md', 'THIRD_PARTY_NOTICES']) {
        expect(readFileSync(join(installedPackage, file), 'utf8')).toBe(readFileSync(join(cli, file), 'utf8'));
      }
      expect(readFileSync(join(installedPackage, 'LICENSE'), 'utf8')).toBe(readFileSync(join(workspace, 'LICENSE'), 'utf8'));

      const run = (args: string[]) => manager === 'npm'
        ? npm(['exec', '--offline', '--', 'packetrove', ...args], consumer)
        : pnpm(['--silent', 'exec', 'packetrove', ...args], consumer);
      const version = run(['--version']);
      expect(version.status, version.stderr).toBe(0);
      expect(version.stderr).toBe('');
      expect(version.stdout).toBe(`${manifest.version}\n`);
      const jsonVersion = run(['--version', '--json']);
      expect(jsonVersion.status, jsonVersion.stderr).toBe(0);
      expect(jsonVersion.stderr).toBe('');
      expect(JSON.parse(jsonVersion.stdout)).toEqual({ version: manifest.version });
      const example = CIDR_COVER_EXAMPLES[1]!;
      const success = run(['cidr-cover', ...example.request.inputs, '--json']);
      expect(success.status, success.stderr).toBe(0);
      expect(success.stderr).toBe('');
      expect(CidrCoverResultSchema.parse(JSON.parse(success.stdout))).toEqual(example.result);

      const failure = run(['cidr-cover', '203.0.113.1', '::1', '--json']);
      expect(failure.status).toBe(1);
      expect(failure.stdout).toBe('');
      expect(ErrorResponseSchema.parse(JSON.parse(failure.stderr)).error.code).toBe('MIXED_ADDRESS_FAMILIES');
    }
  } finally {
    rmSync(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}, 60_000);
