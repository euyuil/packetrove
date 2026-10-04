import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidatedMainRun, type WorkflowJob, type WorkflowRun } from './cli-release';

export type DeploymentEnvironment = 'development' | 'staging';
export const environmentOrigins = {
  development: { website: 'https://dev.packetrove.com', api: 'https://api.dev.packetrove.com' },
  staging: { website: 'https://staging.packetrove.com', api: 'https://api.staging.packetrove.com' },
} as const;
const candidateBranch = /^release-(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function selectDeploymentBranch(environment: DeploymentEnvironment, branches: string[],
  requested = '', automatic = false): string | null {
  const candidates = branches.filter(branch => candidateBranch.test(branch));
  if (environment === 'staging' && candidates.length > 1) {
    throw new Error('Resolve multiple release candidates before deploying staging.');
  }
  const expected = environment === 'development'
    ? (branches.includes('develop') ? 'develop' : 'main') : (candidates[0] ?? 'main');
  if (requested && requested !== expected) {
    if (automatic) return null;
    throw new Error(`The ${environment} environment must use ${expected}.`);
  }
  return expected;
}

export function isValidatedEnvironmentRun(run: WorkflowRun, jobs: WorkflowJob[], repository: string,
  sha: string, branch: string): boolean {
  if (branch === 'main') return isValidatedMainRun(run, jobs, repository, sha, true);
  return run.path === '.github/workflows/ci.yml' && ['push', 'workflow_dispatch'].includes(run.event)
    && run.head_branch === branch && run.head_sha === sha && run.head_repository?.full_name === repository
    && run.status === 'completed' && run.conclusion === 'success'
    && jobs.some(job => job.name === 'Validate project' && job.status === 'completed' && job.conclusion === 'success'
      && job.steps.some(step => step.name === 'Run project validation' && step.conclusion === 'success'));
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function output(name: string, value: string): void {
  appendFileSync(required('GITHUB_OUTPUT'), `${name}=${value}\n`);
}

async function github<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`https://api.github.com/repos/${required('GITHUB_REPOSITORY')}/${path}`, {
    method, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${required('GH_TOKEN')}`,
      'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Deployment API request failed (HTTP ${response.status}).`);
  return await response.json() as T;
}

async function plan(): Promise<void> {
  const event = JSON.parse(readFileSync(required('GITHUB_EVENT_PATH'), 'utf8')) as { workflow_run?: WorkflowRun };
  const automatic = process.env.GITHUB_EVENT_NAME === 'workflow_run';
  if (!automatic && (process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || process.env.GITHUB_REF !== 'refs/heads/main')) {
    throw new Error('Manual environment deployment must run on main.');
  }
  const environment = required('DEPLOYMENT_ENVIRONMENT');
  if (environment !== 'development' && environment !== 'staging') throw new Error('Unknown deployment environment.');
  const branches: { name: string; commit: { sha: string } }[] = [];
  for (let page = 1; ; page++) {
    const batch = await github<typeof branches>(`branches?per_page=100&page=${page}`);
    branches.push(...batch);
    if (batch.length < 100) break;
  }
  const branch = selectDeploymentBranch(environment, branches.map(item => item.name),
    automatic ? event.workflow_run?.head_branch ?? '' : process.env.SOURCE_REF ?? '', automatic);
  const sha = branches.find(item => item.name === branch)?.commit.sha;
  if (!branch || !sha || (automatic && event.workflow_run?.head_sha !== sha)
    || (process.env.EXPECTED_DEPLOYMENT_SHA && process.env.EXPECTED_DEPLOYMENT_SHA !== sha)) {
    output('deploy', 'false');
    return;
  }
  const runs = automatic ? [event.workflow_run!] : (await github<{ workflow_runs: WorkflowRun[] }>(
    `actions/workflows/ci.yml/runs?branch=${encodeURIComponent(branch)}&head_sha=${sha}&per_page=100`,
  )).workflow_runs;
  let validated = false;
  for (const run of runs) {
    if (!run || run.status !== 'completed' || run.conclusion !== 'success') continue;
    const jobs: WorkflowJob[] = [];
    for (let page = 1; ; page++) {
      const batch = (await github<{ jobs: WorkflowJob[] }>(
        `actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100&page=${page}`,
      )).jobs;
      jobs.push(...batch);
      if (batch.length < 100) break;
    }
    if (isValidatedEnvironmentRun(run, jobs, required('GITHUB_REPOSITORY'), sha, branch)) { validated = true; break; }
  }
  if (!validated) throw new Error('The selected revision has no successful branch CI run.');
  output('deploy', 'true');
  output('sha', sha);
  output('branch', branch);
  output('website', environmentOrigins[environment].website);
  output('api', environmentOrigins[environment].api);
}

async function recordDeployment(status?: string): Promise<void> {
  if (!status) {
    const deployment = await github<{ id: number }>('deployments', 'POST', {
      ref: required('DEPLOYMENT_SHA'), environment: required('DEPLOYMENT_ENVIRONMENT'),
      auto_merge: false, required_contexts: [], production_environment: false,
      description: 'Validated Packetrove environment deployment',
      payload: { workflow: 'deploy-environment.yml', runId: required('GITHUB_RUN_ID'),
        runAttempt: required('GITHUB_RUN_ATTEMPT') },
    });
    output('deployment_id', String(deployment.id));
    await github(`deployments/${deployment.id}/statuses`, 'POST', { state: 'in_progress', auto_inactive: false });
  } else {
    if (status !== 'success' && status !== 'failure') throw new Error('Invalid deployment status.');
    await github(`deployments/${required('DEPLOYMENT_ID')}/statuses`, 'POST', {
      state: status, auto_inactive: status === 'success',
      environment_url: environmentOrigins[required('DEPLOYMENT_ENVIRONMENT') as DeploymentEnvironment].website,
      log_url: `https://github.com/${required('GITHUB_REPOSITORY')}/actions/runs/${required('GITHUB_RUN_ID')}`,
    });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, status] = process.argv.slice(2);
    if (command === 'plan') await plan();
    else if (command === 'record') await recordDeployment(status);
    else throw new Error('Unknown environment deployment command.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Environment deployment failed.');
    process.exitCode = 1;
  }
}
