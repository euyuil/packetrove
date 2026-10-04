export const certificateCopy = {
  "certificate": {
    "title": "Zertifikatsbündel-Prüfung",
    "description": "PEM-Zertifikate, mögliche Aussteller und nächste Schritte anhand konkreter Befunde prüfen.",
    "local": "Prüfung im Browser · Zertifikate und Ergebnisse nur im Seitenspeicher",
    "scopeTitle": "Prüfumfang",
    "scope": "Prüft Format, Duplikate, Gültigkeit, mögliche Signaturen, CA- und keyCertSign-Bedingungen sowie optional einen DNS-Hostnamen. Keine vollständige RFC-5280-Pfad-, Vertrauens-, Sperr- oder Bereitstellungsprüfung.",
    "inputs": "Zertifikate eingeben",
    "samplesLabel": "Synthetische Zertifikatsbeispiele",
    "loadSample": "Laden und prüfen",
    "pem": "PEM-Zertifikate",
    "pemHelp": "Nur CERTIFICATE-Blöcke und Zwischenräume; höchstens {{maximum}} Zertifikate und {{kib}} KiB. Private Schlüssel werden abgelehnt.",
    "bytes": "{{current}} / {{maximum}} Bytes",
    "hostname": "Erwarteter Hostname (optional)",
    "hostnameHelp": "Nur ASCII-DNS-Namen. Prüft DNS SAN des gewählten Endzertifikats ohne Rückgriff auf Common Name.",
    "check": "Zertifikatsbündel prüfen",
    "result": "Prüfergebnisse",
    "completed": "Prüfung abgeschlossen. Zertifikate: {{certificates}}. Befunde: {{findings}}.",
    "certificates": "Zertifikate",
    "verifiedLinks": "Verifizierte Signaturen",
    "findingCount": "Befunde",
    "evaluation": "Prüfzeit: {{time}} (Geräteuhr)",
    "selectLeaf": "Endzertifikat für den Hostnamen",
    "selectPosition": "Ursprüngliche Position wählen",
    "hostnameTitle": "Hostname: {{hostname}}",
    "relationships": "Ausstellerbeziehungen",
    "candidate": "Mögliche Beziehung",
    "constraints": "Ausstellerbedingungen",
    "constraintsFailed": "CA / Key Usage abgelehnt",
    "keyIdFailed": "Schlüsselkennungen verschieden",
    "constraintsPassed": "Lokale Bedingungen erfüllt",
    "findingsTitle": "Befunde und nächste Schritte",
    "checking": "Lokale Analyse und Signaturprüfung…",
    "pending": "Zertifikate eingeben und prüfen. Änderungen löschen das vorherige Ergebnis.",
    "details": "Zertifikatsdetails · Eingabereihenfolge",
    "explanationTitle": "Prüfergebnisse verstehen",
    "explanation": "Nummern bezeichnen ursprüngliche Positionen; JSON-Indizes beginnen bei null. Duplikate bleiben sichtbar. Namen werden konservativ anhand ihrer Kodierung verglichen. Fehlende Aussteller sind informativ; ein fehlgeschlagener Kandidat entwertet keine andere Beziehung. Entwürfe bleiben beim Werkzeug- oder Sprachwechsel im Seitenspeicher und werden beim Neuladen gelöscht.",
    "dnsRules": "DNS SAN ignoriert ASCII-Großschreibung und den abschließenden Punkt des Hostnamens. Ein vollständiger Platzhalter ganz links passt auf genau ein Label. URLs, IPs, Ports, Platzhalter-Eingaben und Unicode-Hostnamen werden abgelehnt; internationale Namen vorher in punycode umwandeln. Common Name dient nur zur Anzeige.",
    "examplesTitle": "Synthetische Beispiele",
    "exampleNote": "Öffentliche synthetische Zertifikate. Dokumentierte Prüfzeit: {{time}}. Ihre Prüfung nutzt die aktuelle Uhr des Laufzeitsystems.",
    "graphLabel": "Ausstellerdiagramm; Pfeile führen vom Zertifikat zum möglichen Aussteller. Ursprüngliche Positionen stehen darunter.",
    "graphHelp": "Zertifikat → möglicher Aussteller. Durchgezogen: Signatur und lokale Bedingungen erfüllt. Gestrichelt: fehlgeschlagen oder unvollständig. Selbstsignaturen stehen in den Details.",
    "noCommonName": "Kein CN",
    "ca": "CA-Zertifikat",
    "nonCa": "Nicht-CA-Zertifikat",
    "nextAction": "Nächster Schritt",
    "noFindings": "Keine Befunde. Vertrauen und tatsächliche Bereitstellung separat prüfen.",
    "yes": "Ja",
    "no": "Nein",
    "notProvided": "Nicht angegeben",
    "originalPosition": "Ursprüngliche Position",
    "position": "Zertifikat #{{number}}, Beginn in Zeile {{line}}",
    "serial": "Seriennummer",
    "selfSignature": "Selbstsignaturprüfung",
    "json": "Strukturiertes JSON-Ergebnis",
    "inputLine": "Zeile {{line}}: {{message}}",
    "status": {
      "verified": "Verifiziert",
      "failed": "Fehlgeschlagen",
      "unsupported": "Nicht unterstützt",
      "unavailable": "Unvollständig"
    },
    "severity": {
      "error": "Fehler",
      "warning": "Warnung",
      "info": "Information"
    },
    "hostnameStatus": {
      "matched": "DNS SAN passt. Pfadgültigkeit und Client-Vertrauen separat prüfen.",
      "mismatched": "DNS SAN passt nicht; Befunddaten prüfen.",
      "ambiguous": "Vor der Hostnamenprüfung das Endzertifikat auswählen.",
      "no-leaf": "Kein Nicht-CA-Endzertifikat für die Hostnamenprüfung."
    },
    "samples": {
      "normal": "Normales Bündel",
      "omittedRoot": "Stammzertifikat weggelassen",
      "missingIntermediate": "Zwischenzertifikat fehlt",
      "expired": "Abgelaufen",
      "future": "Noch nicht gültig",
      "hostnameMismatch": "Hostname passt nicht",
      "multipleLeaves": "Mehrere Endzertifikate",
      "crossSigning": "Kreuzsignierung und beliebige Reihenfolge",
      "invalidCandidate": "Gleichnamiger Kandidat fehlgeschlagen",
      "duplicate": "Doppeltes Zertifikat"
    },
    "errors": {
      "EMPTY_INPUT": "Mindestens ein PEM-Zertifikat einfügen.",
      "INPUT_TOO_LARGE": "PEM überschreitet 48 KiB UTF-8.",
      "INVALID_PEM": "Ungültiges PEM. Nur CERTIFICATE-Blöcke, vollständiges Base64 und Zwischenräume sind erlaubt.",
      "PRIVATE_KEY_REJECTED": "Privater Schlüssel abgelehnt. Entfernen und nur Zertifikate eingeben.",
      "UNSUPPORTED_PEM_BLOCK": "Nicht unterstützter Block. Nur CERTIFICATE ist erlaubt.",
      "INVALID_CERTIFICATE": "Dieser Block ist kein unterstütztes, korrektes DER-X.509-Zertifikat.",
      "TOO_MANY_CERTIFICATES": "Höchstens 16 Zertifikate; keine Teilergebnisse.",
      "INVALID_HOSTNAME": "ASCII-DNS-Namen ohne URL, IP, Port oder Platzhalter verwenden; Unicode-Namen vorher in punycode umwandeln.",
      "INVALID_LEAF_SELECTION": "Eine ursprüngliche Position mit einem Nicht-CA-Zertifikat wählen.",
      "CRYPTO_UNAVAILABLE": "Prüfung unvollständig. Unterstützten Browser in sicherem Kontext oder andere Implementierung verwenden.",
      "INVALID_INPUT": "Ungültige Anfrage. PEM, Hostnamen und Position des Endzertifikats prüfen.",
      "INVALID_TIME": "Ungültige Prüfzeit des Laufzeitsystems."
    },
    "evidence": {
      "fingerprintSha256": "SHA-256-Fingerabdruck",
      "evaluatedAt": "Prüfzeit",
      "notAfter": "Gültig bis",
      "notBefore": "Gültig ab",
      "subject": "Subject",
      "issuer": "Issuer",
      "signature": "Signatur",
      "algorithm": "Signaturalgorithmus",
      "ca": "CA",
      "basicConstraintsPresent": "basicConstraints vorhanden",
      "keyCertSign": "keyCertSign",
      "authorityKeyIdentifier": "Authority Key Identifier",
      "subjectKeyIdentifier": "Subject Key Identifier",
      "candidateCount": "Kandidaten",
      "expectedHostname": "Erwarteter Hostname",
      "dnsSubjectAlternativeNames": "DNS SAN"
    },
    "findings": {
      "DUPLICATE_CERTIFICATE": {
        "title": "Doppeltes Zertifikat an diesen Positionen",
        "action": "Unbeabsichtigte Duplikate entfernen."
      },
      "CERTIFICATE_EXPIRED": {
        "title": "Zertifikat zur Prüfzeit abgelaufen",
        "action": "Zertifikat erneuern oder ersetzen und das tatsächlich ausgelieferte Zertifikat prüfen."
      },
      "CERTIFICATE_NOT_YET_VALID": {
        "title": "Zertifikat zur Prüfzeit noch nicht gültig",
        "action": "Geräteuhr und Aktivierungsdatum prüfen."
      },
      "SELF_SIGNED_CERTIFICATE": {
        "title": "Signatur mit eigenem öffentlichen Schlüssel verifiziert",
        "action": "Client-Vertrauen und tatsächliche Bereitstellung separat prüfen; dieser Befund beweist beides nicht."
      },
      "SELF_SIGNATURE_FAILED": {
        "title": "Selbstsignatur eines selbst ausgestellten Zertifikats fehlgeschlagen",
        "action": "Diese beiden Eingabepositionen prüfen. Andere Kandidaten werden unabhängig geprüft."
      },
      "SIGNATURE_UNSUPPORTED": {
        "title": "Signaturalgorithmus nicht unterstützt",
        "action": "Mit einer Implementierung prüfen, die den Algorithmus unterstützt. Unvollständig oder nicht unterstützt bedeutet keine ungültige Signatur."
      },
      "SIGNATURE_CHECK_UNAVAILABLE": {
        "title": "Signaturprüfung nicht abgeschlossen",
        "action": "Mit einer Implementierung prüfen, die den Algorithmus unterstützt. Unvollständig oder nicht unterstützt bedeutet keine ungültige Signatur."
      },
      "ISSUER_NOT_IN_BUNDLE": {
        "title": "Kein kodierter Ausstellername im Bündel gefunden",
        "action": "Falls der Server dieses Bündel tatsächlich ausliefert, die full-chain-Konfiguration prüfen. Stammzertifikate werden meist weggelassen; Abwesenheit allein beweist keinen defekten Pfad."
      },
      "CANDIDATE_SIGNATURE_FAILED": {
        "title": "Signatur des möglichen Ausstellers fehlgeschlagen",
        "action": "Diese beiden Eingabepositionen prüfen. Andere Kandidaten werden unabhängig geprüft."
      },
      "ISSUER_NOT_CA": {
        "title": "Möglicher Aussteller erklärt nicht CA=true",
        "action": "Vorgesehene ausstellende CA, Key Usage, Schlüsselkennungen und alternative Kandidaten prüfen."
      },
      "ISSUER_KEY_USAGE_REJECTED": {
        "title": "Möglicher Aussteller erlaubt kein keyCertSign",
        "action": "Vorgesehene ausstellende CA, Key Usage, Schlüsselkennungen und alternative Kandidaten prüfen."
      },
      "ISSUER_KEY_ID_MISMATCH": {
        "title": "Aussteller- und Subjektschlüsselkennungen verschieden",
        "action": "Vorgesehene ausstellende CA, Key Usage, Schlüsselkennungen und alternative Kandidaten prüfen."
      },
      "MULTIPLE_ISSUERS": {
        "title": "Mehrere Kandidaten erfüllen lokale Bedingungen",
        "action": "Kandidatenpfade einzeln prüfen. Das Werkzeug wählt keinen maßgeblichen Vertrauenspfad."
      },
      "LEAF_SELECTION_REQUIRED": {
        "title": "Mehrere Endzertifikate erfordern Auswahl",
        "action": "Das vorgesehene Nicht-CA-Endzertifikat bereitstellen oder ausdrücklich auswählen."
      },
      "NO_LEAF_CERTIFICATE": {
        "title": "Kein Nicht-CA-Endzertifikat vorhanden",
        "action": "Das vorgesehene Nicht-CA-Endzertifikat bereitstellen oder ausdrücklich auswählen."
      },
      "HOSTNAME_MATCH": {
        "title": "Hostname passt zum DNS SAN des Endzertifikats",
        "action": "Client-Vertrauen und tatsächliche Bereitstellung separat prüfen; dieser Befund beweist beides nicht."
      },
      "HOSTNAME_MISMATCH": {
        "title": "Hostname passt zu keinem DNS SAN des Endzertifikats",
        "action": "Hostnamen prüfen oder ein Zertifikat mit dem nötigen DNS SAN beschaffen. Common Name wird nicht als Ersatz verwendet."
      }
    }
  },
  "homepage": {
    "description": "PEM-Zertifikate lokal auf Signaturen, Ausstellerkandidaten und optional DNS-Identität prüfen.",
    "link": "Zertifikatsbündel prüfen"
  },
  "apiSummary": "PEM-Zertifikate und optionalen DNS-Hostnamen an den Server senden. Ursprüngliche Positionen, Kandidatensignaturen, Befunde und nächste Schritte erhalten. Private Schlüssel werden abgelehnt; Ergebnisse beweisen kein Client-Vertrauen.",
  "meta": {
    "title": "Zertifikatsbündel-Prüfung — Packetrove",
    "description": "PEM-Signaturen, Gültigkeit, Ausstellerbedingungen und DNS SAN lokal mit konkreten Befunden prüfen. Kein Upload und keine vollständige Vertrauensprüfung."
  },
  "remotePrivacy": "API und Remote-MCP senden IPs, CIDRs, Bereichsgrenzen oder PEM-Zertifikate und optionale Hostnamen an Packetrove. Verarbeitung nur im Arbeitsspeicher, ohne Datenbank oder Ergebnisverlauf. Zertifikatsinhalte und sensible Details gelangen nicht in Anwendungsprotokolle oder Fehlertelemetrie. Keine privaten Schlüssel oder Geheimnisse senden. Der Client kann Ergebnisse nach eigenen Regeln speichern.",
  "discovery": {
    "title": "Fragen zu Zertifikatsbündeln",
    "mcpTitle": "Zertifikate über MCP prüfen",
    "purpose": "Einen KI-Client um die Prüfung öffentlicher Zertifikate und begründete nächste Schritte bitten.",
    "inputs": "pem (höchstens 48 KiB UTF-8 und 16 CERTIFICATE-Blöcke), optional ASCII-DNS-hostname und nullbasierten leafIndex übergeben. Private Schlüssel und andere Blöcke werden abgelehnt.",
    "result": "certificates in Eingabereihenfolge, relationships, leafIndexes, selectedLeafIndex, hostname, evaluatedAt und findings mit code, severity, evidence sowie nextAction lesen. Nicht unterstützte Prüfungen sind von Signaturfehlern getrennt.",
    "boundary": "Browserprüfungen bleiben lokal. API und Remote-MCP senden Zertifikate und Hostnamen an den Server. Keine vollständige Pfad-, Vertrauens-, Sperr- oder Onlineprüfung und kein CLI-Befehl. Kein Nachweis der Bereitstellungssicherheit.",
    "openTool": "Zertifikatsprüfung im Browser öffnen",
    "questions": {
      "trust": {
        "question": "Bedeutet eine verifizierte Beziehung Vertrauen?",
        "answer": "Sie verifiziert eine Signatur und lokale Ausstellerbedingungen. Vertrauensspeicher, vollständiger Pfad, Sperrstatus und tatsächlicher Endpunkt sind separate Prüfungen."
      },
      "root": {
        "question": "Beweist ein fehlender Aussteller einen defekten Pfad?",
        "answer": "Nein. Das beschreibt nur die Eingabe. Server lassen Stammzertifikate meist weg. Bei tatsächlich ausgelieferten Bündeln full-chain und vorgesehenes Client-Vertrauen prüfen."
      },
      "privacy": {
        "question": "Wohin gehen meine Zertifikate?",
        "answer": "Im Browser bleiben Eingaben und Ergebnisse im Seitenspeicher ohne Upload, Speicherung, Protokollierung oder Eingaben in URLs. API und Remote-MCP senden sie an den Server. Private Schlüssel werden abgelehnt."
      }
    }
  }
} as const;
