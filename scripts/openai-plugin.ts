import { execFileSync } from 'node:child_process';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertReleaseVersions, productManifests, releaseVersion } from './cli-release';
import { packageEntries, pluginRoot, readPackage, sha256, verifiedArchive } from './openai-plugin-package';

export async function productVersion(): Promise<string> {
  const readJson = async (path: string) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
  const versions = Object.fromEntries(await Promise.all(productManifests.map(async path => [path, (await readJson(path)).version])));
  const version = versions['package.json'];
  if (typeof version !== 'string') throw new Error('The root product version is missing.');
  return assertReleaseVersions(version, {
    ...versions,
    '.release-please-manifest.json': (await readJson('.release-please-manifest.json'))['.'],
    'docs/api/openapi.json': (await readJson('docs/api/openapi.json')).info.version,
    'server.json': (await readJson('server.json')).version,
  });
}

export function artifactName(version: string, commit: string): string {
  if (!/^[a-f0-9]{40}$/u.test(commit)) throw new Error('A full source commit SHA is required.');
  return `packetrove-openai-plugin-${releaseVersion(version)}-${commit.slice(0, 12)}`;
}

async function run(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  let requireListing = false;
  let outputDirectory = resolve('dist/openai-plugin');
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--require-listing') requireListing = true;
    else if (argument === '--output-dir' && args[index + 1]) outputDirectory = resolve(args[++index]!);
    else throw new Error('Use check or build, with --require-listing and an optional --output-dir for build.');
  }
  if (command !== 'check' && command !== 'build') throw new Error('Use check or build.');
  if (/[\r\n\u0000]/u.test(outputDirectory)) throw new Error('The output directory cannot contain control characters.');
  const contained = relative(pluginRoot, outputDirectory);
  if (!contained || (!contained.startsWith(`..${sep}`) && contained !== '..' && !isAbsolute(contained))) {
    throw new Error('Write artifacts outside the plugin source directory.');
  }
  const version = await productVersion();
  const files = await readPackage();
  const { archive, validation } = await verifiedArchive(files, version, requireListing);
  if (command === 'check') {
    console.log(JSON.stringify({ ...validation, verifiedArchive: true }, null, 2));
    return;
  }
  const repository = fileURLToPath(new URL('../', import.meta.url));
  const git = (...arguments_: string[]) => execFileSync('git', arguments_, {
    cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  if (git('status', '--porcelain', '--untracked-files=normal')) throw new Error('Commit local changes before building a traceable ZIP.');
  const commit = git('rev-parse', 'HEAD');
  const name = artifactName(version, commit);
  const archiveFile = `${name}.zip`;
  const metadata = {
    ...validation, listingFieldsComplete: validation.pendingListingFields.length === 0,
    sourceCommit: commit, archive: archiveFile, bytes: archive.length, sha256: sha256(archive),
    contents: packageEntries.map(path => ({ path, bytes: files[path].length, sha256: sha256(files[path]) })),
  };
  await mkdir(outputDirectory, { recursive: true });
  const target = resolve(outputDirectory, archiveFile);
  await writeFile(target, archive);
  // Read the written archive too, so uploaded files are checked rather than only an in-memory ZIP.
  if (!Buffer.from(await readFile(target)).equals(Buffer.from(archive))) throw new Error('The written ZIP differs from the verified archive.');
  await writeFile(resolve(outputDirectory, 'SHA256SUMS'), `${metadata.sha256}  ${archiveFile}\n`);
  await writeFile(resolve(outputDirectory, 'build-info.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `artifact_name=${name}\narchive_name=${archiveFile}\nversion=${version}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY,
      `## OpenAI plugin ZIP\n\nVersion: \`${version}\`\n\nSource commit: \`${commit}\`\n\nArchive: \`${archiveFile}\`\n\nSHA-256: \`${metadata.sha256}\`\n\n`
      + `Contents: ${packageEntries.map(path => `\`${path}\``).join(', ')}.\n\n`
      + (validation.pendingListingFields.length
        ? `Draft package. Missing listing fields: ${validation.pendingListingFields.map(field => `\`${field}\``).join(', ')}.\n\n`
        : 'Listing fields are complete. Identity/domain verification, review materials, tool scans, and submission remain separate checks.\n\n')
      + 'Download the artifact below, extract it, and use the inner plugin ZIP. Build information and checksums stay outside that ZIP.\n');
  }
  console.log(JSON.stringify(metadata, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await run(); }
  catch (failure) {
    console.error(failure instanceof Error ? failure.message : 'Plugin package validation or build failed.');
    process.exitCode = 1;
  }
}
