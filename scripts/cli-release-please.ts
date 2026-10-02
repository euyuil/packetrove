import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitHub, Manifest, registerReleaseType } from 'release-please';
import type { ConventionalCommit } from 'release-please';
import { Node } from 'release-please/build/src/strategies/node.js';

const bundledPackages = ['packages/cli', 'packages/core', 'packages/contracts'];
const sharedBuildInputs = new Set([
  'package.json', 'pnpm-workspace.yaml', '.node-version', 'tsconfig.base.json', 'LICENSE',
]);

export function isCliReleaseInput(path: string): boolean {
  return sharedBuildInputs.has(path) || bundledPackages.some(directory => path.startsWith(`${directory}/`));
}

// The root component groups bundled packages without publishing the private workspaces.
// Filter before versioning: release-please's exclude-paths only matches directories.
export class CliRelease extends Node {
  protected override async postProcessCommits(commits: ConventionalCommit[]): Promise<ConventionalCommit[]> {
    return commits.filter(commit => {
      if (!commit.files) throw new Error('CLI release commits must include their changed files.');
      return commit.files.some(isCliReleaseInput) || (commit.files.length === 0 && commit.scope === 'cli');
    });
  }
}

export function registerCliRelease(): void {
  registerReleaseType('packetrove-cli', options => new CliRelease(options));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
    const token = process.env.RELEASE_TOKEN;
    if (!owner || !repo || !token) throw new Error('Release preparation requires a repository and GitHub App token.');
    registerCliRelease();
    const github = await GitHub.create({ owner, repo, token, defaultBranch: 'main' });
    const manifest = await Manifest.fromManifest(github, 'main', 'release-please-config.json', '.release-please-manifest.json');
    await manifest.createReleases();
    await manifest.createPullRequests();
  } catch {
    // Upstream API errors can contain request headers; keep token values out of public logs.
    console.error('CLI release preparation failed. Check the App permissions, release baseline, and repository configuration.');
    process.exitCode = 1;
  }
}
