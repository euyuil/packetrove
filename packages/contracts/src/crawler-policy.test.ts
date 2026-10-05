import { expect, it } from 'vitest';
import { getNonProductionCrawlerPolicy } from './identity';

it.each([
  'https://dev.packetrove.com', 'https://staging.packetrove.com',
  'https://api.dev.packetrove.com', 'https://api.staging.packetrove.com',
  'https://DEV.PACKETROVE.COM:443/',
])('recognizes the configured non-production origin %s', origin => {
  expect(getNonProductionCrawlerPolicy(origin)).toEqual({
    robotsText: 'User-agent: *\nDisallow: /\n', robotsTag: 'noindex',
  });
});

it.each([
  'https://packetrove.com', 'https://api.packetrove.com', 'http://localhost:8787',
  'https://dev.example.com', 'https://dev.packetrove.com.example.com',
  'https://api.devpacketrove.com', 'https://preview.dev.packetrove.com',
])('keeps production, local, self-hosted, and unrelated origins outside the policy: %s', origin => {
  expect(getNonProductionCrawlerPolicy(origin)).toBeUndefined();
});

it('keeps missing local bindings outside the non-production policy', () => {
  expect(getNonProductionCrawlerPolicy()).toBeUndefined();
});
