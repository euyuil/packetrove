# Command-line interface

The Packetrove CLI shares the Web API's result schemas. CIDR calculations run
locally without a Worker, Cloudflare account, or network connection. The `ip`
command queries the current connection through an IP lookup API.

## Install from npm after the first release

The package is prepared for public distribution as `@packetrove/cli`. Its first
npm release is pending. Once a version is published, users need only a supported
Node.js version and npm:

```sh
npm install --global @packetrove/cli
packetrove --help
packetrove cidr cover 203.0.113.1 203.0.113.2 203.0.113.6 --json
```

For a one-off calculation, use a published package without a global installation:

```sh
npx @packetrove/cli cidr cover 203.0.113.1 203.0.113.2 203.0.113.6 --json
```

Use `@packetrove/cli@<version>` to pin a published version for reproducible
scripts. Supported Node.js versions are 22.22.2+ in the 22.x line, 24.15.0+ in
the 24.x line, and 26+. Git and pnpm are needed only for development or source
installation. Maintainers should follow the [publishing guide](../cli-publishing.md).

## Install from source

The CLI is not published to npm. With Git, Node.js, and pnpm installed, clone
the repository, build a package, and install that local archive:

```sh
git clone https://github.com/euyuil/packetrove.git
cd packetrove
pnpm install
pnpm --filter @packetrove/cli pack --pack-destination "$PWD"
npm install --global ./packetrove-cli-0.1.0.tgz
packetrove ip
```

Use the Node.js version in `.node-version` and the pnpm version in `package.json`.
The pack command builds the bundled executable before creating the archive.
`packetrove ip` prints the current public IP and a newline; `packetrove ip --json`
prints the shared JSON result.

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

With `--json`, success writes the shared result object to stdout. Failures before
output begins write the shared error object to stderr and leave stdout empty.
JSON error issue
indexes are zero-based positions in the combined input list. Readable errors
display one-based input numbers. Address counts remain decimal strings, including
IPv6 counts larger than JavaScript's safe integer limit. Exit status is `0` for
success or help and `1` for errors. Use `packetrove --help` for usage.

If stdout cannot be written, including when a pipe receiver closes early, the
CLI reports `INTERNAL_ERROR` to stderr in the selected JSON or readable format
and exits with status `1`. Already written stdout bytes cannot be withdrawn, so
a failed write may leave partial output. A receiver closing after the output has
been accepted can still complete successfully. If stderr is also unavailable,
the error cannot be delivered; the CLI retains status `1` without a native stack.

For the three IPv4 addresses above, the result is `203.0.113.0/29`, with
`inputAddressCount: "3"`, `coveredAddressCount: "8"`, and
`additionalAddressCount: "5"`. This expansion permits additional addresses in
an allowlist or blocks additional addresses in a blocklist.

## Current public IP

```sh
node packages/cli/dist/cli.js ip
node packages/cli/dist/cli.js ip --json
```

Without `--json`, stdout contains just the IP address and a newline for shell
use. With `--json`, stdout contains the shared result, for example
`{ "ip": "203.0.113.1", "family": "ipv4" }`. Errors follow the same stderr and
exit-status convention as the calculator.

The command queries `https://api.packetrove.com/v1/ip` without authentication,
with a 10-second timeout, no cache, and no redirects. It rejects invalid or
inconsistent result JSON. It does not read standard input or take address
arguments. For a self-hosted deployment or local integration test:

```sh
node packages/cli/dist/cli.js ip --api-origin http://localhost:8787 --json
```

`--api-origin` is supported only by `ip`. Use an HTTP or HTTPS origin without
credentials, a path, query, or fragment. An endpoint without Cloudflare connection
metadata returns `CLIENT_IP_UNAVAILABLE`. The command does not print underlying
network exception details or an invalid response body.

The result describes the machine running the CLI and its network path. A VPN or
proxy changes the observed address, and the browser may use a different path.
One request observes IPv4 or IPv6; it does not separately discover both.
When HTTP proxy environment variables are configured, the pinned Node.js
version can opt into them with `--use-env-proxy`:

```sh
node --use-env-proxy packages/cli/dist/cli.js ip --json
```

This uses Node.js's `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY` support; it does
not automatically import browser or operating-system proxy preferences.

## Local package artifact

The CLI's build bundles its runtime dependencies into an executable JavaScript
file. It can run outside the workspace with Node.js. To create a local package:

```sh
pnpm --filter @packetrove/cli pack --pack-destination /tmp/packetrove-artifacts
```

The package declares a `packetrove` executable for clients that install the
tarball. Packing alone does not install it; the source-install commands above
install the archive globally. No package has been published to npm.

`pnpm check` also packs the CLI in a temporary workspace, installs that archive
offline with both npm and pnpm in isolated consumers, and runs the installed
`packetrove` command. It checks the executable, public package metadata, README,
license notices, and structured success and error output without publishing or
installing anything globally.
