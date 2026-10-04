import { execFileSync } from 'node:child_process';
import type { Commit, GitHub } from 'release-please';

export function getUnreleasedCommits(baseline: string, head: string, directory = process.cwd()): Commit[] {
  if (![baseline, head].every(sha => /^[0-9a-f]{40}$/.test(sha))) throw new Error('Full release baseline and candidate SHAs are required.');
  const git = (...args: string[]) => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: 'pipe' });
  try { git('merge-base', '--is-ancestor', baseline, head); }
  catch { throw new Error('The published baseline must be an ancestor of the selected candidate.'); }
  const shas = git('log', '--format=%H', `${baseline}..${head}`, '--').trim().split('\n').filter(Boolean);
  if (shas.length > 500) throw new Error('The release range exceeds 500 commits; review it before preparation.');
  return shas.map(sha => ({ sha, message: git('show', '--no-patch', '--format=%B', sha).trimEnd(),
    files: git('diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '-z', '--diff-merges=first-parent', sha, '--')
      .split('\0').filter(Boolean) }));
}

export function useReleaseCommitRange(github: Pick<GitHub, 'mergeCommitIterator'>, commits: Commit[], baseline: string): void {
  const original = github.mergeCommitIterator.bind(github);
  github.mergeCommitIterator = async function* (branch, options) {
    if (!options?.backfillFiles) { yield* original(branch, options); return; }
    // Manifest otherwise stops at the baseline in date-ordered history and can
    // miss older next-release commits on the other parent of a lifecycle merge.
    yield* commits;
    yield { sha: baseline, message: 'Published release baseline', files: [] };
  };
}
