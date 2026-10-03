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

## MCP execution counts

Each registered tool callback emits one `mcp_tool_execution` event after its
awaited execution finishes and the callback prepares a success or error result.
The event includes the trusted catalog tool identifier, `outcome: success` or
`outcome: error`, a controlled `error_code` only on error, and `traffic_source`.
The source is `automated_check` only when the current call's dedicated token
matches the configured Worker secret; otherwise it is `public_call`. Verified
checks may include `automation_run_id`, restricted to a positive decimal string
of at most 20 digits. This checks the identifier's format, not a GitHub run's
existence. Missing or invalid credentials and identifiers must not reject calls
or change tool results. No automation credential is required for public use.
Missing or malformed Worker configuration leaves calls classified as public.
Retries count as separate executions. Initialization, discovery, unknown tool names, and input
rejections before the callback do not count. Local calculator inputs still
reach shared-core validation and therefore count as errors when invalid.
Cancellation after callback entry can also count as an error with
`INTERNAL_ERROR` under the existing response contract.

Success describes the callback outcome before SDK output validation and
response delivery. This is a count of recorded executions, not unique people,
all attempted requests, successful deliveries, or a complete audit record.
Quota exhaustion, sampling, runtime termination, and logging failures may
omit records. Logging failure must preserve the original tool response.

Application events must not emit inputs, outputs, lookup addresses, raw request
headers, automation tokens, exception objects, request identifiers, raw messages,
or duration fields. The logger receives only the derived source and, for verified
checks, the validated run identifier; it never receives the authentication token
or complete request headers. Verification reads each call's request separately,
without retaining initialization metadata or sharing client state. Cloudflare
may independently attach platform metadata to its complete persisted record.
All localized policy pages, MCP
guide summaries, and tool discovery descriptions disclose these events in
the same revision that enables them.

## Providers and user choices

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
- Current and legacy MCP clients record each successful or failed callback
  once, including retries, and retain their existing results and errors.
- Both clients classify matching tokens as automated checks and missing,
  mismatched, or malformed tokens as public calls without changing results.
- Run identifiers appear only for verified checks with valid identifier formats.
- Changing headers between initialization and calls changes only that call's
  source, and concurrent clients retain independent source and run metadata.
- Automated smoke requests carry their credential only to the exact MCP
  endpoint, preserve protocol headers and bodies, and never follow redirects.
- GitHub Actions requires a correctly formatted dedicated secret before
  production deployment. Manual smoke checks remain usable without it.
- Deferred execution produces no completion event until it settles; concurrent
  tools, outcomes, and connections remain isolated.
- Discovery and pre-callback rejections produce no tool execution events.
- Logging exceptions preserve successful and failed MCP responses.
- Production smoke checks verify policy content and footer entry points.
- Directory listing URLs are considered available only after deployment and
  public-page verification. No directory submission is performed by this change.

Confirm the actual Workers subscription before enabling production statistics,
and inspect full persisted events after deployment as described in the
[deployment guide](../deployment.md#mcp-tool-execution-counts). A local logger
assertion does not establish the platform log envelope or directory readiness.
