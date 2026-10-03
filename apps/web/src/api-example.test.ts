import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { toolCatalog } from '@packetrove/contracts';
import { apiExampleCommand } from './api-example';

describe('catalog-driven API example commands', () => {
  it('requests plain text only when the response declares it', () => {
    const tool = toolCatalog.ip;
    expect(apiExampleCommand(tool, 'https://api.example/v1/public-ip')).toContain("-H 'Accept: text/plain'");
    expect(apiExampleCommand({ ...tool, api: { ...tool.api, response: { description: 'JSON metadata.' } } },
      'https://api.example/v1/example-metadata')).toBe('curl -fsS https://api.example/v1/example-metadata');
  });
  it('preserves JSON with shell metacharacters as one data argument', () => {
    const request = { text: "O'Brien; $(printf altered)" };
    const tool = { ...toolCatalog.cidr, example: { name: 'Text', request, result: { characters: 26 } } };
    const command = apiExampleCommand(tool, 'https://api.example/v1/example-text');
    const args = execFileSync('sh', ['-c', 'curl() { printf "%s\\n" "$@"; }\n' + command], { encoding: 'utf8' }).trim().split('\n');
    expect(args).toEqual(['-fsS', 'https://api.example/v1/example-text', '-H', 'Content-Type: application/json', '-d', JSON.stringify(request)]);
  });
});
