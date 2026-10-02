import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitHub, Manifest, registerReleaseType } from 'release-please';
import type { BuildUpdatesOptions, ConventionalCommit } from 'release-please';
import { Node } from 'release-please/build/src/strategies/node.js';
import { RawContent } from 'release-please/build/src/updaters/raw-content.js';
import { createMcpGuideMarkdown } from './mcp-guide-markdown';

const productDirectories = ['packages/cli', 'packages/core', 'packages/contracts', 'apps/web', 'apps/worker'];
const sharedBuildInputs = new Set([
  'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml', '.node-version', 'tsconfig.base.json', 'LICENSE',
  'scripts/openapi.ts', 'scripts/api-assets.ts',
]);

export function isProductReleaseInput(path: string): boolean {
  return sharedBuildInputs.has(path) || productDirectories.some(directory => path.startsWith(`${directory}/`));
}

// One root component versions the product without publishing private workspaces.
// Filter before versioning: release-please's exclude-paths only matches directories.
export class PacketroveRelease extends Node {
  protected override async buildUpdates(options: BuildUpdatesOptions) {
    const updates = await super.buildUpdates(options);
    updates.push({
      path: 'docs/integrations/mcp.md',
      createIfMissing: false,
      updater: new RawContent(createMcpGuideMarkdown(options.newVersion.toString())),
    });
    return updates;
  }

  protected override async postProcessCommits(commits: ConventionalCommit[]): Promise<ConventionalCommit[]> {
    return commits.filter(commit => {
      if (!commit.files) throw new Error('Product release commits must include their changed files.');
      return commit.files.some(isProductReleaseInput) || (commit.files.length === 0 && commit.scope === 'release');
    });
  }
}

export function registerPacketroveRelease(): void {
  registerReleaseType('packetrove', options => new PacketroveRelease(options));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
    const token = process.env.RELEASE_TOKEN;
    if (!owner || !repo || !token) throw new Error('Release preparation requires a repository and GitHub App token.');
    registerPacketroveRelease();
    const github = await GitHub.create({ owner, repo, token, defaultBranch: 'main' });
    const manifest = await Manifest.fromManifest(github, 'main', 'release-please-config.json', '.release-please-manifest.json');
    await manifest.createReleases();
    await manifest.createPullRequests();
  } catch {
    // Upstream API errors can contain request headers; keep token values out of public logs.
    console.error('Packetrove release preparation failed. Check the App permissions, release baseline, and repository configuration.');
    process.exitCode = 1;
  }
}
