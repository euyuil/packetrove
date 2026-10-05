# Voluntary agent feedback

## User story

As a person using Packetrove through an AI client, I want to send a small report
about a bug, confusing behavior, or missing feature when I choose to do so,
without automatically uploading my conversation or network inputs.

## Scope and authorization

The optional MCP support operation `submit-feedback` is disabled by default.
Enabled installations advertise it in `tools/list`. Product tools keep their
website/API/MCP parity; support operations are classified separately in the
[shared catalog](../tool-catalog.md#support-operations). There is no feedback
website form, Web API endpoint, CLI command, automatic error telemetry, or
public issue creation.

Drafting means preparing arguments locally. A user-supplied or already approved
report can be sent directly on the user's request. Newly composed content must
first be shown for authorization. Neither a draft endpoint nor a confirmation
flag proves consent. The server cannot verify client consent; clients must
follow discovery instructions. Never solicit feedback after every call.

The strict schema and examples live in `packages/contracts/src/feedback.ts`,
with product names supplied by the catalog. The localized
[MCP guide](../integrations/mcp.md#optional-agent-feedback) describes fields and
limits. Unknown fields are rejected without echoing names or contents. Report
text is stored as supplied, without silent rewriting. Callers must remove
private data and use synthetic examples; allowed prose can still contain secrets.

## Acceptance and delivery

An atomic D1 transaction accepts the report and quota event together. Success
returns `status: accepted` and `receipt_id`, meaning private storage succeeded,
without promising a reply or fix. Known rejection has `delivery: not_accepted`.

The operation is non-idempotent: no submission key, fingerprint, deduplication
table, or automatic retry. Cancellation after commit cannot convert success
to ordinary failure. A lost acknowledgement can be recovered by a positive
primary receipt lookup; otherwise return `DELIVERY_UNCERTAIN` with
`delivery: unknown`. Absence alone cannot prove a write will not commit. Clients
must not automatically resend after timeout, disconnect, cancellation, or
uncertain delivery.

## Quota and storage

- Each canonical observed exit IP can receive ten successful acceptances in
  the preceding 24 hours, using database UTC milliseconds. Shared hosted clients
  share quota; an exit IP is not agent identity. Trusted Cloudflare metadata and
  existing Pseudo IPv4 resolution are required. Equivalent IPv6 spellings use
  the same complete-address quota.
- At most 100 reports are accepted per UTC day and 1,000 reports stored,
  including overdue bodies until cleanup. Each serialized report is at most
  8 KiB; the body bound is 7.8125 MiB, excluding indexes, metadata, and backups.
- Reports contain approved fields, receipt, public service version, and times.
  Separate quota events contain only HMAC-derived IP markers and acceptance
  times, without report identifiers or foreign keys. Raw IPs and markers never
  appear in reports or application logs. Each environment uses an independent
  fixed secret; routine rotation must not reset the window.
- Reports expire after 90 days and quota events after 24 hours. Admission and
  hourly scheduled cleanup remove overdue rows even when submissions are off.
  Rejected calls create no marker buckets. Deletion does not refund quota.
- Maintainers triage and delete privately by receipt. There is no public read
  or delete operation. Requests use the existing support email. The policy
  discloses up to 30 additional days of D1 backup retention. Do not create
  additional exports/backups or restore this database; recovery starts empty.

The public policy is maintained in localized translation resources and reused
in the MCP guide. Setup and controlled activation are maintained in the
[deployment guide](../deployment.md#optional-agent-feedback).

## Acceptance checks

- Modern and legacy discovery retains strict schemas and annotations:
  `readOnlyHint: false`, `destructiveHint: true`, `idempotentHint: false`, and
  `openWorldHint: false`. Support success has no browser resource link.
- Invalid categories, unknown fields, category requirements, Unicode limits,
  and byte limits reject without writing or echoing payloads.
- Concurrent IP/global admission, rolling expiry, deletion without refunds,
  canonical IPv6, and Pseudo IPv4 resolution preserve the agreed quotas.
- Rollback, unavailable configuration, cancellation before/after commit, and
  lost acknowledgements retain correct delivery semantics. Product tools remain
  independent of feedback failures. Logger failures preserve responses.
- Cleanup does not read or log report bodies or markers. Every locale renders
  complete privacy/support/MCP guidance without submitting examples.
- Routine smoke checks only discovery, schemas, annotations, and invalid
  synthetic input. Activation and writing-path changes require one controlled
  public synthetic acceptance, private inspection, and test-record cleanup.
  There is no public test mode.

SDK tests establish server behavior, not whether an AI client obeys consent
instructions. Published OpenAI plugins need the separate
[review procedure](../integrations/openai-plugin.md#optional-feedback-and-hosted-tool-review).
