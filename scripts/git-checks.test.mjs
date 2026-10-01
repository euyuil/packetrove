import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { isConventionalCommit } from './check-commits.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const environment = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
delete environment.GITLEAKS_CONFIG;
delete environment.GITLEAKS_CONFIG_TOML;
environment.CI = '';
environment.NODE_ENV = '';
environment.npm_config_production = '';

function run(repo, command, args, overrides = {}) {
  // Reuse the pnpm version running this suite instead of dispatching through a global shim.
  if (command === 'pnpm' && process.env.npm_config_user_agent?.startsWith('pnpm/')) {
    command = process.env.npm_execpath ?? command;
  }
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: 'utf8',
    env: { ...environment, ...overrides },
  });
  assert.ifError(result.error);
  return { ...result, output: result.stdout + result.stderr };
}

function success(result) {
  assert.equal(result.status, 0, result.output);
  return result.stdout.trim();
}

function copySetup(repo) {
  cpSync(join(root, '.githooks'), join(repo, '.githooks'), { recursive: true });
  for (const name of ['check-secrets.mjs', 'check-commits.mjs', 'install-hooks.mjs']) {
    cpSync(join(root, 'scripts', name), join(repo, 'scripts', name));
  }
  const project = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  writeFileSync(join(repo, 'package.json'), JSON.stringify({
    name: 'packetrove-git-checks-fixture',
    private: true,
    scripts: { prepare: project.scripts.prepare },
  }));
}

function fixture(t) {
  const repo = mkdtempSync(join(tmpdir(), 'packetrove-git-checks-'));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  copySetup(repo);
  success(run(repo, 'git', ['init', '--quiet', '--initial-branch=main']));
  success(run(repo, 'git', ['config', 'user.name', 'Packetrove Tests']));
  success(run(repo, 'git', ['config', 'user.email', 'tests@example.com']));
  success(run(repo, 'git', ['config', 'commit.gpgsign', 'false']));
  success(run(repo, 'git', ['add', '.']));
  success(run(repo, 'git', ['-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'chore: initialize test fixture']));
  return repo;
}

function install(repo, overrides = {}) {
  return run(repo, process.execPath, ['scripts/install-hooks.mjs'], overrides);
}

function automaticInstall(repo, overrides = {}) {
  return run(repo, process.execPath, ['scripts/install-hooks.mjs', '--auto'], overrides);
}

function withoutGitleaks(repo) {
  const bin = join(repo, 'git-only-path');
  mkdirSync(bin);
  const gitDirectory = success(run(repo, 'git', ['--exec-path']));
  symlinkSync(join(gitDirectory, 'git'), join(bin, 'git'));
  symlinkSync(process.execPath, join(bin, 'node'));
  return { PATH: bin };
}

function stage(repo, content) {
  writeFileSync(join(repo, 'example.txt'), content);
  success(run(repo, 'git', ['add', 'example.txt']));
}

function fakeToken() {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return 'ghp_' + Array.from(randomBytes(36), byte => alphabet[byte % alphabet.length]).join('');
}

test('Conventional Commit headers accept optional scopes and breaking markers', () => {
  for (const message of [
    'docs: explain setup',
    'feat(api)!: change the response\n\nBREAKING CHANGE: update callers',
    'FIX(core): normalize input',
    'custom-type: describe a change',
  ]) assert.equal(isConventionalCommit(message), true, message);
  for (const message of ['update files', 'feat(): add a tool', 'feat: ', 'feat : add a tool']) {
    assert.equal(isConventionalCommit(message), false, message);
  }
});

test('hooks commit a clean staged snapshot despite an unstaged credential', t => {
  const repo = fixture(t);
  success(install(repo));
  stage(repo, 'Public example\n');
  writeFileSync(join(repo, 'example.txt'), `token = "${fakeToken()}"\n`);
  const message = join(repo, '.git', 'test-message');
  writeFileSync(message, 'docs(example): add public content\n\n# Harmless editor comment\n');
  success(run(repo, 'git', ['commit', '--quiet', '--cleanup=strip', '-F', message]));
  assert.equal(success(run(repo, 'git', ['show', 'HEAD:example.txt'])), 'Public example');
  assert.match(success(run(repo, 'git', ['log', '-1', '--format=%B'])), /^docs\(example\): add public content$/);
});

test('hooks reject staged credentials, ignore inline bypasses, and redact findings', t => {
  const repo = fixture(t);
  success(install(repo));
  const head = success(run(repo, 'git', ['rev-parse', 'HEAD']));
  const token = fakeToken();
  stage(repo, `token = "${token}" # gitleaks:allow\n`);
  const result = run(repo, 'git', ['commit', '--quiet', '-m', 'chore: add an example']);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Credential scan failed/);
  assert.match(result.output, /REDACTED/);
  assert.equal(result.output.includes(token), false);
  assert.equal(success(run(repo, 'git', ['rev-parse', 'HEAD'])), head);
});

test('hooks reject invalid commit headers without creating a commit', t => {
  const repo = fixture(t);
  success(install(repo));
  const head = success(run(repo, 'git', ['rev-parse', 'HEAD']));
  stage(repo, 'Public example\n');
  const result = run(repo, 'git', ['commit', '--quiet', '-m', 'unstructured description']);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Invalid Conventional Commit header/);
  assert.equal(result.output.includes('unstructured description'), false);
  assert.equal(success(run(repo, 'git', ['rev-parse', 'HEAD'])), head);
});

test('hooks reject credentials in commit messages, including comment lines', t => {
  const repo = fixture(t);
  success(install(repo));
  stage(repo, 'Public example\n');
  const head = success(run(repo, 'git', ['rev-parse', 'HEAD']));
  const token = fakeToken();
  const message = join(repo, '.git', 'test-message');
  writeFileSync(message, `docs: add an example\n\n# token = "${token}"\n`);
  const result = run(repo, 'git', ['commit', '--quiet', '-F', message]);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Credential scan failed/);
  assert.equal(result.output.includes(token), false);
  assert.equal(success(run(repo, 'git', ['rev-parse', 'HEAD'])), head);
});

test('missing Gitleaks blocks setup and scans with an actionable message', t => {
  const repo = fixture(t);
  const missing = withoutGitleaks(repo);
  const result = run(repo, process.execPath, ['scripts/check-secrets.mjs'], missing);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /brew install gitleaks/);
  const setup = install(repo, missing);
  assert.notEqual(setup.status, 0);
  assert.match(setup.output, /brew install gitleaks/);
  assert.notEqual(run(repo, 'git', ['config', '--local', '--get', 'core.hooksPath']).status, 0);
});

test('setup preserves custom hooks and enables repository-local hooks idempotently', t => {
  const repo = fixture(t);
  const custom = join(repo, '.git', 'hooks', 'pre-commit');
  writeFileSync(custom, '#!/bin/sh\nexit 0\n');
  chmodSync(custom, 0o755);
  const blocked = install(repo);
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.output, /Existing Git hooks/);
  const automatic = automaticInstall(repo);
  success(automatic);
  assert.match(automatic.output, /Automatic Git hook setup skipped/);
  assert.notEqual(run(repo, 'git', ['config', '--local', '--get', 'core.hooksPath']).status, 0);
  assert.equal(readFileSync(custom, 'utf8'), '#!/bin/sh\nexit 0\n');
  rmSync(custom);
  success(run(repo, 'git', ['config', '--local', 'core.hooksPath', '.custom-hooks']));
  assert.notEqual(install(repo).status, 0);
  success(automaticInstall(repo));
  assert.equal(success(run(repo, 'git', ['config', '--local', '--get', 'core.hooksPath'])), '.custom-hooks');
  success(run(repo, 'git', ['config', '--local', '--unset', 'core.hooksPath']));
  success(install(repo));
  success(install(repo));
  assert.equal(success(run(repo, 'git', ['config', '--local', '--get', 'core.hooksPath'])), '.githooks');
});

test('pnpm install enables hooks in a fresh clone and can be repeated', t => {
  const source = fixture(t);
  const clone = mkdtempSync(join(tmpdir(), 'packetrove-git-checks-clone-'));
  t.after(() => rmSync(clone, { recursive: true, force: true }));
  success(run(source, 'git', ['clone', '--quiet', '--no-local', source, clone]));
  assert.notEqual(run(clone, 'git', ['config', '--local', '--get', 'core.hooksPath']).status, 0);
  for (let attempt = 0; attempt < 2; attempt++) {
    success(run(clone, 'pnpm', ['install', '--offline', '--ignore-workspace', '--no-frozen-lockfile']));
    assert.equal(success(run(clone, 'git', ['config', '--local', '--get', 'core.hooksPath'])), '.githooks');
  }
  success(run(clone, 'git', ['config', 'user.name', 'Packetrove Tests']));
  success(run(clone, 'git', ['config', 'user.email', 'tests@example.com']));
  success(run(clone, 'git', ['config', 'commit.gpgsign', 'false']));
  stage(clone, 'Public example\n');
  const invalid = run(clone, 'git', ['commit', '--quiet', '-m', 'unstructured description']);
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.output, /Invalid Conventional Commit header/);
});

test('automatic setup enables hooks without Gitleaks and still blocks commits', t => {
  const repo = fixture(t);
  const missing = withoutGitleaks(repo);
  const setup = automaticInstall(repo, missing);
  success(setup);
  assert.match(setup.output, /brew install gitleaks/);
  assert.equal(success(run(repo, 'git', ['config', '--local', '--get', 'core.hooksPath'])), '.githooks');
  stage(repo, 'Public example\n');
  const head = success(run(repo, 'git', ['rev-parse', 'HEAD']));
  const commit = run(repo, 'git', ['commit', '--quiet', '-m', 'docs: add an example'], missing);
  assert.notEqual(commit.status, 0);
  assert.match(commit.output, /brew install gitleaks/);
  assert.equal(success(run(repo, 'git', ['rev-parse', 'HEAD'])), head);
});

test('automatic setup skips CI and production without looking up Git or Gitleaks', t => {
  const repo = fixture(t);
  for (const overrides of [
    { CI: 'true' }, { CI: '1' }, { NODE_ENV: 'production' }, { npm_config_production: 'true' },
  ]) {
    const setup = automaticInstall(repo, { PATH: join(repo, 'empty-path'), ...overrides });
    success(setup);
    assert.match(setup.output, /skipped in continuous integration or production/);
    assert.notEqual(run(repo, 'git', ['config', '--local', '--get', 'core.hooksPath']).status, 0);
  }
});

test('pnpm install skips hook setup in CI and production installs', t => {
  for (const [extra, overrides] of [[[], { CI: 'true' }], [['--prod'], {}]]) {
    const repo = fixture(t);
    const result = run(repo, 'pnpm', ['install', '--offline', '--ignore-workspace', '--no-frozen-lockfile', ...extra], overrides);
    success(result);
    assert.notEqual(run(repo, 'git', ['config', '--local', '--get', 'core.hooksPath']).status, 0);
  }
});

test('automatic setup leaves containing repositories unchanged for source archives', t => {
  const repo = fixture(t);
  const archive = join(repo, 'source-archive');
  mkdirSync(archive);
  copySetup(archive);
  const result = automaticInstall(archive, { PATH: join(repo, 'empty-path') });
  success(result);
  assert.match(result.output, /no Git metadata/);
  assert.notEqual(run(repo, 'git', ['config', '--local', '--get', 'core.hooksPath']).status, 0);
});
