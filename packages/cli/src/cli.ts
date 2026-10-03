#!/usr/bin/env node
import { parseArgs } from 'node:util';
import {
  cliTools, toolCatalog, PUBLIC_API_ORIGIN, PUBLIC_IP_PATH, type CidrCoverResult, type CliToolPage,
} from '@packetrove/contracts';
import { lookupPublicIp, smallestCoveringCidr, ToolError } from '@packetrove/core';
import { appendStandardInput } from './stdin';

const usage: Record<CliToolPage, string[]> = {
  cidr: ['<IP-or-CIDR>... [--stdin] [--json]', '--stdin [--json]'],
  ip: ['[--json] [--api-origin <origin>]'],
};
const coverCommand = toolCatalog.cidr.cli.command;
const ipCommand = toolCatalog.ip.cli.command;
const help = `Packetrove: network tools for humans and agents.

Usage:
${cliTools.flatMap(tool => usage[tool.page].map(options => `  packetrove ${tool.cli.command} ${options}`)).join('\n')}

Options:
  --stdin    Append one IP address or CIDR per nonblank standard-input line.
  --json     Write the shared result JSON to stdout, or error JSON to stderr.
  -h, --help Show this help and exit.
  --api-origin  IP lookup service origin (default: https://api.packetrove.com).

Use 1 to 1,000 IPv4 entries or IPv6 entries per calculation. Mixed families
are rejected. CIDR host bits are normalized. Address counts include every
address, with overlapping inputs counted once. A covering CIDR can include
additional addresses; this command calculates a range without changing rules.

CIDR calculations are offline. The ${ipCommand} command needs a network connection and
prints this machine's observed exit address. A VPN or proxy can change it. One
request observes IPv4 or IPv6; it does not separately probe both families.

Examples:
  packetrove ${coverCommand} 203.0.113.1 203.0.113.2 203.0.113.6 --json
  packetrove ${coverCommand} --stdin --json < addresses.txt
  packetrove ${ipCommand}
  packetrove ${ipCommand} --json

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

function writeOutput(destination: NodeJS.WriteStream, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    destination.write(output, error => {
      if (error) reject(new ToolError('INTERNAL_ERROR', 'Unable to write command output. The output destination may have closed.'));
      else resolve();
    });
  });
}

type CommandInput = { inputs: string[]; stdin: boolean; json: boolean; apiOrigin: string | undefined };

// The enabled catalog entries determine which handlers must be implemented.
const handlers: Record<CliToolPage, (request: CommandInput) => Promise<string>> = {
  cidr: async ({ inputs, stdin, json, apiOrigin }) => {
    if (apiOrigin !== undefined) {
      throw new ToolError('INVALID_INPUT', `--api-origin is only supported by "packetrove ${ipCommand}".`);
    }
    if (stdin) await appendStandardInput(inputs, process.stdin);
    const result = smallestCoveringCidr({ inputs });
    return json ? `${JSON.stringify(result)}\n` : formatResult(result);
  },
  ip: async ({ inputs, stdin, json, apiOrigin }) => {
    if (inputs.length || stdin) {
      throw new ToolError('INVALID_INPUT', `Use "packetrove ${ipCommand}" without positional inputs or --stdin.`);
    }
    let origin: URL;
    const invalidOrigin = () => new ToolError('INVALID_INPUT', 'Use an HTTP or HTTPS API origin without credentials, a path, query, or fragment.');
    try { origin = new URL(apiOrigin ?? PUBLIC_API_ORIGIN); } catch { throw invalidOrigin(); }
    if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password
      || origin.pathname !== '/' || origin.search || origin.hash) throw invalidOrigin();
    const result = await lookupPublicIp(new URL(PUBLIC_IP_PATH, origin));
    return json ? `${JSON.stringify(result)}\n` : `${result.ip}\n`;
  },
};

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
    const [command, ...inputs] = parsed.positionals;
    const selected = cliTools.find(tool => tool.cli.command === command);
    if (!selected) {
      const commands = cliTools.map(tool => `"packetrove ${tool.cli.command}"`).join(' or ');
      throw new ToolError('INVALID_INPUT', `Use ${commands}. Run "packetrove --help" for usage.`);
    }
    const output = await handlers[selected.page]({ inputs, stdin: parsed.values.stdin, json,
      apiOrigin: parsed.values['api-origin'] });
    await writeOutput(process.stdout, output);
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
