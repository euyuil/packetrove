import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { Uint8ArrayReader, Uint8ArrayWriter, ZipWriter } from '@zip.js/zip.js';
import {
  createArchive, packageEntries, readArchive, readPackage, sha256, validatePackage, verifiedArchive,
} from './openai-plugin-package';
import type { PackageFiles } from './openai-plugin-package';
import { artifactName, productVersion } from './openai-plugin';

let original: PackageFiles;
let version: string;
const temporary: string[] = [];
beforeAll(async () => {
  original = await readPackage();
  version = await productVersion();
});
afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(temporary.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

function manifest(change: (value: any) => void, file: 'plugin.json' | 'mcp.json' = 'plugin.json'): PackageFiles {
  const value = JSON.parse(Buffer.from(original[file]).toString());
  change(value);
  return { ...original, [file]: Buffer.from(JSON.stringify(value)) };
}

async function fixture(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'packetrove-plugin-'));
  temporary.push(directory);
  await mkdir(join(directory, 'assets'));
  for (const path of packageEntries) await writeFile(join(directory, path), original[path]);
  return directory;
}

async function archiveOf(files: Record<string, Uint8Array>, unixMode = 0o100644): Promise<Uint8Array> {
  const writer = new ZipWriter(new Uint8ArrayWriter(), { useWebWorkers: false, unixMode });
  for (const [path, data] of Object.entries(files)) await writer.add(path, new Uint8ArrayReader(data));
  return writer.close();
}

describe('OpenAI plugin package', () => {
  it('validates the real draft entirely offline and reports missing publishing fields', async () => {
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Package validation must remain offline.'); }));
    const result = await validatePackage(original, version);
    expect(result).toMatchObject({
      version, image: { format: 'png', width: 1254, height: 1254, bytes: 935895 },
      pendingListingFields: [
        'author.name', 'extensions.com.openai.interface.developerName',
      ],
    });
    expect(fetch).not.toHaveBeenCalled();
    const cases = JSON.parse(Buffer.from(original['plugin.json']).toString()).extensions['com.openai'].review.test_cases;
    expect(cases.positive).toHaveLength(5);
    expect(cases.negative).toHaveLength(3);
    await expect(validatePackage(original, version, true)).rejects.toThrow('Listing fields remain incomplete');
  });
  it('accepts complete fixture listing fields without claiming account or review verification', async () => {
    const files = manifest(value => {
      value.author.name = 'Example Publisher';
      Object.assign(value.extensions['com.openai'].interface, {
        developerName: 'Example Publisher', supportURL: 'https://example.com/support',
        privacyPolicyURL: 'https://example.com/privacy', termsOfServiceURL: 'https://example.com/terms',
      });
    });
    expect((await validatePackage(files, version, true)).pendingListingFields).toEqual([]);
  });
  it('accepts an older draft without review information', async () => {
    await expect(validatePackage(manifest(value => {
      delete value.extensions['com.openai'].review;
    }), version)).resolves.toMatchObject({ version });
  });
  it('accepts documented case strings and negative cases without optional fields', async () => {
    const files = manifest(value => {
      const cases = value.extensions['com.openai'].review.test_cases;
      cases.positive[0].tools_triggered = 'cidr-cover, range-to-cidrs';
      cases.positive[0].description = 'x'.repeat(4000);
      cases.positive[0].prompt = 'Calculate the range.\nExplain its exact coverage.';
      cases.positive[0].expected_behavior = 'Return the CIDRs.\nExplain the address count.';
      for (const reviewCase of cases.negative) delete reviewCase.expected_behavior;
    });
    await expect(validatePackage(files, version)).resolves.toMatchObject({ version });
  });
  it.each([
    ['null review', (value: any) => { value.extensions['com.openai'].review = null; }, 'review must be an object'],
    ['array review', (value: any) => { value.extensions['com.openai'].review = []; }, 'review must be an object'],
    ['missing cases', (value: any) => { value.extensions['com.openai'].review = {}; }, 'test_cases must be an object'],
    ['null cases', (value: any) => { value.extensions['com.openai'].review.test_cases = null; }, 'test_cases must be an object'],
    ['partial positive list', (value: any) => { value.extensions['com.openai'].review.test_cases.positive.pop(); }, 'positive must contain exactly 5'],
    ['extra positive case', (value: any) => { value.extensions['com.openai'].review.test_cases.positive.push({}); }, 'positive must contain exactly 5'],
    ['missing positive list', (value: any) => { delete value.extensions['com.openai'].review.test_cases.positive; }, 'positive must contain exactly 5'],
    ['non-array positive list', (value: any) => { value.extensions['com.openai'].review.test_cases.positive = {}; }, 'positive must contain exactly 5'],
    ['partial negative list', (value: any) => { value.extensions['com.openai'].review.test_cases.negative.pop(); }, 'negative must contain exactly 3'],
    ['extra negative case', (value: any) => { value.extensions['com.openai'].review.test_cases.negative.push({}); }, 'negative must contain exactly 3'],
    ['missing negative list', (value: any) => { delete value.extensions['com.openai'].review.test_cases.negative; }, 'negative must contain exactly 3'],
    ['non-array negative list', (value: any) => { value.extensions['com.openai'].review.test_cases.negative = 'three cases'; }, 'negative must contain exactly 3'],
    ['credentials', (value: any) => { value.extensions['com.openai'].review.test_credentials = 'Example account'; }, 'review contains an unsupported field'],
    ['reviewer instructions', (value: any) => { value.extensions['com.openai'].review.reviewer_instructions = 'Example instructions'; }, 'review contains an unsupported field'],
    ['unreviewed demo field', (value: any) => { value.extensions['com.openai'].review.demo_recording_url = 'https://example.com/demo'; }, 'review contains an unsupported field'],
    ['unknown case list', (value: any) => { value.extensions['com.openai'].review.test_cases.extra = []; }, 'test_cases contains an unsupported field'],
    ['misplaced cases', (value: any) => {
      value.extensions['com.openai'].interface.review = value.extensions['com.openai'].review;
      delete value.extensions['com.openai'].review;
    }, 'interface contains an unsupported field'],
  ] as const)('rejects unsupported review metadata: %s', async (_name, change, error) => {
    await expect(validatePackage(manifest(change), version)).rejects.toThrow(error);
  });
  it.each(['positive', 'negative'] as const)('rejects malformed %s cases with a useful field location', async kind => {
    for (const [change, error] of [
      [(cases: any[]) => { cases[0] = 'A case'; }, `${kind}[0] must be an object`],
      [(cases: any[]) => { delete cases[0].description; }, `${kind}[0].description`],
      [(cases: any[]) => { cases[0].description = 'x'.repeat(4001); }, `${kind}[0].description`],
      [(cases: any[]) => { delete cases[0].prompt; }, `${kind}[0].prompt`],
      [(cases: any[]) => { cases[0].prompt = '   '; }, `${kind}[0].prompt`],
      [(cases: any[]) => { cases[0].prompt = 'Unsupported\u200Btext'; }, `${kind}[0].prompt`],
      [(cases: any[]) => { cases[0].expected_behavior = null; }, `${kind}[0].expected_behavior`],
      [(cases: any[]) => { cases[0].expected_behavior = 'Unsupported\ttext'; }, `${kind}[0].expected_behavior`],
      [(cases: any[]) => { cases[0].tools_triggered = ['cidr-cover']; }, `${kind}[0].tools_triggered`],
      [(cases: any[]) => { cases[0].tools_triggered = 'save-firewall'; }, `${kind}[0].tools_triggered must name catalog MCP tools`],
      [(cases: any[]) => { cases[0].tools_triggered = 'cidr-cover,'; }, `${kind}[0].tools_triggered must name catalog MCP tools`],
      [(cases: any[]) => { cases[0].file_attachment_urls = ['https://example.com/input.txt']; }, `${kind}[0] contains an unsupported field`],
    ] as const) {
      await expect(validatePackage(manifest(value => {
        change(value.extensions['com.openai'].review.test_cases[kind]);
      }), version)).rejects.toThrow(error);
    }
  });
  it.each(['tools_triggered', 'expected_behavior'])('requires %s for positive cases', async field => {
    await expect(validatePackage(manifest(value => {
      delete value.extensions['com.openai'].review.test_cases.positive[0][field];
    }), version)).rejects.toThrow(`positive[0].${field}`);
  });
  it.each([
    (value: any) => { value.$schema = 'https://example.com/unsupported.json'; },
    (value: any) => { value.skills = './skills/'; },
    (value: any) => { value.author.unreviewed = true; },
    (value: any) => { value.version = '99.0.0'; },
    (value: any) => { value.name = 'another-plugin'; },
    (value: any) => { value.license = 'Other'; },
    (value: any) => { value.homepage = 'https://example.com'; },
    (value: any) => { value.extensions['com.openai'].hooks = {}; },
    (value: any) => { value.extensions['com.openai'].interface.screenshots = ['./assets/logo.png']; },
    (value: any) => { value.extensions['com.openai'].interface.shortDescription = 'x'.repeat(31); },
    (value: any) => { value.extensions['com.openai'].interface.longDescription = 'x'.repeat(4001); },
    (value: any) => { value.extensions['com.openai'].interface.developerName = 'x'.repeat(81); },
    (value: any) => { value.extensions['com.openai'].interface.displayName = 'Packetrove\n'; },
    (value: any) => { value.extensions['com.openai'].interface.longDescription = 'Unsupported\u200Btext'; },
    (value: any) => { value.extensions['com.openai'].interface.longDescription = 'Unsupported\ttext'; },
    (value: any) => { value.extensions['com.openai'].interface.supportURL = 'http://example.com/support'; },
    (value: any) => { value.extensions['com.openai'].interface.privacyPolicyURL = 'https://user:fixture@example.com/privacy'; },
    (value: any) => { value.extensions['com.openai'].interface.termsOfServiceURL = 'https://example.com\\terms'; },
    (value: any) => { value.extensions['com.openai'].interface.defaultPrompt = ['One', 'One ', 'Three']; },
    (value: any) => { value.extensions['com.openai'].interface.defaultPrompt = ['Same  prompt', 'Same prompt']; },
    (value: any) => { value.extensions['com.openai'].interface.defaultPrompt = ['@packetrove calculate']; },
    (value: any) => { value.extensions['com.openai'].interface.defaultPrompt = ['a', 'b', 'c', 'd']; },
    (value: any) => { value.extensions['com.openai'].interface.capabilities = Array(21).fill('Calculate'); },
    (value: any) => { value.extensions['com.openai'].interface.logo = '../logo.png'; },
    (value: any) => { value.extensions['com.openai'].interface.composerIcon = '/private/logo.png'; },
  ])('rejects malformed or unsupported metadata case %#', async change => {
    await expect(validatePackage(manifest(change), version)).rejects.toThrow();
  });
  it.each([
    (value: any) => { value.mcpServers.packetrove.type = 'sse'; },
    (value: any) => { value.mcpServers.packetrove.url = 'https://example.com/mcp'; },
    (value: any) => { value.mcpServers.packetrove.headers = {}; },
    (value: any) => { value.mcpServers.extra = value.mcpServers.packetrove; },
    (value: any) => { value.mcpServers.packetrove = { type: 'stdio', command: 'example' }; },
  ])('rejects MCP configuration outside the anonymous shared endpoint case %#', async change => {
    await expect(validatePackage(manifest(change, 'mcp.json'), version)).rejects.toThrow();
  });
  it('rejects malformed JSON, invalid UTF-8, and a changed license', async () => {
    for (const data of [Buffer.from('{'), Uint8Array.of(0xff)]) {
      await expect(validatePackage({ ...original, 'plugin.json': data }, version)).rejects.toThrow('UTF-8 JSON');
    }
    await expect(validatePackage({ ...original, LICENSE: Buffer.from('Other license') }, version)).rejects.toThrow('MIT license');
  });
  it.each([48, 4096])('fully decodes a valid square PNG at the %i pixel boundary', async size => {
    const png = await sharp({ create: { width: size, height: size, channels: 4, background: '#5030ff' } }).png().toBuffer();
    expect((await validatePackage({ ...original, 'assets/logo.png': png }, version)).image.width).toBe(size);
  });
  it('rejects wrong format, small or nonsquare images, truncation, and oversized assets', async () => {
    const small = await sharp({ create: { width: 47, height: 47, channels: 4, background: '#5030ff' } }).png().toBuffer();
    const rectangle = await sharp({ create: { width: 48, height: 49, channels: 4, background: '#5030ff' } }).png().toBuffer();
    const jpeg = await sharp(original['assets/logo.png']).jpeg().toBuffer();
    for (const data of [small, rectangle, jpeg, original['assets/logo.png'].slice(0, 64), new Uint8Array(5 * 1024 * 1024 + 1)]) {
      await expect(validatePackage({ ...original, 'assets/logo.png': data }, version)).rejects.toThrow();
    }
  });
  it('rejects missing files, extra private files, symbolic links, and a symbolic-link package root', async () => {
    const directory = await fixture();
    await rm(join(directory, 'assets/logo.png'));
    await expect(readPackage(directory)).rejects.toThrow('allowlist');
    await writeFile(join(directory, 'assets/logo.png'), original['assets/logo.png']);
    await writeFile(join(directory, '.env'), 'EXAMPLE_CONFIGURATION=fixture\n');
    await expect(readPackage(directory)).rejects.toThrow('unexpected entry');
    await rm(join(directory, '.env'));
    await rm(join(directory, 'assets/logo.png'));
    await symlink(join(directory, 'LICENSE'), join(directory, 'assets/logo.png'));
    await expect(readPackage(directory)).rejects.toThrow('nonregular file');
    const rootLink = `${directory}-link`;
    temporary.push(rootLink);
    await symlink(directory, rootLink);
    await expect(readPackage(rootLink)).rejects.toThrow('regular directory');
  });
  // Two complete round trips with the real artwork need time on shared CI runners.
  it('produces a repeatable, root-layout archive with every source byte preserved', async () => {
    const first = await verifiedArchive(original, version);
    const second = await verifiedArchive(original, version);
    expect(Buffer.from(first.archive)).toEqual(Buffer.from(second.archive));
    const extracted = await readArchive(first.archive);
    expect(Object.keys(extracted)).toEqual([...packageEntries]);
    for (const path of packageEntries) expect(Buffer.from(extracted[path])).toEqual(Buffer.from(original[path]));
    expect(sha256(first.archive)).toMatch(/^[a-f0-9]{64}$/u);
  }, 20_000);
  it('rejects wrapped archives, unexpected members, symlink entries, trailing data, and damaged bytes', async () => {
    const wrapped = Object.fromEntries(Object.entries(original).map(([path, data]) => [`packetrove/${path}`, data]));
    const valid = await createArchive(original);
    const damaged = Buffer.from(valid);
    const central = damaged.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    damaged[central + 16] = damaged[central + 16]! ^ 1;
    for (const archive of [
      await archiveOf(wrapped), await archiveOf({ ...original, 'private.txt': Buffer.from('fixture') }),
      await archiveOf(original, 0o120777), Buffer.concat([valid, Buffer.from('trailing')]),
      damaged, valid.slice(0, 40),
    ]) await expect(readArchive(archive)).rejects.toThrow('ZIP contents or integrity');
  });
  it('uses the unified version and full source revision to identify downloadable artifacts', () => {
    expect(artifactName(version, 'a'.repeat(40))).toBe(`packetrove-openai-plugin-${version}-${'a'.repeat(12)}`);
    expect(() => artifactName(version, 'main')).toThrow('full source commit');
    expect(() => artifactName('../other', 'a'.repeat(40))).toThrow();
  });
});
