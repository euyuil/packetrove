import { expect, it } from 'vitest';
import { assertPullRequestRoute } from './pr-routing';

it('routes ordinary development and candidate fixes to their integration branch', () => {
  expect(() => assertPullRequestRoute('codex/example', 'develop', [])).not.toThrow();
  expect(() => assertPullRequestRoute('codex/example', 'release-0.5.0', [])).not.toThrow();
  expect(() => assertPullRequestRoute('codex/example', 'main', [])).toThrow('Daily work');
});

it('accepts promotion and explicitly declared hotfixes on main', () => {
  expect(() => assertPullRequestRoute('release-0.5.0', 'main', [])).not.toThrow();
  expect(() => assertPullRequestRoute('codex/emergency-fix', 'main', ['hotfix'])).not.toThrow();
  expect(() => assertPullRequestRoute('release-please--branches--main', 'main', [])).toThrow();
});
