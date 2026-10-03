import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireValidatedRun } from './cli-release.ts';

export function assertArtifactRevision(requested: string, checkout: string, onMain: boolean): void {
  if (!/^[a-f0-9]{40}$/u.test(requested) || requested !== checkout || !onMain) {
    throw new Error('Use the exact full commit SHA of a revision already merged into main.');
  }
}

export async function gateArtifact(): Promise<void> {
  if (process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || process.env.GITHUB_REF !== 'refs/heads/main') {
    throw new Error('The plugin artifact workflow must be manually requested on main.');
  }
  const requested = process.env.TARGET_COMMIT ?? '';
  if (!/^[a-f0-9]{40}$/u.test(requested)) throw new Error('TARGET_COMMIT must be a full lowercase commit SHA.');
  const checkout = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  let onMain = false;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', checkout, 'origin/main'], { stdio: 'ignore' });
    onMain = true;
  } catch { /* A revision outside main is not eligible for a public artifact. */ }
  assertArtifactRevision(requested, checkout, onMain);
  await requireValidatedRun(checkout);
  console.log(`Validated plugin artifact source ${checkout}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await gateArtifact(); }
  catch (failure) {
    console.error(failure instanceof Error ? failure.message : 'Plugin artifact source validation failed.');
    process.exitCode = 1;
  }
}
