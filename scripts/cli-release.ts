import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageName = '@packetrove/cli';
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const deploymentSteps = [
  'Run project validation', 'Deploy API and MCP Worker', 'Deploy website and static assets',
  'Wait for deployed website version', 'Verify production website, API, and MCP',
];

export interface WorkflowRun {
  id: number;
  run_attempt: number;
  path: string;
  event: string;
  head_branch: string | null;
  head_sha: string;
  head_repository: { full_name: string } | null;
  status: string;
  conclusion: string | null;
}

export interface WorkflowJob {
  name: string;
  status: string;
  conclusion: string | null;
  steps: { name: string; conclusion: string | null }[];
}

export function releaseVersion(tag: string): string {
  const version = tag.startsWith('cli-v') ? tag.slice(5) : '';
  if (!stableVersion.test(version)) {
    throw new Error('A stable CLI release tag such as cli-v0.1.1 is required.');
  }
  return version;
}

export function assertReleaseVersions(tag: string, root: string, cli: string, manifest: string): string {
  const version = releaseVersion(tag);
  if ([root, cli, manifest].some(candidate => candidate !== version)) {
    throw new Error('The tag, root version, CLI version, and release manifest must agree.');
  }
  return version;
}

export function isValidatedMainRun(
  run: WorkflowRun, jobs: WorkflowJob[], repository: string, sha: string, requireDeployment = false,
): boolean {
  if (run.path !== '.github/workflows/ci.yml' || !['push', 'workflow_dispatch'].includes(run.event)
    || run.head_branch !== 'main' || run.head_sha !== sha || run.head_repository?.full_name !== repository
    || run.status !== 'completed' || run.conclusion !== 'success') return false;
  const requiredSteps = requireDeployment ? deploymentSteps : ['Run project validation'];
  return jobs.some(job => job.name === 'Validate project' && job.status === 'completed'
    && job.conclusion === 'success' && requiredSteps.every(name =>
      job.steps.some(step => step.name === name && step.conclusion === 'success')));
}

export function publicationRequired(expectedIntegrity: string, existingIntegrity: string | null): boolean {
  if (existingIntegrity === null) return true;
  if (existingIntegrity !== expectedIntegrity) {
    throw new Error('This npm version already exists with different contents. Published versions cannot be overwritten.');
  }
  return false;
}

export function assertPublishedCalculation(result: Record<string, unknown>): void {
  if (result.cidr !== '203.0.113.0/29' || result.inputAddressCount !== '3'
    || result.coveredAddressCount !== '8' || result.additionalAddressCount !== '5') {
    throw new Error('The published CLI returned an unexpected CIDR result.');
  }
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function output(name: string, value: string): void {
  appendFileSync(requiredEnvironment('GITHUB_OUTPUT'), `${name}=${value}\n`);
}

function summary(message: string): void {
  appendFileSync(requiredEnvironment('GITHUB_STEP_SUMMARY'), `${message}\n`);
}

async function github<T>(path: string, allowMissing = false): Promise<T | null> {
  const response = await fetch(`https://api.github.com/repos/${requiredEnvironment('GITHUB_REPOSITORY')}/${path}`, {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${requiredEnvironment('GH_TOKEN')}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 404 && allowMissing) return null;
  if (!response.ok) throw new Error(`GitHub API request failed (HTTP ${response.status}).`);
  return await response.json() as T;
}

async function requireValidatedRun(sha: string, runId?: number, requireDeployment = false): Promise<void> {
  const repository = requiredEnvironment('GITHUB_REPOSITORY');
  const runs = runId
    ? [await github<WorkflowRun>(`actions/runs/${runId}`)]
    : (await github<{ workflow_runs: WorkflowRun[] }>(
      `actions/workflows/ci.yml/runs?branch=main&head_sha=${sha}&per_page=100`,
    ))!.workflow_runs;
  for (const run of runs) {
    if (!run || run.status !== 'completed' || run.conclusion !== 'success') continue;
    const jobs: WorkflowJob[] = [];
    for (let page = 1; ; page++) {
      const batch = (await github<{ jobs: WorkflowJob[] }>(
        `actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100&page=${page}`,
      ))!.jobs;
      jobs.push(...batch);
      if (batch.length < 100) break;
    }
    if (isValidatedMainRun(run, jobs, repository, sha, requireDeployment)) return;
  }
  throw new Error('The exact release revision needs a successful main CI run with the required steps.');
}

async function prepare(): Promise<void> {
  const eventName = requiredEnvironment('GITHUB_EVENT_NAME');
  const event = JSON.parse(readFileSync(requiredEnvironment('GITHUB_EVENT_PATH'), 'utf8')) as {
    workflow_run?: WorkflowRun;
  };
  if (eventName === 'workflow_run') {
    const run = event.workflow_run;
    if (!run || !['push', 'workflow_dispatch'].includes(run.event) || run.head_branch !== 'main'
      || run.head_repository?.full_name !== requiredEnvironment('GITHUB_REPOSITORY') || run.conclusion !== 'success') {
      throw new Error('Release preparation accepts successful main runs from this repository only.');
    }
  } else if (eventName !== 'workflow_dispatch' || process.env.GITHUB_REF !== 'refs/heads/main') {
    throw new Error('Manual release preparation must run on main.');
  }
  const sha = git('rev-parse', 'HEAD');
  const main = (await github<{ object: { sha: string } }>('git/ref/heads/main'))!.object.sha;
  if (sha !== main) {
    output('ready', 'false');
    summary('CLI release preparation skipped: this revision has been superseded on main.');
    return;
  }
  await requireValidatedRun(sha, event.workflow_run?.id, true);
  const baseline = await github<{ draft: boolean; prerelease: boolean }>('releases/tags/cli-v0.1.0', true);
  if (!baseline || baseline.draft || baseline.prerelease) {
    output('ready', 'false');
    summary('CLI release preparation awaits the initial cli-v0.1.0 GitHub release. See docs/cli-publishing.md.');
    return;
  }
  output('ready', 'true');
}

async function validateRelease(tag: string): Promise<void> {
  if (process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' && process.env.GITHUB_REF !== 'refs/heads/main') {
    throw new Error('Manual publication recovery must be requested on main.');
  }
  const version = releaseVersion(tag);
  const release = await github<{ tag_name: string; draft: boolean; prerelease: boolean }>(
    `releases/tags/${encodeURIComponent(tag)}`,
  );
  if (!release || release.tag_name !== tag || release.draft || release.prerelease) {
    throw new Error('Publication requires an existing stable GitHub release for this tag.');
  }
  const sha = git('rev-parse', 'HEAD');
  if (sha !== git('rev-parse', `refs/tags/${tag}^{commit}`)) {
    throw new Error('The checkout must match the existing release tag.');
  }
  git('merge-base', '--is-ancestor', sha, 'origin/main');
  const root = JSON.parse(readFileSync('package.json', 'utf8'));
  const cli = JSON.parse(readFileSync('packages/cli/package.json', 'utf8'));
  const manifest = JSON.parse(readFileSync('.release-please-manifest.json', 'utf8'));
  assertReleaseVersions(tag, root.version, cli.version, manifest['.']);
  if (cli.name !== packageName || cli.private === true || cli.publishConfig?.access !== 'public') {
    throw new Error('The release must contain the public @packetrove/cli package.');
  }
  const npmVersion = execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim();
  const [major, minor, patch] = npmVersion.split('.').map(Number);
  if (!stableVersion.test(npmVersion) || major! < 11 || (major === 11 && (minor! < 5 || (minor === 5 && patch! < 1)))) {
    throw new Error('npm CLI 11.5.1 or later is required for trusted publishing.');
  }
  await requireValidatedRun(sha);
  output('version', version);
  summary(`Validated ${tag} at ${sha}. Publication uses this tag even if main advances.`);
}

export async function registryIntegrity(version: string): Promise<string | null> {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/${version}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`npm registry request failed (HTTP ${response.status}).`);
  const metadata = await response.json() as { name?: string; version?: string; dist?: { integrity?: string } };
  if (metadata.name !== packageName || metadata.version !== version || !metadata.dist?.integrity) {
    throw new Error('npm returned incomplete or mismatched package metadata.');
  }
  return metadata.dist.integrity;
}

async function checkRegistry(tag: string, archive: string, verify: boolean): Promise<void> {
  const version = releaseVersion(tag);
  const integrity = `sha512-${createHash('sha512').update(readFileSync(archive)).digest('base64')}`;
  for (let attempt = 0; ; attempt++) {
    const existing = await registryIntegrity(version);
    const publish = publicationRequired(integrity, existing);
    if (!verify) {
      output('publish', String(publish));
      if (!publish) summary(`@packetrove/cli@${version} already contains this archive; continuing with verification.`);
      return;
    }
    if (!publish) return;
    if (attempt >= 4) throw new Error('The published npm version is not yet visible in the registry.');
    await new Promise(resolveWait => setTimeout(resolveWait, 2_000));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, tag, archive] = process.argv.slice(2);
    if (command === 'prepare') await prepare();
    else if (command === 'release' && tag) await validateRelease(tag);
    else if ((command === 'registry' || command === 'registry-verify') && tag && archive) {
      await checkRegistry(tag, archive, command === 'registry-verify');
    } else if (command === 'verify' && tag) {
      assertPublishedCalculation(JSON.parse(readFileSync(tag, 'utf8')));
    } else throw new Error('Unknown CLI release check or missing arguments.');
  } catch (failure) {
    console.error(failure instanceof Error ? failure.message : 'CLI release validation failed.');
    process.exitCode = 1;
  }
}
