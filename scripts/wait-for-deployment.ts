import { waitForDeployment } from './deployment-readiness';

try {
  const origin = process.argv[2];
  if (!origin || process.argv.length !== 3) {
    throw new Error('Usage: pnpm wait:deployment <http-or-https-origin>');
  }
  await waitForDeployment(origin, process.env.VITE_GIT_COMMIT ?? '');
  console.log('PASS expected website version is ready for production checks');
} catch (failure) {
  console.error(failure instanceof Error ? failure.message : 'Unable to confirm the expected website version.');
  process.exitCode = 1;
}
