import { writeFile } from 'node:fs/promises';
import { CERTIFICATE_BUNDLE_SAMPLES, CERTIFICATE_EXAMPLE_TIME } from '@packetrove/contracts';
import { checkCertificateBundle } from '../src/certificate-bundle';

const results = await Promise.all(CERTIFICATE_BUNDLE_SAMPLES.slice(0, 2).map(sample =>
  checkCertificateBundle(sample.request, new Date(CERTIFICATE_EXAMPLE_TIME))));
await writeFile(new URL('../../contracts/src/certificate-examples.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
console.log('Generated fixed-clock observations for two synthetic certificate examples.');
