import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
await build({ root, configLoader: 'runner' });

type Manifest = { name: string; version: string; license?: string; dependencies?: Record<string, string>; peerDependencies?: Record<string, string> };
const app = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as Manifest;
const appRequire = createRequire(join(root, 'package.json'));
const visited = new Set<string>();
const notices: string[] = [];

async function collect(name: string, parentRequire: NodeJS.Require) {
  let entry: string;
  try { entry = parentRequire.resolve(name); } catch { entry = appRequire.resolve(name); }
  let directory = dirname(entry);
  let manifest: Manifest;
  for (;;) {
    try {
      manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8')) as Manifest;
      if (manifest.name === name) break;
    } catch { /* The resolved entry may be below its package root. */ }
    const parent = dirname(directory);
    if (parent === directory) throw new Error('Unable to locate dependency metadata: ' + name);
    directory = parent;
  }
  const identity = `${manifest.name}@${manifest.version}`;
  if (visited.has(identity)) return;
  visited.add(identity);
  const files = (await readdir(directory)).filter(filename => /^(licen[cs]e|copying|copyrightnotice|notice)(\.|$)/i.test(filename)).sort();
  if (!files.length || !manifest.license) throw new Error('Dependency license requires review: ' + identity);
  notices.push(`${identity}\nLicense: ${manifest.license}\n\n` +
    (await Promise.all(files.map(filename => readFile(join(directory, filename), 'utf8')))).join('\n\n'));
  const dependencyRequire = createRequire(join(directory, 'package.json'));
  for (const dependency of Object.keys(manifest.dependencies ?? {})) await collect(dependency, dependencyRequire);
  for (const peer of Object.keys(manifest.peerDependencies ?? {})) {
    try { appRequire.resolve(peer); } catch { continue; }
    await collect(peer, dependencyRequire);
  }
}
// Existing UI dependencies retain their package notices; collect the newly bundled
// certificate runtime and its full dependency tree for this isolated prototype.
for (const dependency of ['@peculiar/x509', 'reflect-metadata']) {
  if (!app.dependencies?.[dependency]) throw new Error('Missing certificate runtime dependency: ' + dependency);
  await collect(dependency, appRequire);
}
await writeFile(join(root, 'dist', 'THIRD_PARTY_NOTICES.txt'), notices.join('\n\n' + '='.repeat(72) + '\n\n'));
console.log(`Preserved license and copyright notices for ${visited.size} runtime dependencies.`);
