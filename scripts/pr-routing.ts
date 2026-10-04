import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertReleaseVersions, productManifests } from './cli-release';
import { candidatePattern } from './release-policy';

export function assertPullRequestRoute(source: string, target: string, labels: string[]): void {
  if (target === 'develop' || candidatePattern.test(target)) return;
  if (target === 'main' && (candidatePattern.test(source) || labels.includes('hotfix'))) return;
  throw new Error('Daily work must target develop, release fixes must target the candidate, and direct main changes must be declared hotfixes.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const response = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${process.env.PULL_REQUEST_NUMBER}`, {
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${process.env.GH_TOKEN}` },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error('Could not read the current pull request route.');
    const pull = await response.json() as { head: { ref: string }; base: { ref: string }; labels: { name: string }[] };
    assertPullRequestRoute(pull.head.ref, pull.base.ref, pull.labels.map(label => label.name));
    if (pull.base.ref === 'main' && candidatePattern.test(pull.head.ref)) {
      const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
      assertReleaseVersions(pull.head.ref.slice('release-'.length), {
        ...Object.fromEntries(productManifests.map(path => [path, json(path).version])),
        '.release-please-manifest.json': json('.release-please-manifest.json')['.'],
        'docs/api/openapi.json': json('docs/api/openapi.json').info.version,
        'server.json': json('server.json').version,
      });
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Pull request routing failed.');
    process.exitCode = 1;
  }
}
