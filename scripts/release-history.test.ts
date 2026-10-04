import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('keeps next-release work out of main and preserves a hotfix through conflict resolution and lifecycle merges', () => {
  const directory = mkdtempSync(join(tmpdir(), 'packetrove-history-'));
  const git = (...args: string[]) => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: 'pipe' }).trim();
  const commit = (file: string, content: string, message: string) => {
    writeFileSync(join(directory, file), content);
    git('add', file);
    git('commit', '-m', message);
    return git('rev-parse', 'HEAD');
  };
  const squash = (branch: string, target: string, file: string, title: string) => {
    git('switch', '-c', branch, target);
    commit(file, `${title} (draft)`, `${title}: initial work`);
    const featureCommit = commit(file, title, title);
    git('switch', target);
    git('merge', '--squash', branch);
    git('commit', '-m', title);
    return { featureCommit, integrationCommit: git('rev-parse', 'HEAD') };
  };
  const isAncestor = (ancestor: string, descendant: string) => {
    try { git('merge-base', '--is-ancestor', ancestor, descendant); return true; } catch { return false; }
  };
  const parents = (sha: string) => git('show', '-s', '--format=%P', sha).split(' ');
  try {
    git('init', '--initial-branch=main');
    git('config', 'user.name', 'Release workflow test');
    git('config', 'user.email', 'release-test@example.com');
    commit('version.json', '{"version":"0.4.0"}\n', 'chore: establish release baseline');
    git('branch', 'develop');
    const selected = squash('feature/selected', 'develop', 'selected.txt', 'feat: selected work');
    git('switch', '-c', 'release-0.5.0', 'develop');
    commit('version.json', '{"version":"0.5.0"}\n', 'chore(release): prepare 0.5.0');
    const next = squash('feature/next', 'develop', 'next.txt', 'feat: next release work');
    const hotfix = squash('hotfix/example', 'main', 'hotfix.txt', 'fix: production hotfix');
    commit('version.json', '{"version":"0.4.1"}\n', 'fix(release): prepare hotfix 0.4.1');
    const hotfixVersion = git('rev-parse', 'HEAD');
    const fix = squash('fix/candidate', 'release-0.5.0', 'candidate-fix.txt', 'fix: candidate correction');
    git('switch', '-c', 'automation/sync-main-to-release', 'release-0.5.0');
    expect(() => git('merge', '--no-ff', '--no-commit', 'main')).toThrow();
    expect(git('diff', '--name-only', '--diff-filter=U')).toBe('version.json');
    writeFileSync(join(directory, 'version.json'), '{"version":"0.5.0"}\n');
    git('add', 'version.json');
    git('commit', '-m', 'chore(release): retain candidate version while merging hotfix');
    const bridge = git('rev-parse', 'HEAD');
    expect(parents(bridge)).toHaveLength(2);
    git('switch', 'release-0.5.0');
    git('merge', '--no-ff', 'automation/sync-main-to-release', '-m', 'chore(release): synchronize main into candidate');
    const candidate = git('rev-parse', 'HEAD');
    git('switch', 'main');
    git('merge', '--no-ff', 'release-0.5.0', '-m', 'chore(release): release 0.5.0');
    const promotion = git('rev-parse', 'HEAD');
    expect(parents(promotion)).toEqual([hotfixVersion, candidate]);
    for (const sha of [selected.integrationCommit, hotfix.integrationCommit, fix.integrationCommit, hotfixVersion]) {
      expect(isAncestor(sha, promotion)).toBe(true);
    }
    expect(isAncestor(next.integrationCommit, promotion)).toBe(false);
    expect(isAncestor(selected.featureCommit, promotion)).toBe(false);
    expect(readFileSync(join(directory, 'version.json'), 'utf8')).toContain('0.5.0');
    git('switch', 'develop');
    git('merge', '--no-ff', 'main', '-m', 'chore(release): synchronize main into develop');
    const synchronization = git('rev-parse', 'HEAD');
    expect(parents(synchronization)).toEqual([next.integrationCommit, promotion]);
    expect(isAncestor(hotfixVersion, synchronization)).toBe(true);
    expect(isAncestor(candidate, synchronization)).toBe(true);
    expect(readFileSync(join(directory, 'next.txt'), 'utf8')).toBe('feat: next release work');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
