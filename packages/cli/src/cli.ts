#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';
import { MAX_INPUTS, PUBLIC_API_ORIGIN, PUBLIC_IP_NAME, PUBLIC_IP_PATH, type CidrCoverResult } from '@packetrove/contracts';
import { lookupPublicIp, smallestCoveringCidr, ToolError } from '@packetrove/core';

const help = `Packetrove: network tools for humans and agents.

Usage:
  packetrove cidr cover <IP-or-CIDR>... [--stdin] [--json]
  packetrove cidr cover --stdin [--json]
  packetrove ${PUBLIC_IP_NAME} [--json] [--api-origin <origin>]

Options:
  --stdin    Append one IP address or CIDR per nonblank standard-input line.
  --json     Write the shared result JSON to stdout, or error JSON to stderr.
  -h, --help Show this help and exit.
  --api-origin  IP lookup service origin (default: https://api.packetrove.com).

Use 1 to 1,000 IPv4 entries or IPv6 entries per calculation. Mixed families
are rejected. CIDR host bits are normalized. Address counts include every
address, with overlapping inputs counted once. A covering CIDR can include
additional addresses; this command calculates a range without changing rules.

CIDR calculations are offline. The public-ip command needs a network connection and
prints this machine's observed exit address. A VPN or proxy can change it. One
request observes IPv4 or IPv6; it does not separately probe both families.

Examples:
  packetrove cidr cover 203.0.113.1 203.0.113.2 203.0.113.6 --json
  packetrove cidr cover --stdin --json < addresses.txt
  packetrove public-ip
  packetrove public-ip --json

Exit status: 0 for success or help, 1 for errors.
`;

function formatResult(result: CidrCoverResult): string {
  return [
    `CIDR: ${result.cidr}`,
    `Address family: ${result.family === 'ipv4' ? 'IPv4' : 'IPv6'}`,
    `Range: ${result.range.first} - ${result.range.last}`,
    `Input addresses (union): ${result.inputAddressCount}`,
    `Covered addresses: ${result.coveredAddressCount}`,
    `Additional addresses: ${result.additionalAddressCount}`,
    ...(result.additionalAddressCount !== '0'
      ? ['This range allows additional addresses in an allowlist or blocks additional addresses in a blocklist.'] : []),
    'Normalized inputs:',
    ...result.normalizedInputs.map(input => `  ${input}`),
  ].join('\n') + '\n';
}

async function appendStandardInput(inputs: string[]): Promise<void> {
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
  try {
    for await (const line of lines) {
      const input = line.trim();
      if (!input) continue;
      inputs.push(input);
      if (inputs.length > MAX_INPUTS) {
        throw new ToolError('INVALID_INPUT', `Use at most ${MAX_INPUTS} inputs per calculation.`);
      }
    }
  } finally {
    lines.close();
    process.stdin.destroy();
  }
}

function writeOutput(destination: NodeJS.WriteStream, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    destination.write(output, error => {
      if (error) reject(new ToolError('INTERNAL_ERROR', 'Unable to write command output. The output destination may have closed.'));
      else resolve();
    });
  });
}

async function main(): Promise<void> {
  // Handle the error event as well as the write callback's rejection.
  for (const destination of [process.stdout, process.stderr]) {
    destination.on('error', () => { process.exitCode = 1; });
  }
  const args = process.argv.slice(2);
  const optionEnd = args.indexOf('--');
  let json = args.slice(0, optionEnd === -1 ? undefined : optionEnd).includes('--json');
  try {
    let parsed;
    try {
      parsed = parseArgs({
        args,
        allowPositionals: true,
        options: {
          stdin: { type: 'boolean', default: false },
          json: { type: 'boolean', default: false },
          help: { type: 'boolean', short: 'h', default: false },
          'api-origin': { type: 'string' },
        },
      });
    } catch (error) {
      throw new ToolError('INVALID_INPUT', error instanceof Error ? error.message : 'Invalid command-line arguments.');
    }
    json = parsed.values.json;
    if (parsed.values.help) {
      await writeOutput(process.stdout, help);
      return;
    }
    const [tool, command, ...inputs] = parsed.positionals;
    if (tool === PUBLIC_IP_NAME) {
      if (command !== undefined || parsed.values.stdin) {
        throw new ToolError('INVALID_INPUT', 'Use "packetrove public-ip" without positional inputs or --stdin.');
      }
      let origin: URL;
      const invalidOrigin = () => new ToolError('INVALID_INPUT', 'Use an HTTP or HTTPS API origin without credentials, a path, query, or fragment.');
      try { origin = new URL(parsed.values['api-origin'] ?? PUBLIC_API_ORIGIN); } catch { throw invalidOrigin(); }
      if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password
        || origin.pathname !== '/' || origin.search || origin.hash) throw invalidOrigin();
      const result = await lookupPublicIp(new URL(PUBLIC_IP_PATH, origin));
      await writeOutput(process.stdout, json ? `${JSON.stringify(result)}\n` : `${result.ip}\n`);
      return;
    }
    if (parsed.values['api-origin'] !== undefined) {
      throw new ToolError('INVALID_INPUT', '--api-origin is only supported by "packetrove public-ip".');
    }
    if (tool !== 'cidr' || command !== 'cover') {
      throw new ToolError('INVALID_INPUT', 'Use "packetrove cidr cover" or "packetrove public-ip". Run "packetrove --help" for usage.');
    }
    if (parsed.values.stdin) await appendStandardInput(inputs);
    const result = smallestCoveringCidr({ inputs });
    await writeOutput(process.stdout, json ? `${JSON.stringify(result)}\n` : formatResult(result));
  } catch (error) {
    const failure = error instanceof ToolError ? error
      : new ToolError('INTERNAL_ERROR', 'An unexpected error occurred.');
    process.exitCode = 1;
    const output = json ? `${JSON.stringify(failure.toResponse())}\n` : [
      `${failure.code}: ${failure.message}`,
      ...(failure.issues ?? []).map(issue => `${issue.index === undefined ? 'Input' : `Input ${issue.index + 1}`}: ${issue.message}`),
    ].join('\n') + '\n';
    try { await writeOutput(process.stderr, output); } catch {
      // An unavailable stderr cannot carry another error; retain the failure status.
    }
  }
}

await main();
