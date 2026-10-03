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
`outcome: error`, and a controlled `error_code` only on error. Retries count as
separate executions. Initialization, discovery, unknown tool names, and input
rejections before the callback do not count. Local calculator inputs still
reach shared-core validation and therefore count as errors when invalid.
Cancellation after callback entry can also count as an error with
`INTERNAL_ERROR` under the existing response contract.

Success describes the callback outcome before SDK output validation and
response delivery. This is a count of recorded executions, not unique people,
all attempted requests, successful deliveries, or a complete audit record.
Quota exhaustion, sampling, runtime termination, and logging failures may
omit records. Logging failure must preserve the original tool response.

Application statistics must not receive or emit inputs, outputs, lookup
addresses, arbitrary headers, exception objects, request identifiers, raw
messages, or duration fields. Cloudflare may independently attach platform
metadata to its complete persisted record. All localized policy pages, MCP
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

Support emails include the sender's address, any supplied name, and message.
The individual maintainer uses these details to reply and follow up. Per the
owner's confirmed practice, correspondence is generally retained long term
without a fixed expiry, and users may contact the maintainer to request deletion.
This correspondence policy does not extend retention of remote tool inputs or
create an account-linked call history. GitHub issue history follows GitHub's
separate retention controls.

## Support and hosted-service terms

The localized `/support` page directs private support, privacy requests, and
security reports to the individual maintainer at `hello@packetrove.com`.
Public bug reports and feature requests use the existing GitHub issue templates.
Support instructions request reproducible synthetic examples, interface and client
details, expected and actual behavior, and controlled error codes; they warn
against sending credentials, real public-IP results, or private network data.
There is no contact form, automatic email send, or additional telemetry. Support
is provided as time permits, without a promised response time.

The localized `/terms` page covers the hosted website, Web API, and remote MCP
service. It explains lawful authorized use, documented limits, result review,
the public-IP connection boundary, availability, responsibility subject to
non-excludable legal rights, and future revisions. The terms do not replace the
MIT License for source code and the CLI or third-party license notices.

Keep both pages in the shared footer, with support under Contact & Feedback and
terms under Project Resources. Do not add them to browser-tool navigation.
Preserve same-language cross-links between support, privacy, and terms, including
mobile current-page labels. The original translated page text is authoritative;
documentation should describe its behavior rather than duplicate the policy.

The plugin source manifest includes the canonical HTTPS policy and support URLs.
Check all three pages after deployment before uploading the plugin; an offline
manifest check does not establish public availability or directory readiness.

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
- Deferred execution produces no completion event until it settles; concurrent
  tools, outcomes, and connections remain isolated.
- Discovery and pre-callback rejections produce no tool execution events.
- Logging exceptions preserve successful and failed MCP responses.
- Production smoke checks verify policy content and footer entry points.
- Support and terms pages render complete text in every locale, publish canonical
  and alternate links and sitemap entries, and open from the footer without tool
  requests. Preserve calculator drafts when navigating to and from these pages.
- Support links use the confirmed email and existing GitHub templates. Privacy
  and terms cross-links remain in the current locale.
- Directory listing URLs are considered available only after deployment and
  public-page verification. No directory submission is performed by this change.

Confirm the actual Workers subscription before enabling production statistics,
and inspect full persisted events after deployment as described in the
[deployment guide](../deployment.md#mcp-tool-execution-counts). A local logger
assertion does not establish the platform log envelope or directory readiness.
