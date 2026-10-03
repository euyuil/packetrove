import { checkOrWriteGeneratedFile } from './generated-file';
import { createOpenApiDocument } from '../packages/contracts/src/openapi';

const target = new URL('../docs/api/openapi.json', import.meta.url);
const generated = `${JSON.stringify(createOpenApiDocument(), null, 2)}\n`;
await checkOrWriteGeneratedFile(target, generated, 'OpenAPI specification is out of date. Run pnpm spec:generate.');
