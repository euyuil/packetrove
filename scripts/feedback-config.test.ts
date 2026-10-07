import { expect, it } from 'vitest';
import { SUPPORT_EMAIL, FEEDBACK_SENDER_EMAIL } from '../packages/contracts/src/identity';
import { createFeedbackConfig, readFeedbackEnvironment } from '../apps/worker/scripts/feedback-config';

const base = { name: 'synthetic-worker', main: 'src/index.ts', assets: { directory: 'dist/static' },
  vars: { PUBLIC_API_ORIGIN: 'https://api.example.com' },
  env: { staging: { name: 'synthetic-staging', vars: { PUBLIC_API_ORIGIN: 'https://api.staging.example.com' } } } };
const namespaceId = '00000000000000000000000000000001';

it('keeps feedback off without provisioning storage and preserves relative asset resolution', () => {
  const config = createFeedbackConfig(base, {}, '/synthetic/worker');
  expect(config.vars?.PACKETROVE_FEEDBACK_ENABLED).toBe('false');
  expect(config.kv_namespaces).toBeUndefined();
  expect(config.send_email).toBeUndefined();
  expect(config.d1_databases).toBeUndefined();
  expect(config.triggers?.crons).toEqual([]);
  expect(config.main).toBe('/synthetic/worker/src/index.ts');
  expect(config.assets?.directory).toBe('/synthetic/worker/dist/static');
  expect(base.vars).not.toHaveProperty('PACKETROVE_FEEDBACK_ENABLED');
});
it('prepares production quota and restricted mail bindings while activation remains off', () => {
  const config = createFeedbackConfig(base, { PACKETROVE_FEEDBACK_KV_ID: namespaceId }, '/synthetic/worker');
  expect(config.vars?.PACKETROVE_FEEDBACK_ENABLED).toBe('false');
  expect(config.kv_namespaces).toEqual([{ binding: 'FEEDBACK_QUOTA', id: namespaceId }]);
  expect(config.send_email).toEqual([{ name: 'FEEDBACK_EMAIL', destination_address: SUPPORT_EMAIL,
    allowed_sender_addresses: [FEEDBACK_SENDER_EMAIL] }]);
  expect(config.d1_databases).toBeUndefined();
  expect(config.triggers?.crons).toEqual([]);
  expect(config.env?.staging?.kv_namespaces).toBeUndefined();
  expect(config.env?.staging?.send_email).toBeUndefined();
});
it('keeps named environments disabled and rejects production bindings or activation there', () => {
  const config = createFeedbackConfig(base, {}, '/synthetic/worker', 'staging');
  expect(config.env?.staging?.vars).toMatchObject({ PACKETROVE_FEEDBACK_ENABLED: 'false', PUBLIC_API_ORIGIN: 'https://api.staging.example.com' });
  expect(config.env?.staging?.kv_namespaces).toBeUndefined();
  expect(config.env?.staging?.send_email).toBeUndefined();
  expect(() => createFeedbackConfig(base, { PACKETROVE_FEEDBACK_KV_ID: namespaceId }, '/synthetic', 'staging')).toThrow('production-only');
  expect(() => createFeedbackConfig(base, { PACKETROVE_FEEDBACK_ENABLED: 'true' }, '/synthetic', 'staging')).toThrow('production-only');
});
it('requires explicit configuration without echoing rejected private values', () => {
  expect(() => createFeedbackConfig(base, { PACKETROVE_FEEDBACK_ENABLED: 'true' }, '/synthetic')).toThrow('requires');
  expect(() => createFeedbackConfig(base, { PACKETROVE_FEEDBACK_KV_ID: 'synthetic-private-value' }, '/synthetic')).toThrow('KV namespace identifier');
  expect(() => createFeedbackConfig(base, { PACKETROVE_FEEDBACK_ENABLED: 'other' }, '/synthetic')).toThrow('true or false');
  expect(createFeedbackConfig(base, { PACKETROVE_FEEDBACK_KV_ID: namespaceId, PACKETROVE_FEEDBACK_ENABLED: 'true' }, '/synthetic')
    .vars?.PACKETROVE_FEEDBACK_ENABLED).toBe('true');
});
it('uses the exact Wrangler destination for both flag forms and rejects ambiguous destinations', () => {
  expect(readFeedbackEnvironment(['--env=staging'])).toBe('staging');
  expect(readFeedbackEnvironment(['-e', 'development'])).toBe('development');
  expect(readFeedbackEnvironment(['--tag', 'synthetic'])).toBeUndefined();
  expect(readFeedbackEnvironment([], 'staging')).toBe('staging');
  expect(readFeedbackEnvironment(['--env=development'], 'staging')).toBe('development');
  expect(readFeedbackEnvironment(['--env='], 'staging')).toBeUndefined();
  expect(() => readFeedbackEnvironment(['--env'])).toThrow('Select one');
  expect(() => readFeedbackEnvironment(['--env=staging', '-e', 'development'])).toThrow('Select one');
});
