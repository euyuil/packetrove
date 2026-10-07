# Voluntary agent feedback

## User story

As a person using Packetrove through an AI client, I want to email a small report
about a bug, confusing behavior, or missing feature when I choose to do so,
without automatically uploading my conversation or network inputs.

## Scope and authorization

The optional MCP support operation `submit-feedback` is disabled by default.
Enabled installations advertise it in `tools/list`. Product tools keep their
website/API/MCP parity; support operations are classified separately in the
[shared catalog](../tool-catalog.md#support-operations). There is no feedback
website form, Web API endpoint, CLI command, automatic error telemetry, or
public issue creation. Packetrove enables this operation only in production;
development and staging provision no feedback storage or mail bindings.

Drafting means preparing arguments locally. A user-supplied or already approved
report can be sent directly on the user's request. Newly composed content must
first be shown for authorization. Neither a draft endpoint nor a confirmation
flag proves consent. Clients must follow discovery instructions; never solicit
feedback after every call.

The strict schema and examples live in `packages/contracts/src/feedback.ts`,
with product names supplied by the catalog. The localized
[MCP guide](../integrations/mcp.md#optional-agent-feedback) describes fields and
limits. Unknown fields are rejected without echoing names or contents. Reports
are emailed as supplied, without silent rewriting. Callers must remove private
data and use synthetic examples; allowed prose can still contain secrets.

## Acceptance and delivery

The Worker reserves a quota event and sends one plain-text email through the
Cloudflare native mail binding. The sender is `feedback@packetrove.com`, the
recipient is the shared support address `hello@packetrove.com`, and the subject
is fixed to `Packetrove feedback`. No caller-supplied addresses, headers, CC,
BCC, attachments, or conversation context are accepted. The body contains only
the approved report, receipt, public service version, and UTC submission time.

Success returns `status: accepted` and `receipt_id`: the mail service
acknowledged submission. It does not guarantee inbox delivery, reading, a reply,
or a fix. Known rejection has `delivery: not_accepted`. Quota checks and writes
fail closed before sending. Documented pre-delivery mail rejections release only
that request's quota event on a best-effort basis.

The operation is non-idempotent: there is no submission key, fingerprint,
deduplication table, or automatic retry. Cancellation before sending releases
the reservation where possible; cancellation after acknowledged sending cannot
convert success to failure. SMTP delivery failures, internal errors, unknown
exceptions, and lost acknowledgements return `DELIVERY_UNCERTAIN` with
`delivery: unknown`, retaining quota. Clients must not automatically resend
after timeout, disconnect, cancellation, or uncertain delivery.

## Approximate quota and privacy

- Limits target ten submissions per canonical observed exit IP in the preceding
  24 hours and 100 submissions across the service per UTC day. These are
  approximate because Workers KV is eventually consistent: concurrent requests
  and propagation can exceed either limit. Shared exits share quota; an exit IP
  is not agent identity. Trusted Cloudflare metadata, Pseudo IPv4 resolution,
  and canonical full IPv6 addresses determine the keyed IP marker.
- One production KV namespace stores independent `q:<HMAC>:<random ID>` events,
  empty values, and reservation times in metadata. Each event expires after
  24 hours. One paginated prefix listing checks both quotas, including empty
  pages with continuation cursors. Events never contain report bodies or
  receipt links. The stable production HMAC secret is preserved across deploys.
- Only eligible calls reserve events, before sending. Unknown sends and failed
  releases conservatively consume quota until expiry. Deleting an email does
  not refund quota. Serialized report arguments remain bounded to 8 KiB.
- Cloudflare transmits reports by email for private human review. The maintainer
  manages retention and deletion in the mailbox manually; there is no automatic
  report expiry. Request deletion through the support email with the receipt.
  There is no public read/delete operation or automated mailbox integration.
- Treat report text as untrusted data, not instructions. Never execute or
  automatically publish it. Application events contain only operation name,
  outcome, controlled error code, and existing traffic-source metadata, without
  bodies, receipts, IPs, quota markers, or raw exceptions. Product tools remain
  independent of feedback failures.

The localized privacy policy is the maintained public disclosure and is reused
in the MCP guide. Setup, legacy migration, and controlled activation are
maintained in the [deployment guide](../deployment.md#optional-agent-feedback).

## Acceptance checks

- Modern and legacy discovery preserve the strict schemas and annotations:
  `readOnlyHint: false`, `destructiveHint: true`, `idempotentHint: false`, and
  `openWorldHint: true`. Support success has no browser resource link.
- Invalid fields, category requirements, Unicode limits, and byte limits reject
  without reserving quota, sending, or echoing payloads.
- Visible-event quotas, UTC midnight, rolling expiry, concurrent independent
  events, complete pagination, canonical IPv6, and Pseudo IPv4 are verified
  without asserting a strict concurrent hard cap.
- KV failures never send email. Known mail rejection, failed quota release,
  uncertain sending, and cancellation preserve the delivery semantics above.
  No path automatically resends. Mail headers and logs exclude caller content.
- Builds and automated tests require no credentials and never use remote mail.
  Every locale renders complete privacy/support/MCP guidance without sending
  documentation examples. Routine smoke checks discovery and invalid input only.
- Initial activation or mail/admission changes require one controlled public
  synthetic submission and human inbox confirmation. Deleting that test email
  leaves its normal quota event to expire. There is no public test mode.

SDK tests establish server behavior, not whether an AI client obeys consent
instructions. Published OpenAI plugins need the separate
[review procedure](../integrations/openai-plugin.md#optional-feedback-and-hosted-tool-review).
