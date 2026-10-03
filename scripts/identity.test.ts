import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { PACKETROVE_IDENTITY, PUBLIC_WEBSITE_ORIGIN } from '../packages/contracts/src/identity';

it('describes the existing project-owned PNG with its actual dimensions and no theme claim', async () => {
  expect(PACKETROVE_IDENTITY.name).toBe('Packetrove');
  expect(PACKETROVE_IDENTITY.title).toBe(PACKETROVE_IDENTITY.name);
  expect(PACKETROVE_IDENTITY.websiteUrl).toBe(PUBLIC_WEBSITE_ORIGIN);
  for (const icon of PACKETROVE_IDENTITY.icons) {
    const url = new URL(icon.src);
    expect(url.protocol).toBe('https:');
    expect(url.origin).toBe(PUBLIC_WEBSITE_ORIGIN);
    expect(url.search).toBe('');
    expect(url.hash).toBe('');
    const bytes = await readFile(new URL('../apps/web/public' + url.pathname, import.meta.url));
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(bytes.subarray(12, 16).toString()).toBe('IHDR');
    expect(icon.mimeType).toBe('image/png');
    expect(icon.sizes).toEqual([`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`]);
    expect(icon).not.toHaveProperty('theme');
  }
});
