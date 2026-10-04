import { expect, it } from 'vitest';
import { isValidatedEnvironmentRun, selectDeploymentBranch } from './environment-deployment';
import type { WorkflowJob, WorkflowRun } from './cli-release';

it('deploys develop after cutover and permits main only for initial development bootstrap', () => {
  expect(selectDeploymentBranch('development', ['main'])).toBe('main');
  expect(selectDeploymentBranch('development', ['main', 'develop'])).toBe('develop');
  expect(() => selectDeploymentBranch('development', ['main', 'develop'], 'main')).toThrow('must use develop');
});

it('keeps staging on its single candidate while main and develop advance', () => {
  const branches = ['main', 'develop', 'release-0.5.0'];
  expect(selectDeploymentBranch('staging', branches)).toBe('release-0.5.0');
  expect(selectDeploymentBranch('staging', branches, 'release-0.5.0', true)).toBe('release-0.5.0');
  expect(selectDeploymentBranch('staging', branches, 'main', true)).toBeNull();
  expect(selectDeploymentBranch('staging', branches, 'develop', true)).toBeNull();
  expect(() => selectDeploymentBranch('staging', branches, 'main')).toThrow('must use release-0.5.0');
  expect(() => selectDeploymentBranch('staging', [...branches, 'release-0.6.0'])).toThrow('multiple');
});

it('returns staging to main after release cleanup and ignores legacy preparation branches', () => {
  expect(selectDeploymentBranch('staging', ['main', 'develop', 'release-please--branches--main'])).toBe('main');
});

it('requires successful validation of the exact branch revision from this repository', () => {
  const run = { path: '.github/workflows/ci.yml', event: 'push', head_branch: 'develop', head_sha: 'a'.repeat(40),
    head_repository: { full_name: 'euyuil/packetrove' }, status: 'completed', conclusion: 'success' } as WorkflowRun;
  const jobs = [{ name: 'Validate project', status: 'completed', conclusion: 'success',
    steps: [{ name: 'Run project validation', conclusion: 'success' }] }] as WorkflowJob[];
  expect(isValidatedEnvironmentRun(run, jobs, 'euyuil/packetrove', run.head_sha, 'develop')).toBe(true);
  for (const invalid of [{ event: 'pull_request' }, { head_sha: 'b'.repeat(40) }, { head_branch: 'release-0.5.0' },
    { conclusion: 'failure' }, { head_repository: { full_name: 'example/fork' } }]) {
    expect(isValidatedEnvironmentRun({ ...run, ...invalid }, jobs, 'euyuil/packetrove', run.head_sha, 'develop')).toBe(false);
  }
  expect(isValidatedEnvironmentRun(run, [], 'euyuil/packetrove', run.head_sha, 'develop')).toBe(false);
});
