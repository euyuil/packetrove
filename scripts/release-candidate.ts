import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitHub, Manifest, type ReleasePullRequest } from 'release-please';
import { Version } from 'release-please/build/src/version.js';
import { productManifests, releaseVersion } from './cli-release';
import { preparationBranch } from './release-policy';
import { registerPacketroveRelease } from './release-please';

const releaseFiles = new Set<string>([...productManifests, 'CHANGELOG.md', '.release-please-manifest.json',
  'docs/api/openapi.json', 'docs/integrations/mcp.md', 'server.json']);

export async function buildCandidateUpdates(manifest: Pick<Manifest, 'buildPullRequests'>,
  version: string): Promise<ReleasePullRequest> {
  const candidates = await manifest.buildPullRequests();
  if (candidates.length !== 1 || candidates[0]?.version?.toString() !== version) {
    throw new Error('Candidate preparation must produce exactly the requested unified version.');
  }
  const candidate = candidates[0];
  if (candidate.updates.some(update => !releaseFiles.has(update.path))) {
    throw new Error('Candidate preparation may update only version metadata, generated guides, and the changelog.');
  }
  return candidate;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
    const token = process.env.RELEASE_TOKEN;
    const target = process.env.CANDIDATE_BRANCH;
    const version = releaseVersion(process.env.RELEASE_VERSION ?? '');
    const baseline = releaseVersion(process.env.BASELINE_VERSION ?? '');
    const baselineSha = process.env.BASELINE_SHA;
    if (!owner || !repo || !token || !target || !baselineSha) throw new Error('Missing candidate configuration.');
    registerPacketroveRelease();
    const github = await GitHub.create({ owner, repo, token, defaultBranch: target });
    const loaded = await Manifest.fromManifest(github, target);
    const manifest = new Manifest(github, target,
      { ...loaded.repositoryConfig, '.': { ...loaded.repositoryConfig['.']!, releaseAs: version } },
      { '.': Version.parse(baseline) }, { lastReleaseSha: baselineSha, separatePullRequests: true, skipLabeling: true });
    const candidate = await buildCandidateUpdates(manifest, version);
    const marker = JSON.stringify({ version, source: process.env.CANDIDATE_SOURCE_SHA, baseline });
    const title = target === 'main' ? `fix(release): prepare hotfix ${version}` : `chore(release): prepare ${version}`;
    const pr = await github.createPullRequest({ headBranchName: preparationBranch(target, version),
      baseBranchName: target, number: -1, title,
      body: `${candidate.body.toString()}\n\n<!-- packetrove-candidate ${marker} -->`, labels: [], files: [],
    }, target, title, candidate.updates, { fork: false, draft: false });
    appendFileSync(process.env.GITHUB_OUTPUT!, `preparation_pr=${pr.number}\n`);
    appendFileSync(process.env.GITHUB_STEP_SUMMARY!,
      `Prepared [PR #${pr.number}](https://github.com/${owner}/${repo}/pull/${pr.number}) for ${target}.\n`);
  } catch {
    // Upstream errors may include authorization headers. Do not log them.
    console.error('Candidate preparation failed. Check the release baseline, App permissions, and candidate configuration.');
    process.exitCode = 1;
  }
}
