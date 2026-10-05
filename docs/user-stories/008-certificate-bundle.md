# PEM certificate bundle diagnostics

As a developer preparing a certificate bundle, I want to inspect its contents,
candidate issuers, and specific problems so I can decide what to investigate or
replace before testing the deployment with the intended clients.

The canonical tool is `certificate-bundle`: website `/certificate-bundle`,
`POST /v1/certificate-bundle`, and MCP `certificate-bundle`. It is available in
all ten website languages. The CLI does not implement this operation.

## Input and privacy boundary

The request is a strict object containing `pem`, an optional `hostname`, and an
optional zero-based `leafIndex`. It accepts 1–16 PEM `CERTIFICATE` blocks and
whitespace only, within 48 KiB of UTF-8 input. The API additionally enforces
its shared 64 KiB JSON-body limit. Empty input, private keys, other PEM types,
malformed boundaries, noncanonical Base64, malformed DER certificates, and
trailing material reject the whole request without partial results. Error
messages do not echo submitted text. Located PEM errors carry the original
one-based line and UTF-16 `offset` / `end`, allowing the browser to select the
relevant input. Invalid hostname and leaf selection errors identify their field.
The PEM parser requires definite, minimal DER lengths with bounded depth and
node count; it does not claim a complete DER conformance audit.

The website starts with blank input and performs checks only after an explicit
action. It uses the shared implementation and Web Crypto in the browser. It
does not upload, log, put inputs in URLs, or save inputs/results in browser
storage. Drafts remain in the current application instance across tool and
language navigation; reload starts fresh. Editing inputs clears previous
results, and edits, newer checks, and navigation cancel outstanding work.
No certificate or issuer lookup is made to display examples or run a check.

Users can paste PEM text, choose a local file, or drop one file into the PEM
input area. File selection and drag-and-drop read bytes in the browser, without
an upload or API call. The picker suggests `.pem`, `.crt`, `.cer`, and plain-text
files; the actual content must satisfy the same PEM certificate rules as pasted
text. One UTF-8 text file can contain the entire bundle. File import checks the
48 KiB byte limit before reading and rejects invalid UTF-8 without replacing
the current input or completed report. Read failures and multiple-file drops
also preserve the current draft and display localized, non-echoing errors.
Binary DER and PKCS#12 are outside this input format.

A successful import replaces the PEM text, preserves the optional hostname,
clears stale results and errors, and leaves the content editable. A UTF-8
byte-order mark is removed, and line endings are normalized to the textarea's
LF representation so located errors continue to select the correct text. It
does not run a check. The same primary action validates the imported content, including
rejecting private keys and other PEM blocks. Editing, clearing, loading an
example, choosing another file, checking, or leaving the tool cancels pending
reads so they cannot overwrite newer work. File selection resets after every
choice, allowing the same file to be imported again.

API and remote MCP calls send certificates and any expected hostname to the
server. This boundary is disclosed on the tool, API/MCP guides, and Privacy
Policy. The application does not persist these values or include them in logs.
API success and error responses, and all MCP responses, use `no-store`.
Operational logs contain controlled status metadata rather than request text,
results, or exception payloads. Hosting-provider processing is described in the
[service privacy story](007-service-privacy.md).

## Website workflow and report layout

The page follows the task sequence in one column: supply a bundle, explicitly
check it, and read a full-width report below the input. The PEM field is the
first input control, followed by the byte count, file import action, and optional
hostname. Brief workflow guidance stays with the input, including how edits clear
old results. The input area has a bounded height so long PEM bundles do not
dominate the page.
The single primary action is **Check certificate bundle**. **Clear** and
**Try an example** are secondary actions with visible button borders.

All ten public synthetic scenarios remain available in a dialog opened by
**Try an example** at the bottom of the input area. Opening or dismissing this
dialog preserves the current input and completed report. Choosing a scenario
fills the PEM and hostname, clears stale results and errors, cancels an
outstanding check, and closes the dialog. It never starts a check; users can
review or edit the example before using the primary action. The dialog has a
localized close control and returns keyboard focus to its opener.

A report appears only during or after a check. Its summary, evaluation time,
required leaf selection, hostname outcome, findings, and next actions come
first. Findings retain visible severity and original certificate positions;
their machine-readable codes and supporting evidence expand on request.
The relationship graph and numbered candidate table follow in their own
full-width section. The graph has a bounded display width rather than growing
with the entire desktop page. On narrow screens, a keyboard-focusable horizontal
scroll region preserves readable diagram labels without widening the page;
the diagram starts centered and includes localized scrolling guidance.
Individual certificate details and structured
JSON start collapsed. Editing inputs removes the old report. A stable live
status announces progress and completion, and existing error-focus and
off-screen-result feedback remain in use.

This design applies the [GOV.UK primary and secondary button guidance](https://design-system.service.gov.uk/components/button/)
and [Nielsen Norman Group's progressive disclosure guidance](https://www.nngroup.com/articles/progressive-disclosure/):
keep the primary task obvious and expose secondary material on request.
Following the [GOV.UK details guidance](https://design-system.service.gov.uk/components/details/),
findings and next actions stay visible rather than being hidden with their
supporting evidence. The input-above-report layout is a choice for this tool's
unequal input and output lengths, not a requirement imposed on other tools.

## Observations and interpretation

Results include `evaluatedAt`, certificate summaries in original order, candidate
relationships, unique non-CA leaf positions, selected leaf position, optional
hostname outcome, and structured findings. Original indices start at zero in
JSON. The website displays those same positions as `#1`, `#2`, and so on.
Summaries include original line, subject, issuer, display-only Common Name,
SANs, serial number, validity interval, CA and Key Usage metadata, signature
algorithm, SHA-256 fingerprint, and any self-signature check.

The rounded rectangle graph displays `#number Common Name`, with a localized
fallback when CN is absent. It retains duplicate positions. Arrows point from
a certificate to each candidate issuer. Solid arrows require a verified
signature, local issuer eligibility, and no observed key-identifier mismatch.
Other arrows are dashed. The candidate table uses only positions, for example
`#1 → #2`, and separates signature results from issuer constraints. Self-signature
checks appear in details. The graph represents candidate relationships, not a
chosen or trusted chain.

Issuer candidates require byte-identical encoded issuer and subject names.
This conservative comparison can miss equivalent names encoded differently;
unresolved candidates require investigation with another implementation.
Matching names alone do not verify a relationship. Each candidate has its own
cryptographic signature result (`verified`, `failed`, `unsupported`, or
`unavailable`), CA / `keyCertSign` eligibility, and optional AKI/SKI comparison.
Missing Key Usage is recorded as absent; a present extension must allow
`keyCertSign`. A failed same-name candidate produces a warning about that link
and does not invalidate another verified candidate. Unsupported algorithms
and interrupted checks remain incomplete rather than being labelled failures.

Identical fingerprints identify duplicates while preserving every original
position. Duplicate copies do not introduce artificial issuer or leaf choices.
Cross-signed alternatives and multiple eligible issuers remain visible without
an arbitrary path selection. Equal Subject and Issuer names do not require a
self-signature. When another supplied certificate passes signature and local
issuer checks, a failed or incomplete own-key test produces
`SELF_ISSUED_CERTIFICATE` information. This includes CA key rollover with the
same or a different public-key algorithm. The raw `selfSignature` result still
records the own-key test. When there is no such verified issuer,
`SELF_SIGNATURE_FAILED` remains a warning;
unsupported and unavailable own-key tests retain their separate warning codes.

Validity uses the runtime clock, with inclusive `notBefore` / `notAfter`
boundaries, independently of signature checks. Each finding has a stable
`code`, `severity`, original `certificateIndexes`, an `observed` statement,
structured `evidence`, and a bounded `nextAction`. The website localizes titles
and next steps from the same finding codes and displays their evidence. It does
not present a single global safe/trusted status.

The three severity levels have the same meanings in the website, Web API, and
MCP. Errors identify confirmed issues with the listed certificates or the
selected leaf's supplied issuer candidates. Warnings identify candidate issues
or incomplete requested checks. Information records structural or successful
observations. The website explains these meanings beside the findings.
Expired and not-yet-valid certificates remain errors at their original positions;
one expired alternative does not invalidate every other path. Trust-anchor
time requirements depend on the client. RFC 5280 excludes the trust anchor from
the prospective path, while OpenSSL additionally checks root validity.
See [RFC 5280 section 6.1](https://www.rfc-editor.org/rfc/rfc5280.html#section-6.1)
and [OpenSSL verification rules](https://docs.openssl.org/3.5/man1/openssl-verification-options/#certification-path-validation).

The selected leaf is evaluated separately from other supplied certificates:

- With no same-name issuer candidate, `LEAF_ISSUER_NOT_IN_BUNDLE` is a warning
  because its signature cannot be verified in this input. An absent issuer for
  another certificate remains `ISSUER_NOT_IN_BUNDLE` information. A missing
  issuer alone does not establish client rejection, identify a missing root,
  or account for certificates that clients already possess.
- With at least one candidate and every candidate rejected by a failed signature
  or the CA / Key Usage requirements, `LEAF_ISSUER_CANDIDATES_REJECTED` is an
  error. It lists the selected original leaf position, candidate positions, and
  counts for candidates, failed signatures, and rejected issuer constraints.
  These latter counts can overlap. Individual candidate warnings remain visible.
- A viable alternative prevents this error. An eligible candidate with an
  unsupported or unavailable signature also prevents it. Key-identifier
  mismatch alone does not produce it. A selected self-signed leaf with a verified
  own-key signature does not require an external candidate to pass. An unsupported
  or unavailable own-key test also prevents the error, because a possible
  self-signature remains unknown. A failed own-key test does not prevent it.
  Candidate counts refer only to the supplied issuer relationships.
- No selected leaf means no selected-leaf error. An explicit duplicate selection
  uses the first occurrence's candidate links, but the selected-leaf finding
  retains the user's selected original position.

These observations cover only the supplied candidates. They do not select a
trust path or determine client acceptance.

## Optional DNS identity check

Only the chosen non-CA leaf's DNS SANs participate. One unique non-CA certificate
is selected automatically. With multiple leaves, the website offers an explicit
selection and the API/MCP accept `leafIndex`; a hostname remains `ambiguous`
until selected. A CA-only bundle has `no-leaf`. `LEAF_SELECTION_REQUIRED` and
`NO_LEAF_CERTIFICATE` are warnings when a hostname was requested, and information
when no hostname was requested. Leaf selection also controls issuer diagnostics,
even without a hostname. Selection must identify a
non-CA certificate in the original input. An explicit duplicate selection retains
its requested original position; automatically discovered leaves use first copies.

This is a documented ASCII DNS subset of
[RFC 9525](https://www.rfc-editor.org/rfc/rfc9525.html): ASCII case is ignored,
a final dot is normalized on the expected hostname, and a complete leftmost
wildcard matches exactly one label. SAN partial wildcards do not match.
URLs, ports, IP addresses, wildcard inputs, and Unicode expected hostnames are
rejected; callers must convert internationalized DNS names to A-labels first.
CN is displayed but never used as an identity fallback. IP-ID, URI-ID, SRV-ID,
and complete RFC 9525 conformance are outside this subset.

## Scope and evidence

These checks do not implement full RFC 5280 path validation, path-length or
name-constraint enforcement, policy processing, EKU-based TLS authorization,
critical-extension handling, a client trust store, revocation, live probing,
AIA retrieval, deployment validation, or automatic bundle repair. A verified
signature, matching DNS SAN, or informational missing root does not establish
client acceptance or deployment safety. The user must test the intended trust
configuration and clients separately. Algorithm availability depends on the
runtime; unsupported verification is explicitly reported.

Public synthetic certificates live in
`packages/contracts/src/certificate-fixtures.json`. No private key is written
to a fixture or tracked file. Normal, omitted-root, missing-intermediate,
expired, future, hostname-mismatch, multiple-leaf, cross-signing/unordered,
failed same-name candidate, and duplicate samples drive the website and tests.
Additional public fixtures cover self-issued CA key rollover with the same or
different public-key algorithms, a verified signature with mismatched key
identifiers, and a self-signed non-CA leaf.
`CERTIFICATE_BUNDLE_DIAGNOSTIC_SAMPLES` supplies additional public inputs to
deployment checks without expanding the optional website example picker.
RSA SHA-256 and ECDSA P-256 SHA-256 signatures are exercised in Node, Workers,
and browser validation; this is not an exhaustive algorithm compatibility matrix.
Documentation observations use `2026-10-04T06:00:00.000Z`; real requests cannot
choose a historical evaluation time and always use the current runtime clock.

To regenerate public fixtures and their fixed-clock documentation observations:

```sh
pnpm exec tsx packages/core/scripts/generate-certificate-fixtures.ts
pnpm exec tsx packages/core/scripts/generate-certificate-examples.ts
pnpm spec:generate
pnpm docs:mcp:generate
```

Fixture regeneration changes certificate keys and fingerprints. Review and
commit the fixtures and generated examples together. Private keys remain in
generator process memory.

## Acceptance checks

- Shared core tests independently verify representative signatures and
  fingerprints with Node's certificate implementation. They cover original
  order, duplicate and alternative paths, issuer eligibility, absent issuers,
  validity boundaries, hostname selection, DNS matching, and incomplete checks.
  Severity cases include blocked hostname checks, absent selected-leaf issuers,
  all rejected candidates, viable and unknown alternatives, key-identifier-only
  mismatch, verified and incomplete self-signatures, key and algorithm rollover,
  and duplicate selections.
- Strict contracts and input tests cover exact byte/count limits, malformed
  PEM/DER, private keys after valid blocks, error locations, unknown keys,
  caller-controlled abort reasons, and no partial output or network requests.
- Workers tests compare all ten scenarios with the browser's shared checker at
  the reported runtime time, through API and current/legacy MCP clients. They
  verify discovery, structured errors, no-store responses, and safe logging.
- Website tests cover local file selection and drops without uploads or automatic
  checks, repeat selection, the exact file byte limit, UTF-8/BOM/line endings,
  read failures, preserved drafts, canceled obsolete reads, blank startup,
  optional example loading without automatic checks, preservation when browsing
  examples, the report's reading order and
  progressive evidence/details disclosure, local crypto, graph CN labels and numbered
  table rows, selected input errors, explicit leaf choice, navigation and locale
  retention, reload clearing, and cancellation of obsolete checks.
- Catalog checks, ten-locale validation/prerendering, deferred bundle checks,
  generated OpenAPI/MCP documentation, and production smoke checks include the
  new operation. Smoke checks use only public fixtures and reproduce validity
  at the returned current time.
