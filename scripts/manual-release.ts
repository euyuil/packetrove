import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertReleaseVersions, productManifests, requireValidatedRun, releaseVersion,
  type WorkflowJob, type WorkflowRun } from './cli-release';
import { isValidatedEnvironmentRun } from './environment-deployment';
import { assertAcceptedCandidate, assertNextVersion, candidatePattern, compareVersions,
  lifecycleMergeMethod, preparationBranch } from './release-policy';

interface PullRequest {
  number: number; html_url: string; title: string; state: string; merged: boolean; merge_commit_sha: string | null;
  head: { ref: string; sha: string }; base: { ref: string; sha: string };
}
interface Release { tag_name: string; draft: boolean; prerelease: boolean; html_url: string }
interface Deployment { id: number; sha: string; payload: { workflow?: string; runId?: string; runAttempt?: string } }
type PullRun = WorkflowRun & { display_title: string };

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function summary(message: string): void {
  appendFileSync(required('GITHUB_STEP_SUMMARY'), `${message}\n`);
  console.log(message);
}

async function github<T>(path: string, method = 'GET', body?: unknown, allowMissing = false): Promise<T | null> {
  const token = method === 'GET' || path.startsWith('actions/') ? required('GH_TOKEN') : required('RELEASE_TOKEN');
  const response = await fetch(`https://api.github.com/repos/${required('GITHUB_REPOSITORY')}/${path}`, {
    method, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 404 && allowMissing) return null;
  if (!response.ok) throw new Error(`Release API request failed (HTTP ${response.status}, ${method} ${path}).`);
  const contents = await response.text();
  return contents ? JSON.parse(contents) as T : null;
}

async function pages<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const batch = (await github<T[]>(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`))!;
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

async function ref(branch: string, allowMissing = false): Promise<string | null> {
  return (await github<{ object: { sha: string } }>(`git/ref/heads/${encodeURIComponent(branch)}`,
    'GET', undefined, allowMissing))?.object.sha ?? null;
}

async function baseline(): Promise<{ version: string; sha: string }> {
  const releases = (await pages<Release>('releases')).filter(release => !release.draft && !release.prerelease
    && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(release.tag_name));
  releases.sort((left, right) => compareVersions(right.tag_name, left.tag_name));
  const version = releases[0]?.tag_name;
  if (!version) throw new Error('A published stable release is required as the baseline.');
  const tag = (await github<{ object: { sha: string; type: string } }>(`git/ref/tags/${version}`))!.object;
  const sha = tag.type === 'tag'
    ? (await github<{ object: { sha: string } }>(`git/tags/${tag.sha}`))!.object.sha : tag.sha;
  return { version, sha };
}

async function candidates(): Promise<string[]> {
  const branches = (await pages<{ name: string }>('branches')).map(branch => branch.name).filter(name => candidatePattern.test(name));
  if (branches.length > 1) throw new Error('Resolve multiple release branches before continuing.');
  return branches;
}

async function versions(sha: string, expected: string): Promise<void> {
  execFileSync('git', ['fetch', 'origin', sha], { stdio: 'pipe' });
  const json = (path: string) => JSON.parse(execFileSync('git', ['show', `${sha}:${path}`], { encoding: 'utf8' }));
  assertReleaseVersions(expected, { ...Object.fromEntries(productManifests.map(path => [path, json(path).version])),
    '.release-please-manifest.json': json('.release-please-manifest.json')['.'],
    'docs/api/openapi.json': json('docs/api/openapi.json').info.version, 'server.json': json('server.json').version });
}

async function includes(base: string, head: string): Promise<boolean> {
  const comparison = (await github<{ status: string }>(`compare/${base}...${head}`))!;
  return comparison.status === 'ahead' || comparison.status === 'identical';
}

async function waitUntil<T>(description: string, check: () => Promise<T | null>): Promise<T> {
  summary(`Waiting for ${description}.`);
  const deadline = Date.now() + 25 * 60_000;
  do {
    const result = await check();
    if (result !== null) return result;
    await new Promise(resolveWait => setTimeout(resolveWait, 15_000));
  } while (Date.now() < deadline);
  throw new Error(`Timed out waiting for ${description}. Retry this release after resolving the pending step.`);
}

async function jobs(run: WorkflowRun): Promise<WorkflowJob[]> {
  const result: WorkflowJob[] = [];
  for (let page = 1; ; page++) {
    const batch = (await github<{ jobs: WorkflowJob[] }>(
      `actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100&page=${page}`,
    ))!.jobs;
    result.push(...batch);
    if (batch.length < 100) return result;
  }
}

async function validatedBranch(branch: string, sha: string): Promise<void> {
  await waitUntil(`${branch} CI at ${sha}`, async () => {
    const runs = (await github<{ workflow_runs: WorkflowRun[] }>(
      `actions/workflows/ci.yml/runs?branch=${encodeURIComponent(branch)}&head_sha=${sha}&per_page=100`,
    ))!.workflow_runs.filter(run => run.event === 'push' || run.event === 'workflow_dispatch');
    const run = runs[0];
    if (!run || run.status !== 'completed') return null;
    if (!isValidatedEnvironmentRun(run, await jobs(run), required('GITHUB_REPOSITORY'), sha, branch)) {
      throw new Error(`Validation failed for ${branch}. Resolve the failed run and retry the same release.`);
    }
    return true;
  });
}

async function findPull(source: string, target: string, all = false): Promise<PullRequest | null> {
  const owner = required('GITHUB_REPOSITORY').split('/')[0]!;
  return (await pages<PullRequest>(`pulls?state=${all ? 'all' : 'open'}&head=${encodeURIComponent(owner + ':' + source)}&base=${target}`))[0] ?? null;
}

async function ensurePull(source: string, target: string, title: string, body: string): Promise<PullRequest> {
  const existing = await findPull(source, target);
  if (existing) return existing;
  const pr = (await github<PullRequest>('pulls', 'POST', { head: source, base: target, title, body }))!;
  summary(`Opened [PR #${pr.number}](${pr.html_url}) from ${source} to ${target}.`);
  return pr;
}

export async function mergePull(pr: PullRequest, method: 'squash' | 'merge', expectedHead?: string): Promise<string> {
  const initial = (await github<PullRequest>(`pulls/${pr.number}`))!;
  if (initial.merged) return initial.merge_commit_sha!;
  if (initial.state !== 'open') throw new Error(`PR #${pr.number} was closed without merging.`);
  const head = initial.head.sha;
  const base = initial.base.sha;
  if (expectedHead && head !== expectedHead) throw new Error('The accepted candidate changed before merging. Repeat acceptance.');
  let observedPending = false;
  let refreshedAttempt: number | null = null;
  await waitUntil(`PR #${pr.number} validation`, async () => {
    const run = (await github<{ workflow_runs: PullRun[] }>(
      `actions/workflows/ci.yml/runs?event=pull_request&head_sha=${head}&per_page=100`,
    ))!.workflow_runs.find(run => run.display_title === `CI PR #${pr.number}`
      && run.path === '.github/workflows/ci.yml' && run.head_sha === head
      && run.head_repository?.full_name === required('GITHUB_REPOSITORY'));
    if (!run || run.status !== 'completed') {
      observedPending = true;
      return null;
    }
    if (refreshedAttempt !== null && run.run_attempt <= refreshedAttempt) return null;
    // Long branches may diverge. Recheck an already completed lifecycle PR
    // against its live merge ref rather than trusting CI from an older base.
    if (method === 'merge' && !observedPending && refreshedAttempt === null && run.conclusion === 'success') {
      await github(`actions/runs/${run.id}/rerun`, 'POST');
      refreshedAttempt = run.run_attempt;
      return null;
    }
    if (run.conclusion !== 'success' || !(await jobs(run)).some(job => job.name === 'Validate project'
      && job.conclusion === 'success' && job.steps.some(step => step.name === 'Run project validation' && step.conclusion === 'success'))) {
      throw new Error(`PR #${pr.number} validation failed. Resolve it before retrying.`);
    }
    return true;
  });
  const current = (await github<PullRequest>(`pulls/${pr.number}`))!;
  if (current.head.sha !== head || current.base.sha !== base) {
    throw new Error(`PR #${pr.number} changed during validation. Rerun its checks and retry.`);
  }
  const result = (await github<{ merged: boolean; sha: string }>(`pulls/${pr.number}/merge`, 'PUT', {
    sha: head, merge_method: method, commit_title: `${pr.title} (#${pr.number})`,
  }))!;
  if (!result.merged) throw new Error(`PR #${pr.number} could not merge. Resolve checks or conflicts; do not bypass protection.`);
  summary(`Merged PR #${pr.number} using ${method} at ${result.sha}.`);
  return result.sha;
}

async function synchronize(target: string): Promise<void> {
  const main = (await ref('main'))!;
  const destination = await ref(target);
  if (!destination || await includes(main, destination)) return;
  await validatedBranch('main', main);
  const pr = await ensurePull('main', target, `chore(release): synchronize main into ${target}`,
    'Synchronize validated main while preserving branch ancestry. Use a merge commit. If conflicts require a bridge branch, resolve them on that branch and merge its PR normally; never update main with unreleased work.');
  await mergePull(pr, lifecycleMergeMethod('main', target));
  await validatedBranch(target, (await ref(target))!);
}

async function prepare(version: string, hotfix: boolean): Promise<void> {
  const active = await candidates();
  const previous = await baseline();
  if (compareVersions(version, previous.version) <= 0) throw new Error('This version is already published. Retry publication instead of preparing it again.');
  assertNextVersion(previous.version, version, hotfix);
  const branch = hotfix ? 'main' : `release-${version}`;
  if ((!hotfix && active.length && active[0] !== branch)
    || (hotfix && active.some(name => compareVersions(name.slice('release-'.length), version) <= 0))) {
    throw new Error('The active candidate must stay above a hotfix version; do not replace or skip it.');
  }
  if (!hotfix) await synchronize('develop');
  let candidate = await ref(branch, true);
  const sourceBranch = hotfix ? 'main' : 'develop';
  const source = (candidate ?? process.env.SOURCE_SHA) || (await ref(sourceBranch));
  if (!source || !/^[0-9a-f]{40}$/.test(source)) throw new Error('A validated source SHA is required.');
  if (candidate && process.env.SOURCE_SHA && process.env.SOURCE_SHA !== candidate) {
    throw new Error('An existing candidate is frozen. Use a fix PR rather than selecting another develop snapshot.');
  }
  if (hotfix) await validatedBranch('main', source);
  if (!candidate) {
    await validatedBranch(sourceBranch, source);
    const main = (await ref('main'))!;
    if (!await includes(main, source)) throw new Error('The source must contain current main before preparation.');
    await github('git/refs', 'POST', { ref: `refs/heads/${branch}`, sha: source });
    candidate = source;
  }
  execFileSync('git', ['fetch', 'origin', candidate], { stdio: 'pipe' });
  const currentVersion = JSON.parse(execFileSync('git', ['show', `${candidate}:package.json`], { encoding: 'utf8' })).version;
  if (currentVersion !== version) {
    const head = preparationBranch(branch, version);
    let metadata = await findPull(head, branch);
    if (!metadata) {
      execFileSync('git', ['checkout', '--detach', candidate], { stdio: 'pipe' });
      execFileSync('pnpm', ['exec', 'tsx', 'scripts/release-candidate.ts'], { stdio: 'inherit', env: { ...process.env,
        CANDIDATE_BRANCH: branch, RELEASE_VERSION: version, BASELINE_VERSION: previous.version,
        BASELINE_SHA: previous.sha, CANDIDATE_SOURCE_SHA: source } });
      metadata = await findPull(head, branch);
      if (!metadata) throw new Error('The preparation PR was not created.');
    }
    if (hotfix) await github(`issues/${metadata.number}/labels`, 'POST', { labels: ['hotfix'] });
    await mergePull(metadata, 'squash');
    await github(`git/refs/heads/${encodeURIComponent(head)}`, 'DELETE', undefined, true);
  }
  const sha = (await ref(branch))!;
  await versions(sha, version);
  await validatedBranch(branch, sha);
  if (hotfix) {
    summary(`Hotfix ${version} is ready on main at ${sha}. Start publish-hotfix with this accepted SHA.`);
  } else {
    const pr = await ensurePull(branch, 'main', `chore(release): release ${version}`,
      `Release candidate ${version}, initially selected from ${source}.\n\nValidate staging, then start Publish with the accepted candidate SHA. Promotion and synchronization use merge commits.\n\n<!-- packetrove-promotion ${JSON.stringify({ version, source })} -->`);
    summary(`Candidate ${version} is ${sha}. Validate staging, then publish [PR #${pr.number}](${pr.html_url}) with that accepted SHA.`);
  }
}

export async function staging(sha: string): Promise<void> {
  await waitUntil(`successful staging verification at ${sha}`, async () => {
    const deployment = (await pages<Deployment>('deployments?environment=staging'))
      .find(item => item.payload?.workflow === 'deploy-environment.yml');
    if (!deployment || deployment.sha !== sha) return null;
    const status = (await github<{ state: string }[]>(`deployments/${deployment.id}/statuses`))![0]?.state;
    if (status === 'failure' || status === 'error') throw new Error('Staging verification failed. Recover the same candidate before publishing.');
    if (status !== 'success') return null;
    const run = (await github<WorkflowRun>(`actions/runs/${deployment.payload.runId}`))!;
    if (run.status !== 'completed') return null;
    if (run.path !== '.github/workflows/deploy-environment.yml'
      || run.head_repository?.full_name !== required('GITHUB_REPOSITORY')
      || run.conclusion !== 'success' || String(run.run_attempt) !== deployment.payload.runAttempt) {
      throw new Error('The recorded staging workflow attempt must be successful.');
    }
    return true;
  });
}

async function publication(sha: string, version: string): Promise<void> {
  await waitUntil(`production validation at ${sha}`, async () => {
    const runs = (await github<{ workflow_runs: WorkflowRun[] }>(
      `actions/workflows/ci.yml/runs?branch=main&head_sha=${sha}&per_page=100`,
    ))!.workflow_runs.filter(run => run.event === 'push' || run.event === 'workflow_dispatch');
    if (!runs[0] || runs[0].status !== 'completed') return null;
    await requireValidatedRun(sha, runs[0].id, true);
    return true;
  });
  await versions(sha, version);
  const existing = await github<Release>(`releases/tags/${version}`, 'GET', undefined, true);
  const tag = await github<{ object: { sha: string; type: string } }>(`git/ref/tags/${version}`, 'GET', undefined, true);
  if (tag && (tag.object.type !== 'commit' || tag.object.sha !== sha)) throw new Error('An existing tag cannot be moved or reused for different contents.');
  if (existing && (existing.draft || existing.prerelease || !tag)) throw new Error('The existing release does not match a stable publication.');
  if (!tag) await github('git/refs', 'POST', { ref: `refs/tags/${version}`, sha });
  if (!existing) {
    const changelog = execFileSync('git', ['show', `${sha}:CHANGELOG.md`], { encoding: 'utf8' });
    const section = changelog.split(/^## /m).find(section => section.startsWith(`[${version}]`));
    if (!section) throw new Error('The candidate changelog must contain the selected version.');
    const release = (await github<Release>('releases', 'POST', { tag_name: version, target_commitish: sha,
      name: version, body: `## ${section.trim()}`, draft: false, prerelease: false }))!;
    summary(`Published [GitHub Release ${version}](${release.html_url}) at ${sha}.`);
  }
  let retried = false;
  await waitUntil(`immutable npm publication of ${version}`, async () => {
    const runs = (await github<{ workflow_runs: (WorkflowRun & { display_title: string })[] }>(
      'actions/workflows/publish-cli.yml/runs?per_page=100',
    ))!.workflow_runs.filter(run => run.display_title === `Publish CLI ${version}`
      && run.head_repository?.full_name === required('GITHUB_REPOSITORY'));
    const run = runs[0];
    if (!run || run.status !== 'completed') return null;
    if (run.conclusion !== 'success') {
      if (retried) throw new Error(`CLI publication needs recovery for tag ${version}. Retry the existing publish-cli workflow; never choose another version.`);
      await github(`actions/runs/${run.id}/rerun-failed-jobs`, 'POST');
      retried = true;
      summary(`Retrying the failed CLI workflow once for immutable tag ${version}.`);
      return null;
    }
    return true;
  });
}

async function publish(version: string, hotfix: boolean): Promise<void> {
  let sha: string;
  const branch = `release-${version}`;
  if (hotfix) {
    sha = (await ref('main'))!;
    assertAcceptedCandidate(required('ACCEPTED_SHA'), sha, true);
  } else {
    const pr = await findPull(branch, 'main', true);
    if (!pr) throw new Error('Prepare a promotion PR before publishing.');
    if (pr.merged) sha = pr.merge_commit_sha!;
    else {
      const candidate = (await ref(branch))!;
      assertAcceptedCandidate(required('ACCEPTED_SHA'), candidate, await includes((await ref('main'))!, candidate));
      await versions(candidate, version);
      await staging(candidate);
      sha = await mergePull(pr, lifecycleMergeMethod(branch, 'main'), candidate);
    }
  }
  await publication(sha, version);
  await synchronize('develop');
  if (hotfix) {
    for (const active of await candidates()) await synchronize(active);
  } else {
    const head = await ref(branch, true);
    if (head && !await includes(head, (await ref('main'))!)) throw new Error('Do not delete a release branch with unpromoted changes.');
    if (head) await github(`git/refs/heads/${branch}`, 'DELETE');
    await github('actions/workflows/deploy-environment.yml/dispatches', 'POST', {
      ref: 'main', inputs: { environment: 'staging', source_ref: 'main' },
    });
    await staging((await ref('main'))!);
  }
  summary(`Release ${version} completed. Publication and synchronization succeeded.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.env.GITHUB_REF !== 'refs/heads/main') throw new Error('Run manual release orchestration on main.');
    const action = required('RELEASE_ACTION');
    if (action === 'synchronize') {
      const main = (await ref('main'))!;
      execFileSync('git', ['fetch', 'origin', main], { stdio: 'pipe' });
      const mainVersion = JSON.parse(execFileSync('git', ['show', `${main}:package.json`], { encoding: 'utf8' })).version;
      if (process.env.GITHUB_EVENT_NAME === 'workflow_run' && mainVersion !== (await baseline()).version) {
        summary('Formal publication is pending; Publish will complete synchronization.');
        process.exit(0);
      }
      await synchronize('develop');
      for (const branch of await candidates()) await synchronize(branch);
    } else {
      const version = releaseVersion(required('RELEASE_VERSION'));
      if (action === 'prepare' || action === 'prepare-hotfix') await prepare(version, action === 'prepare-hotfix');
      else if (action === 'publish' || action === 'publish-hotfix') await publish(version, action === 'publish-hotfix');
      else throw new Error('Unknown release action.');
    }
  } catch (error) {
    // Child-process and upstream errors may include authentication details.
    console.error(error instanceof Error && !('stderr' in error) ? error.message : 'Release orchestration failed. Inspect the failed step and retry the same release.');
    process.exitCode = 1;
  }
}
