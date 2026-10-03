import type { InputIssue } from './schemas';

/** Normalize public locations without assigning them to any particular tool. */
export function inputIssuePath(issue: InputIssue): readonly (string | number)[] | undefined {
  if (issue.path !== undefined) return issue.path;
  if (issue.field !== undefined) return [issue.field];
  if (issue.list !== undefined) return issue.index === undefined ? [issue.list] : [issue.list, issue.index];
  return issue.index === undefined ? undefined : [issue.index];
}
