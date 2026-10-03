# Service privacy and operational logging

## User story

As a person using Packetrove through the website, API, CLI, or an AI plugin, I
want to understand what reaches the service, what its application logs contain,
which providers receive data, and how long operational records are queryable,
so that I can choose an interface suitable for my network information.

## Public policy

The authoritative public policy is the static `/privacy` page, translated for
every registered locale. Its maintained content lives in the website translation
resources. The project-resource footer and MCP guide link to the same-language
page. MCP discovery descriptions link to the canonical English policy. It is
outside the primary navigation, and reading it does not execute a tool.

The policy distinguishes browser and offline CLI calculations from remote
API/MCP processing, and explains the tab-local language-suggestion flag and
system clipboard. Remote calls submit calculation arguments, not a requested
conversation history or account credentials. Results go back to the client,
whose storage and policies are separate from Packetrove.

Public-IP lookup uses the calling connection, including a hosted AI client's
possible exit address. Do not present that result as a user's device IP without
establishing where the client runs. Application storage contains no lookup or
calculation history.

Application unexpected-error events include only the fixed event name
`request_failure` and `error_code: INTERNAL_ERROR`. Logging must not replace a
response if the logging sink throws. Do not pass exception objects, input
values, results, returned IP addresses, or request headers to this logger.

Cloudflare processes requests as the hosting provider. Application event
fields do not describe the whole platform log record: technical metadata may
include timestamps, request URLs, and identifiers. Workers Logs, when enabled,
are currently queryable for three days on Free or seven days on Paid; the
announced Free retention is seven days from December 1, 2026. This is not a
promise about deletion of all independent Cloudflare network or security data.

Local calculations and disconnecting a plugin provide choices without implying
that disconnecting removes results retained by the client. Do not claim a
per-call logging opt-out, account-linked history, or individual-call deletion
capability. Privacy questions and applicable rights requests use the existing
project email address; public issues must not include private network data.

## Acceptance

- Every localized page is prerendered with its complete policy, unique heading,
  contact, canonical metadata, alternate links, and sitemap entry.
- Footer navigation opens the same-language policy, marks the current page,
  focuses the named main region, and makes no tool request.
- The mobile menu identifies the policy page without adding it to the browser
  tool destinations.
- Unexpected HTTP errors keep their existing response and expose no exception
  details in the controlled application event, including when logging fails.
- Production smoke checks verify policy content and footer entry points.
- Directory listing URLs are considered available only after deployment and
  public-page verification. No directory submission is performed by this change.

This delivery publishes the privacy boundary and restricts existing error
events. It does not enable MCP tool-use statistics. Before enabling those
statistics, update this policy in the same revision and verify the full actual
persisted platform record as described in the
[deployment guide](../deployment.md#privacy-policy-and-operational-errors).
