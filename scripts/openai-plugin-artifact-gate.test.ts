import { afterEach, describe, expect, it, vi } from 'vitest';
import { requireValidatedRun } from './cli-release';
import { assertArtifactRevision } from './openai-plugin-artifact-gate';

const commit = 'a'.repeat(40);
const run = {
  id: 7, run_attempt: 3, path: '.github/workflows/ci.yml', event: 'push', head_branch: 'main', head_sha: commit,
  head_repository: { full_name: 'example/packetrove' }, status: 'completed', conclusion: 'success',
};
const job = {
  name: 'Validate project', status: 'completed', conclusion: 'success',
  steps: [{ name: 'Run project validation', conclusion: 'success' }],
};
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function github(runs: unknown[], jobs: unknown[]) {
  vi.stubEnv('GITHUB_REPOSITORY', 'example/packetrove');
  vi.stubEnv('GH_TOKEN', 'fixture-token');
  const fetch = vi.fn(async (url: string) => Response.json(url.includes('/jobs?') ? { jobs } : { workflow_runs: runs }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('manual plugin artifact source gate', () => {
  it('accepts only a full matching SHA that is already on main', () => {
    expect(() => assertArtifactRevision(commit, commit, true)).not.toThrow();
    for (const requested of ['main', '0.3.0', commit.slice(0, 7), 'A'.repeat(40), `${commit};example`]) {
      expect(() => assertArtifactRevision(requested, commit, true)).toThrow();
    }
    expect(() => assertArtifactRevision(commit, 'b'.repeat(40), true)).toThrow();
    expect(() => assertArtifactRevision(commit, commit, false)).toThrow();
  });
  it('requires validation of the same main commit and latest run attempt, without requiring deployment', async () => {
    const fetch = github([run], [job]);
    await expect(requireValidatedRun(commit)).resolves.toBeUndefined();
    expect(fetch.mock.calls.map(call => call[0])).toContain(
      'https://api.github.com/repos/example/packetrove/actions/runs/7/attempts/3/jobs?per_page=100&page=1',
    );
  });
  it.each([
    { event: 'pull_request' }, { head_branch: 'feature' }, { head_sha: 'b'.repeat(40) },
    { head_repository: { full_name: 'other/packetrove' } }, { path: '.github/workflows/unrelated.yml' },
    { status: 'in_progress' }, { conclusion: 'failure' },
  ])('rejects unrelated, unmerged, or unsuccessful CI evidence %j', async override => {
    github([{ ...run, ...override }], [job]);
    await expect(requireValidatedRun(commit)).rejects.toThrow('successful main CI');
  });
  it('rejects missing, skipped, or differently named validation steps and missing runs', async () => {
    for (const jobs of [[], [{ ...job, name: 'Other check' }], [{ ...job, steps: [] }],
      [{ ...job, steps: [{ name: 'Run project validation', conclusion: 'skipped' }] }]]) {
      github([run], jobs);
      await expect(requireValidatedRun(commit)).rejects.toThrow('successful main CI');
    }
    github([], [job]);
    await expect(requireValidatedRun(commit)).rejects.toThrow('successful main CI');
  });
  it('fails on GitHub API errors instead of treating them as validation evidence', async () => {
    github([run], [job]);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 403 })));
    await expect(requireValidatedRun(commit)).rejects.toThrow('HTTP 403');
  });
});
