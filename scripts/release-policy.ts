import { releaseVersion } from './cli-release';

export const candidatePattern = /^release-(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function compareVersions(left: string, right: string): number {
  const a = releaseVersion(left).split('.').map(Number);
  const b = releaseVersion(right).split('.').map(Number);
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return a[index]! > b[index]! ? 1 : -1;
  }
  return 0;
}

export function assertNextVersion(baseline: string, requested: string, hotfix = false): void {
  const [major, minor, patch] = releaseVersion(baseline).split('.').map(Number) as [number, number, number];
  releaseVersion(requested);
  const allowed = [`${major}.${minor}.${patch + 1}`];
  if (!hotfix) allowed.push(`${major}.${minor + 1}.0`, `${major + 1}.0.0`);
  if (!allowed.includes(requested)) {
    throw new Error(`Choose the next ${hotfix ? 'patch' : 'patch, minor, or major'} version after ${baseline}.`);
  }
}

export function preparationBranch(target: string, version: string): string {
  releaseVersion(version);
  if (target === 'main') return `automation/prepare-hotfix-${version}`;
  if (target !== `release-${version}`) throw new Error('The candidate branch must match the requested version.');
  return `automation/prepare-release-${version}`;
}

export function assertAcceptedCandidate(expected: string, actual: string, mainIncluded: boolean): void {
  if (!/^[0-9a-f]{40}$/.test(expected) || expected !== actual) {
    throw new Error('The accepted SHA must match the current candidate. Validate and accept changes again.');
  }
  if (!mainIncluded) throw new Error('Synchronize current main into the candidate and repeat staging acceptance.');
}

export function lifecycleMergeMethod(source: string, target: string): 'merge' {
  if ((source === 'main' && (target === 'develop' || candidatePattern.test(target)))
    || (candidatePattern.test(source) && target === 'main')
    || (source.startsWith('automation/sync-') && (target === 'develop' || candidatePattern.test(target)))) return 'merge';
  throw new Error('Release automation accepts only release promotion or synchronization merges.');
}
