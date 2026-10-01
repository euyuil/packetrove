# Command-line interface

The Packetrove CLI calculates locally. It shares the Web API's calculation and
JSON schemas and does not need a running Worker, Cloudflare account, or network
connection.

## Run from the repository

Install dependencies and build once using a supported Node.js version:

```sh
pnpm install
pnpm build
pnpm cli cidr cover 203.0.113.1 203.0.113.2 203.0.113.6
```

For scripts and agents, call the built executable directly so stdout contains
only the result, without package-manager lifecycle messages:

```sh
node packages/cli/dist/cli.js cidr cover 203.0.113.1 203.0.113.2 203.0.113.6 --json
```

Alternatively, use `pnpm --silent cli` with the same arguments.

## Input, output, and errors

```text
packetrove cidr cover <IP-or-CIDR>... [--stdin] [--json]
packetrove cidr cover --stdin [--json]
```

Positional inputs come first, followed by nonblank standard-input lines. With
`--stdin`, leading and trailing whitespace is removed from each line; blank
lines are ignored. The combined list accepts 1 to 1,000 entries, each up to 64
characters. Use IPv4 throughout or IPv6 throughout. CIDR host bits are normalized.
Overlapping or duplicate inputs count once in the address union.

For a newline-separated file:

```sh
node packages/cli/dist/cli.js cidr cover --stdin --json < addresses.txt
```

Without `--json`, output includes the CIDR, range, exact counts, normalized
inputs, and an explanation when the result covers additional addresses.

With `--json`, success writes the shared result object to stdout. Failure writes
the shared error object to stderr and leaves stdout empty. JSON error issue
indexes are zero-based positions in the combined input list. Readable errors
display one-based input numbers. Address counts remain decimal strings, including
IPv6 counts larger than JavaScript's safe integer limit. Exit status is `0` for
success or help and `1` for errors. Use `packetrove --help` for usage.

For the three IPv4 addresses above, the result is `203.0.113.0/29`, with
`inputAddressCount: "3"`, `coveredAddressCount: "8"`, and
`additionalAddressCount: "5"`. This expansion permits additional addresses in
an allowlist or blocks additional addresses in a blocklist.

## Local package artifact

The CLI's build bundles its runtime dependencies into an executable JavaScript
file. It can run outside the workspace with Node.js. To create a local package:

```sh
pnpm --filter @packetrove/cli pack --pack-destination /tmp/packetrove-artifacts
```

The package declares a `packetrove` executable for clients that install the
tarball. No package has been published to npm, and this delivery does not
install it globally.
