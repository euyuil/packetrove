import { expect, it } from 'vitest';
import type { ReleasePullRequest } from 'release-please';
import { Version } from 'release-please/build/src/version.js';
import { assertAcceptedCandidate, assertNextVersion, compareVersions, lifecycleMergeMethod, preparationBranch } from './release-policy';
import { buildCandidateUpdates } from './release-candidate';

it('uses the published baseline without skipping a failed candidate version', () => {
  for (const version of ['0.4.1', '0.5.0', '1.0.0']) expect(() => assertNextVersion('0.4.0', version)).not.toThrow();
  for (const version of ['0.4.0', '0.4.2', '0.6.0', '2.0.0', '0.5.0-beta.1']) {
    expect(() => assertNextVersion('0.4.0', version)).toThrow();
  }
  expect(() => assertNextVersion('0.4.0', '0.4.1', true)).not.toThrow();
  expect(() => assertNextVersion('0.4.0', '0.5.0', true)).toThrow();
  expect(compareVersions('0.10.0', '0.9.9')).toBe(1);
});

it('keeps preparation branches outside protected release patterns', () => {
  expect(preparationBranch('release-0.5.0', '0.5.0')).toBe('automation/prepare-release-0.5.0');
  expect(preparationBranch('main', '0.4.1')).toBe('automation/prepare-hotfix-0.4.1');
  expect(() => preparationBranch('release-0.6.0', '0.5.0')).toThrow();
});

it('preserves ancestry for promotion, synchronization, and conflict-resolution bridge PRs', () => {
  for (const [source, target] of [['release-0.5.0', 'main'], ['main', 'develop'], ['main', 'release-0.5.0'],
    ['automation/sync-main-to-develop', 'develop']]) expect(lifecycleMergeMethod(source!, target!)).toBe('merge');
  expect(() => lifecycleMergeMethod('feature/example', 'main')).toThrow();
});

it('requires renewed acceptance after candidate or main changes', () => {
  const sha = 'a'.repeat(40);
  expect(() => assertAcceptedCandidate(sha, sha, true)).not.toThrow();
  expect(() => assertAcceptedCandidate(sha, 'b'.repeat(40), true)).toThrow('accept changes again');
  expect(() => assertAcceptedCandidate(sha, sha, false)).toThrow('Synchronize');
});

it('rejects an unexpected version or file before preparing a metadata PR', async () => {
  const candidate = { version: Version.parse('0.5.0'), updates: [{ path: 'package.json' }] } as ReleasePullRequest;
  await expect(buildCandidateUpdates({ buildPullRequests: async () => [candidate] }, '0.5.0')).resolves.toBe(candidate);
  await expect(buildCandidateUpdates({ buildPullRequests: async () => [candidate] }, '0.6.0')).rejects.toThrow('exactly');
  await expect(buildCandidateUpdates({ buildPullRequests: async () => [] }, '0.5.0')).rejects.toThrow('exactly');
  await expect(buildCandidateUpdates({ buildPullRequests: async () => [{ ...candidate,
    updates: [{ path: '.github/workflows/ci.yml' }] as ReleasePullRequest['updates'] }] }, '0.5.0')).rejects.toThrow('only');
});
