import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import sharp from 'sharp';
import { Uint8ArrayReader, Uint8ArrayWriter, ZipReader, ZipWriter } from '@zip.js/zip.js';
import { MCP_PATH, PACKETROVE_IDENTITY, PUBLIC_API_ORIGIN, mcpOperations } from '../packages/contracts/src/index';
import pluginSchema from './schemas/agent-plugins/1.0.0/plugin.schema.json' with { type: 'json' };
import mcpSchema from './schemas/agent-plugins/1.0.0/mcp.schema.json' with { type: 'json' };
import { releaseVersion } from './cli-release';

export const pluginRoot = fileURLToPath(new URL('../plugins/packetrove/', import.meta.url));
export const packageEntries = ['plugin.json', 'mcp.json', 'LICENSE', 'assets/logo.png'] as const;
export type PackageFiles = Record<(typeof packageEntries)[number], Uint8Array>;
const entrySet = new Set<string>(packageEntries);
const maxTextBytes = 64 * 1024;
const maxImageBytes = 5 * 1024 * 1024;
const maxArchiveBytes = maxImageBytes + 4 * maxTextBytes;
const unsupportedText = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/u;
const interfaceFields = [
  'displayName', 'shortDescription', 'longDescription', 'developerName', 'category',
  'capabilities', 'websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL',
  'defaultPrompt', 'composerIcon', 'logo',
];
const requiredListingFields = ['developerName', 'websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL'];
const reviewCaseFields = ['description', 'prompt', 'tools_triggered', 'expected_behavior'];
const mcpToolNames = new Set<string>(mcpOperations.map(tool => tool.mcp.name));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validatePluginSchema = ajv.compile(pluginSchema);
const validateMcpSchema = ajv.compile(mcpSchema);
const rootLicense = await readFile(new URL('../LICENSE', import.meta.url));

type JsonObject = Record<string, unknown>;
export interface PackageValidation {
  version: string;
  pendingListingFields: string[];
  image: { format: 'png'; width: number; height: number; bytes: number };
}

function object(value: unknown, field: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} must be an object.`);
  return value as JsonObject;
}

function onlyFields(value: JsonObject, allowed: string[], field: string): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) {
    throw new Error(`${field} contains an unsupported field. Review the package subset before extending it.`);
  }
}

function text(value: unknown, field: string, limit: number, multiline = false): string {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim()
    || Array.from(value).length > limit || unsupportedText.test(value) || /\t/u.test(value)
    || (!multiline && /[\r\n]/u.test(value))) {
    throw new Error(`${field} must contain supported nonempty text within its submission limit.`);
  }
  return value;
}

function https(value: unknown, field: string, limit = 1024): string {
  const input = text(value, field, limit);
  let url: URL;
  try { url = new URL(input); } catch { throw new Error(`${field} must be an HTTPS URL.`); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || /[\s\\]/u.test(input)) {
    throw new Error(`${field} must be an HTTPS URL without credentials or unsupported characters.`);
  }
  return input;
}

function json(bytes: Uint8Array, field: string): unknown {
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new Error(`${field} must be valid UTF-8 JSON.`); }
}

function validateReview(value: unknown): void {
  const field = 'extensions.com.openai.review';
  const review = object(value, field);
  onlyFields(review, ['test_cases'], field);
  const cases = object(review.test_cases, `${field}.test_cases`);
  onlyFields(cases, ['positive', 'negative'], `${field}.test_cases`);
  // This repository packages complete initial-review lists; the portal also accepts partial drafts.
  for (const [kind, count] of [['positive', 5], ['negative', 3]] as const) {
    const listField = `${field}.test_cases.${kind}`;
    const list = cases[kind];
    if (!Array.isArray(list) || list.length !== count) {
      throw new Error(`${listField} must contain exactly ${count} review cases.`);
    }
    list.forEach((value, index) => {
      const caseField = `${listField}[${index}]`;
      const reviewCase = object(value, caseField);
      onlyFields(reviewCase, reviewCaseFields, caseField);
      text(reviewCase.description, `${caseField}.description`, 4000, true);
      text(reviewCase.prompt, `${caseField}.prompt`, maxTextBytes, true);
      if (kind === 'positive' || reviewCase.expected_behavior !== undefined) {
        text(reviewCase.expected_behavior, `${caseField}.expected_behavior`, maxTextBytes, true);
      }
      if (kind === 'positive' || reviewCase.tools_triggered !== undefined) {
        const names = text(reviewCase.tools_triggered, `${caseField}.tools_triggered`, maxTextBytes)
          .split(',').map(name => name.trim());
        if (names.some(name => !mcpToolNames.has(name))) {
          throw new Error(`${caseField}.tools_triggered must name catalog MCP tools separated by commas.`);
        }
      }
    });
  }
}

function checkEntries(files: Record<string, Uint8Array>): asserts files is PackageFiles {
  if (Object.keys(files).length !== packageEntries.length || Object.keys(files).some(path => !entrySet.has(path))) {
    throw new Error('Package contents must match the four-file allowlist exactly.');
  }
  for (const path of packageEntries) {
    const data = files[path];
    if (!(data instanceof Uint8Array) || !data.length || data.length > (path.endsWith('.png') ? maxImageBytes : maxTextBytes)) {
      throw new Error(`${path} is missing, empty, or exceeds the package size limit.`);
    }
  }
}

export async function readPackage(directory = pluginRoot): Promise<PackageFiles> {
  if (!(await lstat(directory)).isDirectory()) throw new Error('The plugin root must be a regular directory.');
  const files: Record<string, Uint8Array> = Object.create(null);
  async function visit(relative: string): Promise<void> {
    for (const name of await readdir(join(directory, relative))) {
      const path = relative ? `${relative}/${name}` : name;
      const info = await lstat(join(directory, path));
      if (path === 'assets' && info.isDirectory()) await visit(path);
      else {
        if (!entrySet.has(path) || !info.isFile() || info.isSymbolicLink()) {
          throw new Error('Package contains an unexpected entry or a nonregular file.');
        }
        if (info.size > (path.endsWith('.png') ? maxImageBytes : maxTextBytes)) {
          throw new Error(`${path} exceeds the package size limit.`);
        }
        files[path] = await readFile(join(directory, path));
      }
    }
  }
  await visit('');
  checkEntries(files);
  return files;
}

export async function validatePackage(
  files: Record<string, Uint8Array>, productVersion: string, requireListing = false,
): Promise<PackageValidation> {
  checkEntries(files);
  const plugin = json(files['plugin.json'], 'plugin.json');
  const mcp = json(files['mcp.json'], 'mcp.json');
  if (!validatePluginSchema(plugin)) throw new Error('plugin.json does not match the pinned Agent Plugins 1.0.0 schema.');
  if (!validateMcpSchema(mcp)) throw new Error('mcp.json does not match the pinned Agent Plugins 1.0.0 schema.');
  const manifest = object(plugin, 'plugin.json');
  const version = releaseVersion(productVersion);
  if (manifest.name !== 'packetrove' || manifest.version !== version || manifest.license !== 'MIT'
    || manifest.description !== PACKETROVE_IDENTITY.description || !Buffer.from(files.LICENSE).equals(rootLicense)) {
    throw new Error('The package identity, unified product version, and MIT license must match Packetrove.');
  }
  if (https(manifest.homepage, 'homepage', 2048) !== PACKETROVE_IDENTITY.websiteUrl
    || https(manifest.repository, 'repository', 2048) !== 'https://github.com/euyuil/packetrove') {
    throw new Error('The package homepage and repository must match Packetrove.');
  }
  const author = object(manifest.author, 'author');
  if (author.email !== 'hello@packetrove.com' || https(author.url, 'author.url', 2048) !== PACKETROVE_IDENTITY.websiteUrl) {
    throw new Error('The author contact must match the confirmed Packetrove support contact.');
  }
  if (author.name !== undefined) text(author.name, 'author.name', 120);
  const extensions = object(manifest.extensions, 'extensions');
  onlyFields(extensions, ['com.openai'], 'extensions');
  const openai = object(extensions['com.openai'], 'extensions.com.openai');
  onlyFields(openai, ['interface', 'review'], 'extensions.com.openai');
  if (openai.review !== undefined) validateReview(openai.review);
  const listing = object(openai.interface, 'extensions.com.openai.interface');
  onlyFields(listing, interfaceFields, 'extensions.com.openai.interface');
  if (text(listing.displayName, 'displayName', 30) !== PACKETROVE_IDENTITY.title
    || text(listing.category, 'category', 120) !== 'Developer Tools') {
    throw new Error('The listing name and category must match the reviewed Packetrove listing.');
  }
  text(listing.shortDescription, 'shortDescription', 30);
  text(listing.longDescription, 'longDescription', 4000, true);
  if (listing.developerName !== undefined) text(listing.developerName, 'developerName', 80);
  if (author.name !== undefined && listing.developerName !== undefined && author.name !== listing.developerName) {
    throw new Error('The author and listing publisher names must agree.');
  }
  for (const field of requiredListingFields.filter(field => field.endsWith('URL'))) {
    if (listing[field] !== undefined) https(listing[field], field);
  }
  if (listing.websiteURL !== PACKETROVE_IDENTITY.websiteUrl) throw new Error('websiteURL must match Packetrove.');
  if (listing.capabilities !== undefined) {
    if (!Array.isArray(listing.capabilities) || listing.capabilities.length > 20) throw new Error('capabilities must contain at most 20 labels.');
    listing.capabilities.forEach(value => text(value, 'capabilities', 120));
  }
  if (listing.defaultPrompt !== undefined) {
    const prompts = Array.isArray(listing.defaultPrompt) ? listing.defaultPrompt : [listing.defaultPrompt];
    if (!prompts.length || prompts.length > 3) throw new Error('defaultPrompt must contain one to three prompts.');
    const normalized = prompts.map(value => {
      const prompt = text(value, 'defaultPrompt', 128);
      if (/@packetrove\b/iu.test(prompt)) throw new Error('defaultPrompt cannot contain an MCP server mention.');
      return prompt.normalize('NFKC').replace(/\s+/gu, ' ').trim();
    });
    if (new Set(normalized).size !== normalized.length) throw new Error('defaultPrompt values must be unique after normalization.');
  }
  for (const field of ['logo', 'composerIcon']) {
    if (listing[field] !== './assets/logo.png') throw new Error(`${field} must reference the packaged PNG inside ./assets/.`);
  }
  const servers = object(object(mcp, 'mcp.json').mcpServers, 'mcpServers');
  onlyFields(servers, ['packetrove'], 'mcpServers');
  const server = object(servers.packetrove, 'mcpServers.packetrove');
  onlyFields(server, ['type', 'url'], 'mcpServers.packetrove');
  if (server.type !== 'streamable-http' || https(server.url, 'MCP URL', 2048) !== new URL(MCP_PATH, PUBLIC_API_ORIGIN).href) {
    throw new Error('MCP must declare exactly the existing anonymous Streamable HTTP endpoint.');
  }
  const logo = files['assets/logo.png'];
  let width: number;
  let height: number;
  try {
    const image = sharp(logo, { failOn: 'warning', limitInputPixels: 4096 * 4096 });
    const metadata = await image.metadata();
    if (metadata.format !== 'png' || !metadata.width || !metadata.height || metadata.width !== metadata.height
      || metadata.width < 48 || metadata.width > 4096 || (metadata.pages ?? 1) !== 1) throw new Error();
    await image.raw().toBuffer();
    width = metadata.width;
    height = metadata.height;
  } catch { throw new Error('logo.png must decode as a square, static PNG from 48 to 4096 pixels.'); }
  const pendingListingFields = [
    ...(author.name === undefined ? ['author.name'] : []),
    ...requiredListingFields.filter(field => listing[field] === undefined).map(field => `extensions.com.openai.interface.${field}`),
  ];
  if (requireListing && pendingListingFields.length) {
    throw new Error(`Listing fields remain incomplete: ${pendingListingFields.join(', ')}.`);
  }
  return { version, pendingListingFields, image: { format: 'png', width, height, bytes: logo.length } };
}

export async function createArchive(files: PackageFiles): Promise<Uint8Array> {
  checkEntries(files);
  const writer = new ZipWriter(new Uint8ArrayWriter(), {
    useWebWorkers: false, level: 6, zip64: false, extendedTimestamp: false,
    ntfsTimestamp: false, rawLastModDate: 0x00210000, unixMode: 0o100644,
  });
  for (const path of packageEntries) await writer.add(path, new Uint8ArrayReader(files[path]));
  return writer.close();
}

export async function readArchive(archive: Uint8Array): Promise<PackageFiles> {
  if (!archive.length || archive.length > maxArchiveBytes) throw new Error('The ZIP is empty or exceeds the package size limit.');
  const reader = new ZipReader(new Uint8ArrayReader(archive), {
    useWebWorkers: false, strictness: 'strict', filenameValidation: 'strict',
    checkCrc32: true, checkOverlappingEntry: true,
  });
  try {
    const entries = await reader.getEntries();
    if (entries.length !== packageEntries.length) throw new Error();
    const files: Record<string, Uint8Array> = Object.create(null);
    for (const entry of entries) {
      const mode = (entry.externalFileAttributes >>> 16) & 0o170000;
      if (!entrySet.has(entry.filename) || entry.directory || entry.symlink || entry.encrypted
        || (mode !== 0 && mode !== 0o100000) || Object.hasOwn(files, entry.filename)
        || entry.uncompressedSize > (entry.filename.endsWith('.png') ? maxImageBytes : maxTextBytes)) throw new Error();
      const bytes = await entry.getData(new Uint8ArrayWriter());
      if (!bytes || bytes.length !== entry.uncompressedSize) throw new Error();
      files[entry.filename] = bytes;
    }
    checkEntries(files);
    return files;
  } catch { throw new Error('ZIP contents or integrity do not match the regular-file package allowlist.'); }
  finally { await reader.close(); }
}

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function verifiedArchive(files: PackageFiles, productVersion: string, requireListing = false) {
  const validation = await validatePackage(files, productVersion, requireListing);
  const archive = await createArchive(files);
  const extracted = await readArchive(archive);
  for (const path of packageEntries) {
    if (!Buffer.from(extracted[path]).equals(Buffer.from(files[path]))) throw new Error('Archived bytes differ from their validated source.');
  }
  await validatePackage(extracted, productVersion, requireListing);
  return { archive, validation };
}
