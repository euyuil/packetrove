export const certificateCopy = {
  "certificate": {
    "title": "Controllo dei certificati",
    "description": "Esamina certificati PEM, possibili emittenti e prossimi passi basati su evidenze.",
    "local": "Controllo nel browser · Certificati e risultati solo nella memoria della pagina",
    "scopeTitle": "Ambito dei controlli",
    "scope": "Verifica formato, duplicati, validità, firme candidate, CA, keyCertSign e un nome DNS facoltativo. Non convalida percorsi RFC 5280 completi, fiducia del client, revoca o sicurezza del rilascio.",
    "inputs": "Certificati da controllare",
    "samplesLabel": "Esempi di certificati sintetici",
    "loadSample": "Prova un esempio",
    "samplesHelp": "Scegli un insieme di certificati sintetici pubblici per compilare i campi. Poi avvia il controllo con il relativo pulsante.",
    "closeExamples": "Chiudi esempi",
    "evidenceTitle": "Evidenze",
    "pem": "Certificati PEM",
    "pemHelp": "Solo blocchi CERTIFICATE e spazi; massimo {{maximum}} certificati e {{kib}} KiB. Chiavi private rifiutate.",
    "bytes": "{{current}} / {{maximum}} byte",
    "hostname": "Nome host atteso (facoltativo)",
    "hostnameHelp": "Solo nomi DNS ASCII. Controlla il DNS SAN del certificato finale selezionato, senza ripiegare su Common Name.",
    "check": "Controlla i certificati",
    "result": "Risultati",
    "completed": "Controllo completato. Certificati: {{certificates}}. Riscontri: {{findings}}.",
    "certificates": "Certificati",
    "verifiedLinks": "Firme verificate",
    "findingCount": "Riscontri",
    "evaluation": "Ora di valutazione: {{time}} (orologio del dispositivo)",
    "selectLeaf": "Certificato finale per il nome host",
    "selectPosition": "Seleziona la posizione originale",
    "hostnameTitle": "Nome host: {{hostname}}",
    "relationships": "Relazioni di emissione",
    "candidate": "Relazione candidata",
    "constraints": "Vincoli dell’emittente",
    "constraintsFailed": "CA / Key Usage rifiutato",
    "keyIdFailed": "Identificatori di chiave diversi",
    "constraintsPassed": "Vincoli locali soddisfatti",
    "findingsTitle": "Riscontri e prossimi passi",
    "checking": "Analisi e verifica locale…",
    "pending": "Inserisci i certificati e avvia il controllo. Le modifiche cancellano il risultato precedente.",
    "details": "Dettagli · Ordine originale",
    "explanationTitle": "Comprendere i controlli",
    "explanation": "I numeri indicano le posizioni originali; gli indici JSON partono da zero. I duplicati restano visibili. I nomi candidati sono confrontati prudentemente per codifica. Un emittente assente è informativo e un candidato non valido non annulla gli altri. Le bozze rimangono in memoria cambiando strumento o lingua; ricaricare le cancella.",
    "dnsRules": "DNS SAN ignora maiuscole ASCII e punto finale del nome. Un carattere jolly completo nella prima etichetta corrisponde a una sola etichetta. URL, IP, porte, jolly inseriti e nomi Unicode sono rifiutati; converti i nomi internazionali in punycode. Common Name è solo visualizzato.",
    "examplesTitle": "Esempi sintetici",
    "exampleNote": "Certificati pubblici sintetici. Ora documentata: {{time}}. Il controllo usa l’orologio attuale dell’ambiente.",
    "graphLabel": "Grafo degli emittenti; frecce dal certificato al possibile emittente. Le posizioni originali sono elencate sotto.",
    "graphHelp": "Certificato → possibile emittente. Linea continua: firma e vincoli locali soddisfatti. Tratteggiata: errore o controllo incompleto. Autofirme nei dettagli.",
    "noCommonName": "CN assente",
    "ca": "Certificato CA",
    "nonCa": "Certificato non CA",
    "nextAction": "Prossimo passo",
    "noFindings": "Nessun riscontro. Controlla separatamente fiducia del client e rilascio.",
    "yes": "Sì",
    "no": "No",
    "notProvided": "Non fornito",
    "originalPosition": "Posizione originale",
    "position": "Certificato #{{number}}, inizio alla riga {{line}}",
    "serial": "Numero di serie",
    "selfSignature": "Controllo dell’autofirma",
    "json": "Risultato JSON strutturato",
    "inputLine": "Riga {{line}}: {{message}}",
    "status": {
      "verified": "Verificata",
      "failed": "Fallita",
      "unsupported": "Non supportata",
      "unavailable": "Incompleta"
    },
    "severity": {
      "error": "Errore",
      "warning": "Avviso",
      "info": "Informazione"
    },
    "hostnameStatus": {
      "matched": "DNS SAN corrispondente. Validità della catena e fiducia del client vanno controllate a parte.",
      "mismatched": "DNS SAN non corrispondente; esamina le evidenze.",
      "ambiguous": "Seleziona il certificato finale prima di controllare il nome.",
      "no-leaf": "Nessun certificato finale non CA per il nome host."
    },
    "samples": {
      "normal": "Insieme normale",
      "omittedRoot": "Radice omessa",
      "missingIntermediate": "Intermedio assente",
      "expired": "Certificato scaduto",
      "future": "Certificato futuro",
      "hostnameMismatch": "Nome host non corrispondente",
      "multipleLeaves": "Più certificati finali",
      "crossSigning": "Firma incrociata e ordine libero",
      "invalidCandidate": "Candidato omonimo fallito",
      "duplicate": "Certificato duplicato"
    },
    "errors": {
      "EMPTY_INPUT": "Incolla almeno un certificato PEM.",
      "INPUT_TOO_LARGE": "PEM supera il limite UTF-8 di 48 KiB.",
      "INVALID_PEM": "PEM non valido. Sono ammessi solo CERTIFICATE, Base64 completo e spazi tra blocchi.",
      "PRIVATE_KEY_REJECTED": "Chiave privata rifiutata. Rimuovila e inserisci solo certificati.",
      "UNSUPPORTED_PEM_BLOCK": "Blocco non supportato. Solo CERTIFICATE è ammesso.",
      "INVALID_CERTIFICATE": "Il blocco non è un certificato DER X.509 corretto e supportato.",
      "TOO_MANY_CERTIFICATES": "Massimo 16 certificati; nessun risultato parziale.",
      "INVALID_HOSTNAME": "Usa un nome DNS ASCII senza URL, IP, porta o jolly; converti Unicode in punycode.",
      "INVALID_LEAF_SELECTION": "Seleziona una posizione originale con un certificato non CA.",
      "CRYPTO_UNAVAILABLE": "Controllo incompleto. Usa un browser compatibile in un contesto sicuro o un’altra implementazione.",
      "INVALID_INPUT": "Richiesta non valida. Controlla PEM, nome host e posizione finale.",
      "INVALID_TIME": "Ora di valutazione dell’ambiente non valida."
    },
    "graphScrollHelp": "Su schermi stretti, scorri il diagramma in orizzontale per leggere ogni certificato.",
    "evidence": {
      "fingerprintSha256": "Impronta SHA-256",
      "evaluatedAt": "Ora di valutazione",
      "notAfter": "Fine validità",
      "notBefore": "Inizio validità",
      "subject": "Subject",
      "issuer": "Issuer",
      "signature": "Firma",
      "algorithm": "Algoritmo di firma",
      "ca": "CA",
      "basicConstraintsPresent": "basicConstraints presente",
      "keyCertSign": "keyCertSign",
      "authorityKeyIdentifier": "Authority Key Identifier",
      "subjectKeyIdentifier": "Subject Key Identifier",
      "candidateCount": "Candidati",
      "expectedHostname": "Nome host atteso",
      "dnsSubjectAlternativeNames": "DNS SAN"
    },
    "findings": {
      "DUPLICATE_CERTIFICATE": {
        "title": "Certificato duplicato in queste posizioni",
        "action": "Rimuovi i duplicati non intenzionali."
      },
      "CERTIFICATE_EXPIRED": {
        "title": "Certificato scaduto alla valutazione",
        "action": "Rinnova o sostituisci il certificato e verifica quello realmente servito."
      },
      "CERTIFICATE_NOT_YET_VALID": {
        "title": "Certificato non ancora valido",
        "action": "Controlla l’orologio e la data di attivazione."
      },
      "SELF_SIGNED_CERTIFICATE": {
        "title": "Firma verificata con la propria chiave pubblica",
        "action": "Controlla separatamente fiducia del client e rilascio reale; il riscontro non prova nessuno dei due."
      },
      "SELF_SIGNATURE_FAILED": {
        "title": "Autofirma fallita nel certificato autoemesso",
        "action": "Esamina queste due posizioni originali. Gli altri candidati sono verificati indipendentemente."
      },
      "SIGNATURE_UNSUPPORTED": {
        "title": "Algoritmo di firma non supportato",
        "action": "Verifica con un’altra implementazione compatibile con l’algoritmo. Non supportato o incompleto non significa firma errata."
      },
      "SIGNATURE_CHECK_UNAVAILABLE": {
        "title": "Controllo della firma incompleto",
        "action": "Verifica con un’altra implementazione compatibile con l’algoritmo. Non supportato o incompleto non significa firma errata."
      },
      "ISSUER_NOT_IN_BUNDLE": {
        "title": "Nome codificato dell’emittente non trovato",
        "action": "Se il server serve realmente questo insieme, controlla full-chain. Le radici sono normalmente omesse; l’assenza da sola non prova una catena difettosa."
      },
      "CANDIDATE_SIGNATURE_FAILED": {
        "title": "Firma dell’emittente candidato fallita",
        "action": "Esamina queste due posizioni originali. Gli altri candidati sono verificati indipendentemente."
      },
      "ISSUER_NOT_CA": {
        "title": "Il candidato non dichiara CA=true",
        "action": "Conferma la CA prevista, Key Usage e identificatori di chiave; valuta le alternative."
      },
      "ISSUER_KEY_USAGE_REJECTED": {
        "title": "Il candidato non permette keyCertSign",
        "action": "Conferma la CA prevista, Key Usage e identificatori di chiave; valuta le alternative."
      },
      "ISSUER_KEY_ID_MISMATCH": {
        "title": "Identificatori di autorità e soggetto diversi",
        "action": "Conferma la CA prevista, Key Usage e identificatori di chiave; valuta le alternative."
      },
      "MULTIPLE_ISSUERS": {
        "title": "Più candidati soddisfano i vincoli locali",
        "action": "Controlla separatamente i percorsi candidati. Lo strumento non sceglie un percorso di fiducia autorevole."
      },
      "LEAF_SELECTION_REQUIRED": {
        "title": "Più certificati finali richiedono una scelta",
        "action": "Fornisci o seleziona esplicitamente il certificato finale non CA prima del controllo del nome."
      },
      "NO_LEAF_CERTIFICATE": {
        "title": "Certificato finale non CA assente",
        "action": "Fornisci o seleziona esplicitamente il certificato finale non CA prima del controllo del nome."
      },
      "HOSTNAME_MATCH": {
        "title": "Nome corrispondente al DNS SAN selezionato",
        "action": "Controlla separatamente fiducia del client e rilascio reale; il riscontro non prova nessuno dei due."
      },
      "HOSTNAME_MISMATCH": {
        "title": "Nome non corrispondente a nessun DNS SAN selezionato",
        "action": "Controlla il nome o ottieni un certificato con il DNS SAN richiesto. Common Name non è un’alternativa."
      }
    }
  },
  "homepage": {
    "description": "Controlla localmente firme PEM, emittenti candidati e identità DNS facoltativa.",
    "link": "Controlla i certificati"
  },
  "apiSummary": "Invia certificati PEM e un nome DNS facoltativo al server. Ricevi posizioni originali, firme candidate, riscontri con evidenze e prossimi passi. Le chiavi private sono rifiutate; il risultato non prova la fiducia del client.",
  "meta": {
    "title": "Controllo dei certificati — Packetrove",
    "description": "Esamina localmente firme PEM, validità, vincoli e DNS SAN con passi concreti. Nessun caricamento o controllo completo della fiducia."
  },
  "remotePrivacy": "API e MCP remoto inviano IP, CIDR, estremi degli intervalli o certificati PEM e nomi facoltativi a Packetrove. Elaborazione in memoria, senza database o cronologia. Contenuti e dettagli sensibili dei certificati sono esclusi da log e telemetria degli errori. Non inviare chiavi private o segreti. Il client può conservare i risultati secondo le proprie politiche.",
  "discovery": {
    "title": "Domande sui certificati",
    "mcpTitle": "Controlla i certificati tramite MCP",
    "purpose": "Chiedi a un client IA di esaminare certificati pubblici e proporre passi basati su evidenze.",
    "inputs": "Passa pem (massimo 48 KiB UTF-8 e 16 blocchi CERTIFICATE), hostname DNS ASCII e leafIndex originale da zero facoltativi. Chiavi private e altri blocchi sono rifiutati.",
    "result": "Leggi certificates nell’ordine originale, relationships, leafIndexes, selectedLeafIndex, hostname, evaluatedAt e findings con code, severity, evidence e nextAction. Non supportato è distinto da firma fallita.",
    "boundary": "Il browser controlla localmente. API e MCP remoto inviano certificati e nomi al server. Nessuna verifica completa di percorso, fiducia, revoca, rete o comando CLI. Il risultato non prova la sicurezza del rilascio.",
    "openTool": "Apri il controllo nel browser",
    "questions": {
      "trust": {
        "question": "Una relazione verificata implica fiducia?",
        "answer": "Verifica una firma e vincoli locali. Archivi di fiducia, percorso completo, revoca e servizio reale sono controlli separati."
      },
      "root": {
        "question": "Un emittente assente prova una catena difettosa?",
        "answer": "No. Descrive solo l’input. I server omettono normalmente le radici. Per l’insieme realmente servito, controlla full-chain e fiducia del client previsto."
      },
      "privacy": {
        "question": "Dove vengono inviati i certificati?",
        "answer": "Nel browser input e risultati rimangono in memoria senza caricamento, persistenza, log o dati negli URL. API e MCP remoto li inviano al server. Le chiavi private sono rifiutate."
      }
    }
  }
} as const;
