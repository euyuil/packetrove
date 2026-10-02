# Packetrove CLI

Network calculations and IP diagnostics for humans, scripts, and agents.

The `@packetrove/cli` package contains the `packetrove` executable and bundles
its runtime dependencies. CIDR calculations run locally without a network
connection. The `ip` command queries the public IP observed for this machine's
connection.

## Installation

Once a version is published to npm, install it with Node.js and npm; Git, pnpm,
and a source checkout are not needed:

```sh
npm install --global @packetrove/cli
packetrove --help
```

Alternatively, run a published version without a global installation:

```sh
npx @packetrove/cli cidr cover 203.0.113.1 203.0.113.2 203.0.113.6 --json
```

Supported Node.js versions are 22.22.2 or later in the 22.x line, 24.15.0 or
later in the 24.x line, and 26 or later. Before the first release, follow the
[source installation guide](https://github.com/euyuil/packetrove/blob/main/docs/integrations/cli.md#install-from-source).

## Cover IP addresses and CIDR ranges

```sh
packetrove cidr cover 203.0.113.1 203.0.113.2 203.0.113.6
packetrove cidr cover --stdin --json < addresses.txt
```

Use 1 to 1,000 IPv4 entries or IPv6 entries. CIDR host bits are normalized;
duplicates and overlaps count once. The example returns `203.0.113.0/29`,
covering eight addresses, including five beyond the supplied three. That wider
range permits additional addresses in an allowlist or blocks additional
addresses in a blocklist. The command calculates a range without applying
firewall rules.

With `--json`, success writes the shared result object to stdout. Errors write
the shared error object to stderr and exit with status `1`. Address counts are
decimal strings, including IPv6 counts beyond JavaScript's safe integer limit.
A failed output write may leave partial stdout; check the exit status before
using a result.

## Check the current public IP

```sh
packetrove ip
packetrove ip --json
packetrove ip --api-origin http://localhost:8787 --json
```

Without `--json`, stdout contains just the address and a newline. The default
endpoint is `https://api.packetrove.com/v1/ip`; a lookup makes a network request
with a 10-second timeout, no cache, and no redirects. `--api-origin` supports a
self-hosted HTTP or HTTPS origin without credentials, a path, query, or fragment.

The result describes the connection from the machine running the command. A VPN
or proxy changes the observed address. One request observes IPv4 or IPv6; it
does not separately discover both families.

## Documentation and license

- [CLI guide](https://github.com/euyuil/packetrove/blob/main/docs/integrations/cli.md)
- [Project website](https://packetrove.com)
- [Source and issues](https://github.com/euyuil/packetrove)

Packetrove is licensed under the MIT License. This package includes `LICENSE`
and `THIRD_PARTY_NOTICES` for the bundled third-party components.
