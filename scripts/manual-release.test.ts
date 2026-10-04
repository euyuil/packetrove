import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mergePull, staging } from './manual-release';

const sha = 'a'.repeat(40);
const pull = { number: 42, html_url: 'https://github.com/example/project/pull/42', title: 'chore(release): release 0.5.0',
  state: 'open', merged: false, merge_commit_sha: null,
  head: { ref: 'release-0.5.0', sha }, base: { ref: 'main', sha: 'b'.repeat(40) } };
const run = { id: 123, run_attempt: 2, path: '.github/workflows/ci.yml', event: 'pull_request',
  head_branch: pull.head.ref, head_sha: sha, head_repository: { full_name: 'example/project' },
  display_title: 'CI PR #42', status: 'completed', conclusion: 'success' };
const job = { name: 'Validate project', status: 'completed', conclusion: 'success',
  steps: [{ name: 'Run project validation', conclusion: 'success' }] };
let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'packetrove-release-test-'));
  vi.stubEnv('GITHUB_REPOSITORY', 'example/project');
  vi.stubEnv('GITHUB_STEP_SUMMARY', join(directory, 'summary.md'));
  vi.stubEnv('GH_TOKEN', 'test-read-token');
  vi.stubEnv('RELEASE_TOKEN', 'test-app-token');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  rmSync(directory, { recursive: true, force: true });
});

function api(reply: (path: string, init: RequestInit) => unknown) {
  const fetcher = vi.fn(async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname.replace('/repos/example/project/', '');
    return Response.json(reply(path, init));
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}

it('matches the exact PR run and attempt, reads the jobs envelope, and uses the App for a normal merge', async () => {
  vi.useFakeTimers();
  let rerun = false;
  const fetcher = api((path, init) => {
    if (path === 'pulls/42') return pull;
    if (path === 'actions/workflows/ci.yml/runs') return { workflow_runs: [
      { ...run, display_title: 'CI PR #43' }, { ...run, head_sha: 'c'.repeat(40) }, { ...run, run_attempt: rerun ? 3 : 2 },
    ] };
    if (path === 'actions/runs/123/rerun') { rerun = true; return {}; }
    if (path === 'actions/runs/123/attempts/3/jobs') return { jobs: [job] };
    if (path === 'pulls/42/merge') {
      expect(JSON.parse(init.body as string)).toMatchObject({ sha, merge_method: 'merge' });
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-app-token');
      return { merged: true, sha: 'd'.repeat(40) };
    }
    throw new Error(`Unexpected test request: ${path}`);
  });
  const merged = mergePull(pull, 'merge', sha);
  await vi.advanceTimersByTimeAsync(15_000);
  await expect(merged).resolves.toBe('d'.repeat(40));
  expect(fetcher).toHaveBeenCalledTimes(7);
});

it('refuses stale acceptance and changed base revisions before sending a merge', async () => {
  vi.useFakeTimers();
  const first = api(() => pull);
  await expect(mergePull(pull, 'merge', 'c'.repeat(40))).rejects.toThrow('Repeat acceptance');
  expect(first).toHaveBeenCalledTimes(1);
  let reads = 0;
  let rerun = false;
  const fetcher = api(path => {
    if (path === 'pulls/42') return ++reads === 1 ? pull : { ...pull, base: { ...pull.base, sha: 'e'.repeat(40) } };
    if (path === 'actions/workflows/ci.yml/runs') return { workflow_runs: [{ ...run, run_attempt: rerun ? 3 : 2 }] };
    if (path === 'actions/runs/123/rerun') { rerun = true; return {}; }
    if (path === 'actions/runs/123/attempts/3/jobs') return { jobs: [job] };
    throw new Error(`Unexpected test request: ${path}`);
  });
  const merged = expect(mergePull(pull, 'merge', sha)).rejects.toThrow('changed during validation');
  await vi.advanceTimersByTimeAsync(15_000);
  await merged;
  expect(fetcher.mock.calls.every(([url]) => !url.endsWith('/merge'))).toBe(true);
});

it('rejects the latest failed PR attempt even if an earlier attempt succeeded', async () => {
  const fetcher = api(path => {
    if (path === 'pulls/42') return pull;
    if (path === 'actions/workflows/ci.yml/runs') return { workflow_runs: [
      { ...run, run_attempt: 3, conclusion: 'failure' }, run,
    ] };
    throw new Error(`Unexpected test request: ${path}`);
  });
  await expect(mergePull(pull, 'squash')).rejects.toThrow('validation failed');
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('accepts staging only from the recorded successful deployment workflow attempt', async () => {
  const deployment = { id: 77, sha, payload: { workflow: 'deploy-environment.yml', runId: '123', runAttempt: '2' } };
  const stagingRun = { ...run, path: '.github/workflows/deploy-environment.yml' };
  api(path => {
    if (path === 'deployments') return [{ id: 78, sha, payload: {} }, deployment];
    if (path === 'deployments/77/statuses') return [{ state: 'success' }];
    if (path === 'actions/runs/123') return stagingRun;
    throw new Error(`Unexpected test request: ${path}`);
  });
  await expect(staging(sha)).resolves.toBeUndefined();
  stagingRun.run_attempt = 3;
  await expect(staging(sha)).rejects.toThrow('recorded staging workflow attempt');
});
