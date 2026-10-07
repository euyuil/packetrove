import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { experimental_readRawConfig, type Unstable_RawConfig as RawConfig } from 'wrangler';
import { SUPPORT_EMAIL, FEEDBACK_SENDER_EMAIL } from '@packetrove/contracts';

type Environment = 'development' | 'staging';
const workerDirectory = fileURLToPath(new URL('../', import.meta.url));
export const privateConfigPath = resolve(workerDirectory, '.wrangler/feedback/wrangler.json');

/** Keep private namespace identifiers outside tracked configuration and build artifacts. */
export function createFeedbackConfig(base: RawConfig, variables: NodeJS.ProcessEnv,
  directory: string, environment?: Environment): RawConfig {
  const enabled = variables.PACKETROVE_FEEDBACK_ENABLED || 'false';
  const namespaceId = variables.PACKETROVE_FEEDBACK_KV_ID;
  if (!['true', 'false'].includes(enabled)) throw new Error('PACKETROVE_FEEDBACK_ENABLED must be true or false.');
  if (namespaceId && !/^[0-9a-f]{32}$/i.test(namespaceId)) {
    throw new Error('PACKETROVE_FEEDBACK_KV_ID must be a KV namespace identifier.');
  }
  if (environment && (enabled === 'true' || namespaceId)) throw new Error('Feedback mail and quota bindings are production-only.');
  if (enabled === 'true' && !namespaceId) throw new Error('Feedback activation requires PACKETROVE_FEEDBACK_KV_ID.');
  const config = structuredClone(base);
  if (config.main) config.main = resolve(directory, config.main);
  if (config.assets?.directory) config.assets.directory = resolve(directory, config.assets.directory);
  const target = environment ? config.env?.[environment] : config;
  if (!target) throw new Error('The selected deployment environment is not configured.');
  target.vars = { ...target.vars, PACKETROVE_FEEDBACK_ENABLED: enabled };
  // Explicitly remove the retired feedback cleanup trigger on deployment.
  target.triggers = { crons: [] };
  if (namespaceId) {
    target.kv_namespaces = [...(target.kv_namespaces ?? []), { binding: 'FEEDBACK_QUOTA', id: namespaceId }];
    target.send_email = [...(target.send_email ?? []), { name: 'FEEDBACK_EMAIL',
      destination_address: SUPPORT_EMAIL, allowed_sender_addresses: [FEEDBACK_SENDER_EMAIL] }];
  }
  return config;
}

export function writeFeedbackConfig(variables: NodeJS.ProcessEnv, environment?: Environment) {
  const { rawConfig } = experimental_readRawConfig({ config: resolve(workerDirectory, 'wrangler.jsonc') });
  const config = createFeedbackConfig(rawConfig, variables, workerDirectory, environment);
  mkdirSync(dirname(privateConfigPath), { recursive: true, mode: 0o700 });
  writeFileSync(privateConfigPath, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
  chmodSync(privateConfigPath, 0o600);
  return privateConfigPath;
}

export function readFeedbackEnvironment(args: string[], defaultEnvironment = process.env.CLOUDFLARE_ENV): Environment | undefined {
  const values: Array<string | undefined> = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    if (arg === '--env' || arg === '-e') values.push(args[++index]);
    else if (arg.startsWith('--env=') || arg.startsWith('-e=')) values.push(arg.slice(arg.indexOf('=') + 1));
  }
  const selected = values.length ? values[0] : defaultEnvironment;
  if (values.length > 1 || (values.length && selected === undefined)
    || (selected !== undefined && selected !== '' && selected !== 'development' && selected !== 'staging')) {
    throw new Error('Select one development or staging environment, or omit --env for production.');
  }
  return selected || undefined;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, ...args] = process.argv.slice(2);
    const environment = readFeedbackEnvironment(args);
    const path = writeFeedbackConfig(process.env, environment);
    if (command === 'config') console.log('Prepared private feedback configuration in .wrangler/feedback/wrangler.json.');
    else if (command === 'deploy') {
      if (args.some(arg => arg === '--config' || arg === '-c' || arg.startsWith('--config='))) {
        throw new Error('The API deployment command owns its generated configuration.');
      }
      const result = spawnSync('pnpm', ['exec', 'wrangler', 'deploy', '--config', path, ...args],
        { cwd: workerDirectory, stdio: 'inherit' });
      if (result.error) throw new Error('Unable to start Wrangler deployment.');
      process.exitCode = result.status ?? 1;
    } else throw new Error('Use config or deploy.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Feedback configuration failed.');
    process.exitCode = 1;
  }
}
