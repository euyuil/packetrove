# Agent skill

The repository provides the portable
[`packetrove-cidr-cover` skill](../../skills/packetrove-cidr-cover/SKILL.md).
It teaches an agent to select an available Packetrove interface, calculate a
covering CIDR, check errors, and explain address expansion for allowlists and
blocklists.

## Setup

Copy the entire `skills/packetrove-cidr-cover` directory into a skills location
supported by your agent client. Skill discovery and activation depend on that
client. This delivery keeps the skill in the repository and does not modify
global agent settings.

Provide one working calculation interface:

- A `packetrove` CLI executable on the agent's command path, installed from the
  local CLI artifact.
- A Packetrove checkout path with dependencies installed and the CLI built.
  The agent can run `node /path/to/packetrove/packages/cli/dist/cli.js`.
- A configured remote MCP connection following the [MCP guide](mcp.md).

The CLI option is offline after the build. MCP requires the configured Worker
to be reachable. The skill itself does not create a hosted service or install
these prerequisites.

## Example request

> Use Packetrove to find the smallest single CIDR covering 203.0.113.1,
> 203.0.113.2, and 203.0.113.6. Explain how many additional addresses an
> allowlist would admit.

The calculation returns `203.0.113.0/29`, covering eight addresses with five
additional addresses. The skill directs the agent to report those counts from
the tool, preserve exact decimal-string IPv6 counts, and show invalid inputs
instead of omitting them.

The skill supports calculation and explanation. It does not include cloud
firewall credentials or an operation that applies rules.
