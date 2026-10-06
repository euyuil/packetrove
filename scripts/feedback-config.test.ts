import { expect, it } from 'vitest';
import { createFeedbackConfig, readFeedbackEnvironment } from '../apps/worker/scripts/feedback-config';

const base = { name: 'synthetic-worker', main: 'src/index.ts', assets: { directory: 'dist/static' },
  vars: { PUBLIC_API_ORIGIN: 'https://api.example.com' },
  env: { staging: { name: 'synthetic-staging', vars: { PUBLIC_API_ORIGIN: 'https://api.staging.example.com' } } } };
const uuid = '00000000-0000-4000-8000-000000000001';

it('keeps feedback off without provisioning storage and preserves relative asset resolution', () => {
  const config = createFeedbackConfig(base, {}, '/synthetic/worker');
  expect(config.vars?.PACKETROVE_FEEDBACK_ENABLED).toBe('false');
  expect(config.d1_databases).toBeUndefined();
  expect(config.triggers).toBeUndefined();
  expect(config.main).toBe('/synthetic/worker/src/index.ts');
  expect(config.assets?.directory).toBe('/synthetic/worker/dist/static');
  expect(base.vars).not.toHaveProperty('PACKETROVE_FEEDBACK_ENABLED');
});
it('keeps independent environment bindings and retention cleanup when submissions are off', () => {
  const config = createFeedbackConfig(base, { PACKETROVE_FEEDBACK_DB_ID: uuid }, '/synthetic/worker', 'staging');
  expect(config.d1_databases).toBeUndefined();
  expect(config.env?.staging?.vars).toMatchObject({ PACKETROVE_FEEDBACK_ENABLED: 'false', PUBLIC_API_ORIGIN: 'https://api.staging.example.com' });
  expect(config.env?.staging?.d1_databases).toEqual([{ binding: 'FEEDBACK_DB', database_name: 'packetrove-feedback-staging',
    database_id: uuid, migrations_dir: '/synthetic/worker/migrations' }]);
  expect(config.env?.staging?.triggers?.crons).toEqual(['0 * * * *']);
});
it('requires explicit configuration without echoing rejected private values', () => {
  expect(() => createFeedbackConfig(base, { PACKETROVE_FEEDBACK_ENABLED: 'true' }, '/synthetic')).toThrow('requires');
  expect(() => createFeedbackConfig(base, { PACKETROVE_FEEDBACK_DB_ID: 'synthetic-private-value' }, '/synthetic')).toThrow('database UUID');
  expect(() => createFeedbackConfig(base, { PACKETROVE_FEEDBACK_ENABLED: 'other' }, '/synthetic')).toThrow('true or false');
  expect(createFeedbackConfig(base, { PACKETROVE_FEEDBACK_DB_ID: uuid, PACKETROVE_FEEDBACK_ENABLED: 'true' }, '/synthetic')
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
