# Certificate bundle checker: local demo

A browser-local prototype for [Issue #142](https://github.com/euyuil/packetrove/issues/142).
Paste a PEM bundle and optionally an ASCII DNS hostname to inspect certificates,
candidate issuer relationships, and evidence-based next steps. The interface
uses Chinese prototype copy and the existing Packetrove Mantine theme.

## Run locally

From the repository root, install dependencies using the normal contributor
setup, then run:

```sh
pnpm dev:certificate-demo
```

Open <http://127.0.0.1:4174/>. The server binds only to the local loopback address
and fails rather than taking another port if 4174 is occupied. Stop its terminal
session with Ctrl+C when finished. The demo is a separate workspace application;
the production website build and deployment do not include it.

The initial synthetic example is checked automatically. Ten examples cover a
normal bundle, an omitted root, a missing intermediate, expiry, a future start
date, hostname mismatch, multiple leaves, cross-signing with unordered input,
an invalid same-name issuer candidate, and duplicate certificates.

## Checks and boundaries

- Input accepts only complete `CERTIFICATE` blocks and surrounding whitespace.
  Empty, malformed, unsupported, and private-key material is rejected with
  original-input locations. No partial result is returned.
- Limits are 48 KiB of UTF-8 PEM input and 16 certificate blocks. The prototype
  keeps every original position, including duplicates; cryptographic relationships
  and automatic leaf selection use unique certificate fingerprints.
- Results include Subject, Issuer, SANs, validity, CA and Key Usage constraints,
  signature algorithm, serial number, SHA-256 fingerprint, and evaluation time.
- Candidate names use exact encoded distinguished-name comparison. Semantically
  equivalent names encoded differently may remain unresolved. Each candidate's
  signature, CA constraints, Key Usage, and available AKI/SKI identifiers are
  checked separately. A failed candidate does not invalidate another candidate.
- Matching Subject and Issuer alone does not establish a self-signature. Signature
  verification uses Web Crypto through `@peculiar/x509`; unsupported algorithms
  and incomplete checks are distinguished from signature failures. The committed
  synthetic examples use ECDSA P-256/SHA-256; this is not a complete algorithm
  compatibility matrix.
- DNS matching follows the SAN-only and complete-leftmost-wildcard rules in
  [RFC 9525](https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3). Wildcards
  match exactly one label. ASCII case and a single trailing dot are normalized.
  IP identifiers, Unicode domain conversion, Common Name fallback, and public
  suffix policy checks are outside this prototype.
- Multiple non-CA certificates require an explicit leaf selection for hostname
  checks. Displayed positions are one-based; structured result indices are zero-based.
- Input changes clear results and invalidate in-flight work. Certificate input and
  results stay in page memory. The checker performs no network calls, storage
  writes, input/result logging, or URL changes. Browser-served development assets
  and Vite's hot-reload connection are distinct from certificate processing.
- These are local structural checks, not complete RFC 5280 path validation,
  trust-store validation, revocation checking, endpoint probing, or deployment
  verification. Extended Key Usage, path-length constraints, Name Constraints,
  certificate policies, and unknown critical-extension handling are not validated.
  The graph displays all candidate edges and does not enumerate or select complete
  trust paths. A root omitted from the input is not automatically an error.

The prototype has no Web API, MCP tool, CLI command, public catalog entry, or
production navigation. Issue #142 remains an incomplete product feature until
the shared-contract interfaces, full localization, documentation, and acceptance
coverage are delivered together.

## Validation and fixtures

```sh
pnpm --filter @packetrove/certificate-demo test
pnpm --filter @packetrove/certificate-demo typecheck
pnpm --filter @packetrove/certificate-demo build
pnpm check
```

The demo tests are included in the repository's full check. Tests use a fixed
evaluation time, compare synthetic signatures and fingerprints against Node.js's
independent X.509 implementation, and exercise asynchronous stale-result handling.

Manual Chromium verification on 2026-10-04 covered the initial bundle, ambiguous
leaf selection and explicit selection, invalidation after hostname edits,
private-key rejection and source selection, and a 390-pixel viewport without
horizontal overflow. DevTools observed no new network requests during certificate
checks and no application console warnings or errors in these interactions.

Regenerate public synthetic fixtures with:

```sh
pnpm --filter @packetrove/certificate-demo fixtures:generate
```

Generation keeps private signing keys in process memory and writes only public
certificates with neutral example names. New keys change certificate fingerprints
on each regeneration. Do not substitute real user certificates into these fixtures.

`@peculiar/x509` is MIT-licensed; its required `reflect-metadata` runtime is
Apache-2.0-licensed. The build preserves licenses and copyright notices for the
certificate runtime and its resolved dependency tree in `dist/THIRD_PARTY_NOTICES.txt`.
