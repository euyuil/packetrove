import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertPublishedCalculation, assertReleaseVersions, isValidatedMainRun, publicationRequired, registryIntegrity, releaseVersion,
} from './cli-release';
import type { WorkflowJob, WorkflowRun } from './cli-release';

const repository = 'example/packetrove';
const sha = 'a'.repeat(40);
const run: WorkflowRun = {
  id: 1, run_attempt: 1, path: '.github/workflows/ci.yml', event: 'push', head_branch: 'main', head_sha: sha,
  head_repository: { full_name: repository }, status: 'completed', conclusion: 'success',
};
const job: WorkflowJob = {
  name: 'Validate project', status: 'completed', conclusion: 'success',
  steps: [
    'Run project validation', 'Deploy API and MCP Worker', 'Deploy website and static assets',
    'Wait for deployed website version', 'Verify production website, API, and MCP',
  ].map(name => ({ name, conclusion: 'success' })),
};

afterEach(() => vi.unstubAllGlobals());

describe('CLI release validation', () => {
  it.each(['cli-v0.1.0', 'cli-v0.1.1', 'cli-v0.2.0', 'cli-v1.0.0'])('accepts stable CLI tag %s', tag => {
    expect(releaseVersion(tag)).toBe(tag.slice(5));
  });
  it.each(['v0.1.0', 'web-v0.1.0', 'cli-v01.1.0', 'cli-v0.1', 'cli-v0.1.0-beta.1', 'cli-v0.1.0+build', 'cli-v0.1.0\n'])(
    'rejects malformed or unrelated release tag %s', tag => {
      expect(() => releaseVersion(tag)).toThrow();
    },
  );
  it('requires matching versions in every release file', () => {
    expect(assertReleaseVersions('cli-v0.2.0', '0.2.0', '0.2.0', '0.2.0')).toBe('0.2.0');
    for (const versions of [['0.1.0', '0.2.0', '0.2.0'], ['0.2.0', '0.1.0', '0.2.0'], ['0.2.0', '0.2.0', '0.1.0']]) {
      expect(() => assertReleaseVersions('cli-v0.2.0', versions[0]!, versions[1]!, versions[2]!)).toThrow();
    }
  });
  it('accepts completed validation and deployment of the exact main revision', () => {
    expect(isValidatedMainRun(run, [job], repository, sha, true)).toBe(true);
    expect(isValidatedMainRun({ ...run, event: 'workflow_dispatch' }, [job], repository, sha, true)).toBe(true);
  });
  it.each([
    { event: 'pull_request' }, { head_branch: 'feature' }, { head_sha: 'b'.repeat(40) },
    { head_repository: { full_name: 'other/packetrove' } }, { head_repository: null },
    { path: '.github/workflows/other.yml' }, { status: 'in_progress' }, { conclusion: 'failure' },
  ])('rejects unqualified workflow run %j', override => {
    expect(isValidatedMainRun({ ...run, ...override }, [job], repository, sha)).toBe(false);
  });
  it('does not treat skipped deployment as live verification', () => {
    const skipped = { ...job, steps: job.steps.map(step => ({ ...step, conclusion: step.name === 'Run project validation' ? 'success' : 'skipped' })) };
    expect(isValidatedMainRun(run, [skipped], repository, sha, true)).toBe(false);
    // A tagged CLI can still use the successful validation of this older main revision.
    expect(isValidatedMainRun(run, [skipped], repository, sha)).toBe(true);
    expect(isValidatedMainRun(run, [{ ...job, steps: [] }], repository, sha)).toBe(false);
    expect(isValidatedMainRun(run, [{ ...job, conclusion: 'failure' }], repository, sha)).toBe(false);
  });
  it('publishes absent versions and safely retries identical archives', () => {
    expect(publicationRequired('sha512-reviewed', null)).toBe(true);
    expect(publicationRequired('sha512-reviewed', 'sha512-reviewed')).toBe(false);
    expect(() => publicationRequired('sha512-reviewed', 'sha512-other')).toThrow('different contents');
    expect(() => publicationRequired('sha512-reviewed', '')).toThrow('different contents');
  });
  it('treats only a registry 404 as an absent version', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    expect(await registryIntegrity('0.1.0')).toBeNull();
  });
  it.each([401, 403, 429, 500])('stops on registry HTTP %s rather than attempting a new upload', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
    await expect(registryIntegrity('0.1.0')).rejects.toThrow(`HTTP ${status}`);
  });
  it('checks registry identity and integrity before allowing a retry', async () => {
    const metadata = { name: '@packetrove/cli', version: '0.1.0', dist: { integrity: 'sha512-reviewed' } };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(metadata));
    vi.stubGlobal('fetch', fetchMock);
    expect(await registryIntegrity('0.1.0')).toBe('sha512-reviewed');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://registry.npmjs.org/%40packetrove%2Fcli/0.1.0');
    for (const invalid of [{ ...metadata, name: 'other' }, { ...metadata, version: '0.2.0' }, { ...metadata, dist: {} }]) {
      fetchMock.mockResolvedValueOnce(Response.json(invalid));
      await expect(registryIntegrity('0.1.0')).rejects.toThrow('mismatched');
    }
  });
  it('checks the isolated published command and exact decimal-string counts', () => {
    const result = { cidr: '203.0.113.0/29', inputAddressCount: '3', coveredAddressCount: '8', additionalAddressCount: '5' };
    expect(() => assertPublishedCalculation(result)).not.toThrow();
    expect(() => assertPublishedCalculation({ ...result, coveredAddressCount: 8 })).toThrow();
    expect(() => assertPublishedCalculation({ ...result, additionalAddressCount: '0' })).toThrow();
  });
});
