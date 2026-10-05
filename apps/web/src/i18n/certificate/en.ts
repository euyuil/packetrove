export const certificateCopy = {
  "certificate": {
    "title": "Certificate Bundle Checker",
    "description": "Inspect a PEM certificate bundle, candidate issuer links, and evidence-based next steps.",
    "local": "Checked in your browser · Certificates and results remain in page memory",
    "scopeTitle": "Check scope",
    "scope": "Checks parsing, duplicates, validity, candidate signatures, CA and keyCertSign constraints, and an optional DNS hostname. Does not validate full RFC 5280 paths, client trust, revocation, or deployment safety.",
    "inputs": "Certificate input",
    "samplesLabel": "Synthetic certificate examples",
    "loadSample": "Try an example",
    "samplesHelp": "Choose a public synthetic bundle to fill the inputs. Then use Check certificate bundle to run the check.",
    "closeExamples": "Close examples",
    "evidenceTitle": "Evidence",
    "pem": "PEM certificates",
    "pemHelp": "Only CERTIFICATE blocks and whitespace; up to {{maximum}} certificates and {{kib}} KiB. Private keys are rejected.",
    "bytes": "{{current}} / {{maximum}} bytes",
    "hostname": "Expected hostname (optional)",
    "hostnameHelp": "ASCII DNS names only. Checks the selected leaf’s DNS SAN; no Common Name fallback.",
    "check": "Check certificate bundle",
    "result": "Check results",
    "completed": "Check complete. Certificates: {{certificates}}. Findings: {{findings}}.",
    "certificates": "Certificates",
    "verifiedLinks": "Verified signatures",
    "findingCount": "Findings",
    "evaluation": "Evaluation time: {{time}} (device clock)",
    "selectLeaf": "Leaf for hostname checking",
    "selectPosition": "Select an original position",
    "hostnameTitle": "Hostname: {{hostname}}",
    "relationships": "Issuer relationships",
    "candidate": "Candidate link",
    "constraints": "Issuer constraints",
    "constraintsFailed": "CA / Key Usage rejected",
    "keyIdFailed": "Key identifiers differ",
    "constraintsPassed": "Local constraints passed",
    "findingsTitle": "Findings and next steps",
    "checking": "Parsing and verifying locally…",
    "pending": "Enter certificates and run a check. Editing input clears the previous result.",
    "details": "Certificate details · Original order",
    "explanationTitle": "Understand these checks",
    "explanation": "Numbers show original input positions; JSON indices start at zero. Duplicate positions remain visible. Candidate names use conservative encoded comparison. An absent issuer is informational, and a failed candidate does not invalidate other links. Drafts stay in page memory across tool and language navigation; reloading clears them.",
    "dnsRules": "DNS SAN matching ignores ASCII case and a final hostname dot. A complete leftmost wildcard matches exactly one label. URLs, IP addresses, ports, wildcard inputs, and Unicode hostnames are rejected; convert internationalized names to punycode first. Common Name is displayed only, not used for identity checks.",
    "examplesTitle": "Synthetic examples",
    "exampleNote": "Public synthetic certificates. Documentation evaluation time: {{time}}. Your check uses the current runtime clock.",
    "graphLabel": "Certificate issuer graph; arrows point from a certificate to a candidate issuer. Original positions are listed below.",
    "graphHelp": "Certificate → candidate issuer. Solid arrows pass signature and local issuer checks; dashed arrows fail or remain incomplete. Self-signature results appear in details.",
    "noCommonName": "No CN",
    "ca": "CA certificate",
    "nonCa": "Non-CA certificate",
    "nextAction": "Next action",
    "noFindings": "No findings. Check client trust and deployment separately.",
    "yes": "Yes",
    "no": "No",
    "notProvided": "Not provided",
    "originalPosition": "Original position",
    "position": "Certificate #{{number}}, beginning on line {{line}}",
    "serial": "Serial number",
    "selfSignature": "Self-signature check",
    "json": "Structured result JSON",
    "inputLine": "Line {{line}}: {{message}}",
    "status": {
      "verified": "Verified",
      "failed": "Failed",
      "unsupported": "Unsupported",
      "unavailable": "Incomplete"
    },
    "severity": {
      "error": "Error",
      "warning": "Warning",
      "info": "Information"
    },
    "hostnameStatus": {
      "matched": "DNS SAN matches. Chain validity and client trust require separate checks.",
      "mismatched": "DNS SAN mismatch; inspect the finding evidence.",
      "ambiguous": "Select the intended leaf before checking this hostname.",
      "no-leaf": "No non-CA leaf is available for hostname checking."
    },
    "samples": {
      "normal": "Normal bundle",
      "omittedRoot": "Omitted root",
      "missingIntermediate": "Missing intermediate",
      "expired": "Expired certificate",
      "future": "Future certificate",
      "hostnameMismatch": "Hostname mismatch",
      "multipleLeaves": "Multiple leaves",
      "crossSigning": "Cross-signing and unordered input",
      "invalidCandidate": "Failed same-name candidate",
      "duplicate": "Duplicate certificate"
    },
    "errors": {
      "EMPTY_INPUT": "Paste at least one PEM certificate.",
      "INPUT_TOO_LARGE": "PEM exceeds the 48 KiB UTF-8 limit.",
      "INVALID_PEM": "Malformed PEM. Only CERTIFICATE blocks, complete Base64, and whitespace between blocks are accepted.",
      "PRIVATE_KEY_REJECTED": "Private-key block rejected. Remove it; submit certificates only.",
      "UNSUPPORTED_PEM_BLOCK": "Unsupported block. Only CERTIFICATE blocks are accepted.",
      "INVALID_CERTIFICATE": "This block is not a supported, well-formed DER X.509 certificate.",
      "TOO_MANY_CERTIFICATES": "Use at most 16 certificates. No partial result is returned.",
      "INVALID_HOSTNAME": "Use an ASCII DNS hostname without a URL, IP, port, or wildcard; convert Unicode names to punycode first.",
      "INVALID_LEAF_SELECTION": "Select an original position containing a non-CA certificate.",
      "CRYPTO_UNAVAILABLE": "Check could not be completed. Use a supported browser in a secure context or verify with another implementation.",
      "INVALID_INPUT": "Invalid request. Review the PEM, hostname, and original leaf position.",
      "INVALID_TIME": "The runtime evaluation time is invalid."
    },
    "graphScrollHelp": "On narrow screens, scroll the diagram horizontally to read every certificate.",
    "evidence": {
      "fingerprintSha256": "SHA-256 fingerprint",
      "evaluatedAt": "Evaluation time",
      "notAfter": "Not valid after",
      "notBefore": "Not valid before",
      "subject": "Subject",
      "issuer": "Issuer",
      "signature": "Signature",
      "algorithm": "Signature algorithm",
      "ca": "CA",
      "basicConstraintsPresent": "basicConstraints present",
      "keyCertSign": "keyCertSign",
      "authorityKeyIdentifier": "Authority Key Identifier",
      "subjectKeyIdentifier": "Subject Key Identifier",
      "candidateCount": "Candidates",
      "expectedHostname": "Expected hostname",
      "dnsSubjectAlternativeNames": "DNS SAN"
    },
    "findings": {
      "DUPLICATE_CERTIFICATE": {
        "title": "Repeated certificate at these positions",
        "action": "Remove repeated certificates if duplication is unintended."
      },
      "CERTIFICATE_EXPIRED": {
        "title": "Certificate expired at evaluation time",
        "action": "Renew or replace the certificate and check which certificate is actually served."
      },
      "CERTIFICATE_NOT_YET_VALID": {
        "title": "Certificate not yet valid at evaluation time",
        "action": "Check the device clock and certificate activation date."
      },
      "SELF_SIGNED_CERTIFICATE": {
        "title": "Signature verifies with its own public key",
        "action": "Check client trust and the actual deployment separately; this observation does not prove either."
      },
      "SELF_SIGNATURE_FAILED": {
        "title": "Self-issued certificate has a failed self-signature",
        "action": "Inspect these two certificate positions. Other candidate links are checked independently."
      },
      "SIGNATURE_UNSUPPORTED": {
        "title": "Signature algorithm is unsupported here",
        "action": "Use an implementation that supports this algorithm to verify the check. An incomplete or unsupported check is not a signature failure."
      },
      "SIGNATURE_CHECK_UNAVAILABLE": {
        "title": "Signature check could not be completed",
        "action": "Use an implementation that supports this algorithm to verify the check. An incomplete or unsupported check is not a signature failure."
      },
      "ISSUER_NOT_IN_BUNDLE": {
        "title": "No encoded issuer name found in this bundle",
        "action": "If the server actually serves this bundle, check its full-chain configuration. Roots are normally omitted; absence alone does not prove a broken chain."
      },
      "CANDIDATE_SIGNATURE_FAILED": {
        "title": "Candidate issuer signature failed",
        "action": "Inspect these two certificate positions. Other candidate links are checked independently."
      },
      "ISSUER_NOT_CA": {
        "title": "Candidate issuer does not assert CA=true",
        "action": "Confirm the intended issuing CA, Key Usage, and key identifiers; inspect alternative candidates."
      },
      "ISSUER_KEY_USAGE_REJECTED": {
        "title": "Candidate issuer lacks keyCertSign",
        "action": "Confirm the intended issuing CA, Key Usage, and key identifiers; inspect alternative candidates."
      },
      "ISSUER_KEY_ID_MISMATCH": {
        "title": "Authority and subject key identifiers differ",
        "action": "Confirm the intended issuing CA, Key Usage, and key identifiers; inspect alternative candidates."
      },
      "MULTIPLE_ISSUERS": {
        "title": "Multiple candidates pass local issuer checks",
        "action": "Inspect the candidate paths separately. This tool does not choose an authoritative trust path."
      },
      "LEAF_SELECTION_REQUIRED": {
        "title": "Multiple possible leaves require a selection",
        "action": "Supply or explicitly select the intended non-CA leaf before checking a hostname."
      },
      "NO_LEAF_CERTIFICATE": {
        "title": "No non-CA leaf certificate supplied",
        "action": "Supply or explicitly select the intended non-CA leaf before checking a hostname."
      },
      "HOSTNAME_MATCH": {
        "title": "Expected hostname matches the selected leaf’s DNS SAN",
        "action": "Check client trust and the actual deployment separately; this observation does not prove either."
      },
      "HOSTNAME_MISMATCH": {
        "title": "Expected hostname matches no DNS SAN on the selected leaf",
        "action": "Check the hostname or obtain a certificate with the required DNS SAN. Common Name is not a fallback."
      }
    }
  },
  "homepage": {
    "description": "Inspect a PEM certificate bundle locally, including signatures, issuer candidates, and optional DNS identity.",
    "link": "Check a certificate bundle"
  },
  "apiSummary": "Submit PEM certificates and an optional DNS hostname to the server. Receive original positions, candidate signature checks, and findings with evidence and next actions. Private keys are rejected; results do not establish client trust.",
  "meta": {
    "title": "Certificate Bundle Checker — Packetrove",
    "description": "Inspect PEM certificates locally. Verify candidate signatures, validity, issuer constraints, and DNS SAN identity with actionable findings; no uploads or full trust validation."
  },
  "remotePrivacy": "API and remote MCP calls send supplied IP addresses, CIDRs, range endpoints, or PEM certificates and optional hostnames to Packetrove. We process them in memory without a database or retained result history. Certificate payloads and sensitive certificate details are excluded from application logs and error telemetry. Do not submit private keys or other secrets. The calling client receives results and may retain them under its own policies.",
  "discovery": {
    "title": "Questions about certificate bundles",
    "mcpTitle": "Check certificate bundles through MCP",
    "purpose": "Ask an AI client to inspect a supplied public certificate bundle and report evidence-based next steps.",
    "inputs": "Pass pem (up to 48 KiB UTF-8 and 16 CERTIFICATE blocks), optional ASCII DNS hostname, and optional zero-based leafIndex. Private keys and unsupported blocks are rejected.",
    "result": "Read certificates in original order, candidate relationships, leafIndexes, selectedLeafIndex, hostname status, evaluatedAt, and findings with stable code, severity, evidence, and nextAction. Unsupported checks differ from failed signatures.",
    "boundary": "Browser checks stay local. API and remote MCP send certificates and optional hostnames to the server. No full path validation, client trust, revocation, live probing, or CLI operation. Never treat the result as proof of deployment safety.",
    "openTool": "Open the browser certificate checker",
    "questions": {
      "trust": {
        "question": "Does a verified link mean the bundle is trusted?",
        "answer": "It verifies one signature and local issuer constraints. Trust stores, full path constraints, revocation, and the deployed endpoint remain separate checks."
      },
      "root": {
        "question": "Does an absent issuer prove a broken chain?",
        "answer": "No. It describes only this supplied bundle. Servers usually omit roots. If this is the served bundle, review the full-chain configuration and the intended client trust."
      },
      "privacy": {
        "question": "Where do my certificates go?",
        "answer": "Browser input and results remain in page memory without upload, persistence, logging, or input-bearing URLs. API and remote MCP calls transmit them to the server. Private keys are rejected."
      }
    }
  }
} as const;
