import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { Manifest, setLogger } from 'release-please';
import type { Commit, GitHub, PullRequest } from 'release-please';
import { isCliReleaseInput, registerCliRelease } from './cli-release-please';

const baselineSha = 'a'.repeat(40);
const releaseSha = 'b'.repeat(40);
const silentLogger = { error() {}, warn() {}, info() {}, debug() {}, trace() {} };

function fixtureGithub(commits: Commit[], version = '0.1.0', merged: PullRequest[] = []): GitHub {
  return {
    repository: { owner: 'example', repo: 'packetrove', defaultBranch: 'main' },
    async getFileJson(path: string) {
      if (path === '.release-please-manifest.json') return { '.': version };
      return JSON.parse(readFileSync(path, 'utf8'));
    },
    async getFileContentsOnBranch(path: string) {
      return { parsedContent: readFileSync(path, 'utf8') };
    },
    async *releaseIterator() {
      yield { tagName: `cli-${version}`, sha: baselineSha, notes: 'Initial CLI release.' };
    },
    async *mergeCommitIterator() {
      yield* commits;
      yield { sha: baselineSha, message: 'chore(cli): initial release', files: [] };
    },
    async *pullRequestIterator(_branch: string, state: string) {
      if (state === 'MERGED') yield* merged;
    },
  } as unknown as GitHub;
}

async function candidate(message: string, files: string[], version = '0.1.0') {
  const github = fixtureGithub([{ sha: releaseSha, message, files }], version);
  const manifest = await Manifest.fromManifest(github, 'main');
  return (await manifest.buildPullRequests())[0];
}

beforeAll(() => {
  registerCliRelease();
  setLogger(silentLogger);
});

describe('release-please CLI component', () => {
  it.each([
    ['fix(cli): correct output', ['packages/cli/src/cli.ts'], '0.1.1'],
    ['feat(core): add a calculation', ['packages/core/src/index.ts'], '0.2.0'],
    ['fix(contracts): validate a result', ['packages/contracts/src/index.ts'], '0.1.1'],
    ['fix(cli): update bundle dependencies', ['packages/core/package.json', 'pnpm-lock.yaml'], '0.1.1'],
    ['fix: update shared build settings', ['.node-version'], '0.1.1'],
    ['feat(cli)!: change input format', ['packages/cli/src/cli.ts'], '0.2.0'],
  ])('builds the actual candidate for %s', async (message, files, version) => {
    const pullRequest = await candidate(message as string, files as string[]);
    expect(pullRequest?.version?.toString()).toBe(version);
    expect(pullRequest?.title.toString()).toBe(`chore(cli): release ${version}`);
  });
  it.each([
    ['apps/web/src/App.tsx'], ['apps/worker/src/index.ts'], ['README.md'],
    ['pnpm-lock.yaml'], ['apps/web/package.json', 'pnpm-lock.yaml'],
    ['docs/cli-publishing.md'], ['.github/workflows/publish-cli.yml'], ['scripts/cli-release.ts'],
    ['packages/core-other/src/index.ts'],
  ])('does not release a website or tooling feature changing %j', async (...files) => {
    expect(await candidate('feat(web): update website', files)).toBeUndefined();
  });
  it('ignores documentation and chores even within CLI packages', async () => {
    expect(await candidate('docs(cli): clarify help', ['packages/cli/README.md'])).toBeUndefined();
    expect(await candidate('chore(cli): reorganize tests', ['packages/cli/test/cli.test.ts'])).toBeUndefined();
  });
  it('includes bundled changes in mixed commits and omits unrelated features from release notes', async () => {
    const github = fixtureGithub([
      { sha: releaseSha, message: 'feat(web): add a website widget', files: ['apps/web/package.json', 'pnpm-lock.yaml'] },
      { sha: 'c'.repeat(40), message: 'fix(core): correct calculation', files: ['packages/core/src/index.ts', 'apps/web/src/App.tsx'] },
    ]);
    const manifest = await Manifest.fromManifest(github, 'main');
    const pullRequest = (await manifest.buildPullRequests())[0];
    expect(pullRequest?.version?.toString()).toBe('0.1.1');
    expect(pullRequest?.body.toString()).toContain('correct calculation');
    expect(pullRequest?.body.toString()).not.toContain('website widget');
  });
  it('updates CLI, root, manifest, and changelog together and builds a release only from a merged PR', async () => {
    const pullRequest = await candidate('fix(cli): correct output', ['packages/cli/src/cli.ts']);
    expect(pullRequest).toBeDefined();
    for (const [path, key] of [['package.json', 'version'], ['packages/cli/package.json', 'version'], ['.release-please-manifest.json', '.']]) {
      const update = pullRequest!.updates.find(update => update.path === path);
      expect(update, path).toBeDefined();
      const updated = JSON.parse(update!.updater.updateContent(readFileSync(path!, 'utf8')));
      expect(updated[key!]).toBe('0.1.1');
    }
    const changelog = pullRequest!.updates.find(update => update.path === 'packages/cli/CHANGELOG.md');
    expect(changelog?.updater.updateContent(readFileSync('packages/cli/CHANGELOG.md', 'utf8'))).toContain('0.1.1');
    const github = fixtureGithub([], '0.1.1', [{
      number: 1, title: pullRequest!.title.toString(), body: pullRequest!.body.toString(),
      headBranchName: pullRequest!.headRefName, baseBranchName: 'main', labels: pullRequest!.labels,
      files: pullRequest!.updates.map(update => update.path), mergeCommitOid: releaseSha, sha: releaseSha,
    }]);
    const manifest = await Manifest.fromManifest(github, 'main');
    const releases = await manifest.buildReleases();
    expect(releases).toHaveLength(1);
    expect(releases[0]?.tag.toString()).toBe('cli-0.1.1');
    expect(releases[0]?.name).toBe('cli: 0.1.1');
    expect(releases[0]?.sha).toBe(releaseSha);
    expect(await (await Manifest.fromManifest(fixtureGithub([]), 'main')).buildReleases()).toEqual([]);
  });
  it('bumps the major version for breaking changes after 1.0 and permits explicit graduation', async () => {
    expect((await candidate('feat(cli)!: change input format', ['packages/cli/src/cli.ts'], '1.0.0'))?.version?.toString()).toBe('2.0.0');
    expect((await candidate('chore(cli): graduate to stable\n\nRelease-As: 1.0.0', []))?.version?.toString()).toBe('1.0.0');
    expect(await candidate('feat(web): empty website change', [])).toBeUndefined();
  });
  it('checks shared build inputs without matching similar unrelated paths', () => {
    for (const path of ['package.json', 'pnpm-workspace.yaml', '.node-version', 'tsconfig.base.json', 'LICENSE']) {
      expect(isCliReleaseInput(path), path).toBe(true);
    }
    expect(isCliReleaseInput('package.json.backup')).toBe(false);
    expect(isCliReleaseInput('packages/core-other/package.json')).toBe(false);
  });
});
