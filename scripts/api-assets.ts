import { copyFile, mkdir, rm } from 'node:fs/promises';

const directory = new URL('../apps/worker/dist/static/', import.meta.url);
await rm(directory, { recursive: true, force: true });
await mkdir(directory, { recursive: true });
await copyFile(new URL('../docs/api/openapi.json', import.meta.url), new URL('openapi.json', directory));
await copyFile(new URL('../apps/worker/static/_headers', import.meta.url), new URL('_headers', directory));
