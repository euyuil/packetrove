import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CIDR_COVER_EXAMPLES, CidrCoverResultSchema, ErrorResponseSchema } from '@packetrove/contracts';
import { smallestCoveringCidr } from '@packetrove/core';

const bundle = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
function run(args: string[], input = '') {
  const result = spawnSync(process.execPath, [bundle, ...args], {
    input, encoding: 'utf8', timeout: 10_000,
  });
  if (result.error) throw result.error;
  return result;
}

describe('bundled offline CLI', () => {
  it.each(CIDR_COVER_EXAMPLES)('prints the shared JSON result for $name', ({ request, result }) => {
    const execution = run(['cidr', 'cover', ...request.inputs, '--json']);
    expect(execution.status).toBe(0);
    expect(execution.stderr).toBe('');
    expect(CidrCoverResultSchema.parse(JSON.parse(execution.stdout))).toEqual(result);
  });
  it('preserves dotted-tail IPv6 values in the bundled shared calculation', () => {
    const inputs = ['::192.0.2.1', '::c000:201'];
    const execution = run(['cidr', 'cover', ...inputs, '--json']);
    expect(execution.status).toBe(0);
    expect(execution.stderr).toBe('');
    const result = CidrCoverResultSchema.parse(JSON.parse(execution.stdout));
    expect(result).toEqual(smallestCoveringCidr({ inputs }));
    expect(result.cidr).toBe('::c000:201/128');
    expect(result.inputAddressCount).toBe('1');
  });
  it('combines positional inputs and nonblank stdin lines in order', () => {
    const execution = run(['cidr', 'cover', '203.0.113.1', '--stdin', '--json'], '\r\n 203.0.113.2 \r\n\r\n203.0.113.6\n');
    expect(execution.status).toBe(0);
    expect(JSON.parse(execution.stdout)).toEqual(CIDR_COVER_EXAMPLES[1]!.result);
  });
  it('accepts stdin without positional addresses', () => {
    const execution = run(['cidr', 'cover', '--stdin', '--json'], '203.0.113.99/24\n');
    expect(execution.status).toBe(0);
    expect(JSON.parse(execution.stdout).normalizedInputs).toEqual(['203.0.113.0/24']);
  });
  it('prints exact counts and the expansion consequence in human-readable output', () => {
    const execution = run(['cidr', 'cover', '203.0.113.1', '203.0.113.2']);
    expect(execution.status).toBe(0);
    expect(execution.stdout).toContain('CIDR: 203.0.113.0/30');
    expect(execution.stdout).toContain('Additional addresses: 2');
    expect(execution.stdout).toContain('allows additional addresses in an allowlist');
    expect(execution.stderr).toBe('');
  });
  it.each([
    { args: ['cidr', 'cover', '203.0.113.1', '::1', '--json'], code: 'MIXED_ADDRESS_FAMILIES' },
    { args: ['cidr', 'cover', 'invalid', '--json'], code: 'INVALID_INPUT' },
    { args: ['cidr', 'cover', '--json'], code: 'INVALID_INPUT' },
    { args: ['unknown', '--json'], code: 'INVALID_INPUT' },
    { args: ['cidr', 'cover', '203.0.113.1', '--unknown', '--json'], code: 'INVALID_INPUT' },
  ])('writes $code to stderr with a nonzero status for $args', ({ args, code }) => {
    const execution = run(args);
    expect(execution.status).toBe(1);
    expect(execution.stdout).toBe('');
    expect(ErrorResponseSchema.parse(JSON.parse(execution.stderr)).error.code).toBe(code);
  });
  it('reports the one-based input number in readable errors', () => {
    const execution = run(['cidr', 'cover', '203.0.113.1', 'invalid']);
    expect(execution.status).toBe(1);
    expect(execution.stderr).toContain('Input 2:');
  });
  it('rejects too many piped entries instead of silently truncating them', () => {
    const execution = run(['cidr', 'cover', '--stdin', '--json'], '203.0.113.1\n'.repeat(1_001));
    expect(execution.status).toBe(1);
    expect(execution.stdout).toBe('');
    expect(JSON.parse(execution.stderr).error.code).toBe('INVALID_INPUT');
  });
  it('shows usage without needing inputs', () => {
    const execution = run(['--help']);
    expect(execution.status).toBe(0);
    expect(execution.stdout).toContain('packetrove cidr cover');
    expect(execution.stderr).toBe('');
  });
  it('runs from outside the workspace without installed dependencies or network access', () => {
    const directory = mkdtempSync(join(tmpdir(), 'packetrove-cli-'));
    try {
      const executable = join(directory, 'cli.mjs');
      copyFileSync(bundle, executable);
      const execution = spawnSync(process.execPath, [executable, 'cidr', 'cover', '::/0', '--json'], {
        cwd: directory, encoding: 'utf8', timeout: 10_000,
        env: { ...process.env, HTTP_PROXY: 'http://127.0.0.1:1', HTTPS_PROXY: 'http://127.0.0.1:1' },
      });
      expect(execution.error).toBeUndefined();
      expect(execution.status).toBe(0);
      expect(execution.stderr).toBe('');
      const result = CidrCoverResultSchema.parse(JSON.parse(execution.stdout));
      expect(result.coveredAddressCount).toBe('340282366920938463463374607431768211456');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
