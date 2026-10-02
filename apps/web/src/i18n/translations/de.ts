import type { TranslationResource } from '../resources';

export const de = {
  common: {
    home: 'Startseite', homeLabel: 'Packetrove-Startseite', navigation: 'Hauptnavigation',
    language: 'Sprache', tools: 'WERKZEUGE FÜR IP-ADRESSEN', copied: 'Kopiert', dismissCopy: 'Kopierfehler schließen',
    tagline: 'Netzwerkwerkzeuge für Menschen und KI-Agenten',
    source: 'Packetrove auf GitHub ansehen', sourceCommit: 'Quellcode für Commit {{commit}} auf GitHub ansehen', sourceLicense: 'Quellcode: MIT',
    feedbackPrompt: 'Einen Fehler gefunden oder eine Idee? Schreiben Sie uns auf GitHub.', reportBug: 'Fehler melden', requestFeature: 'Funktion vorschlagen',
    notFound: 'Seite nicht gefunden', notFoundDescription: 'Die angeforderte Seite existiert nicht.', returnHome: 'Zur Startseite',
  },
  languageSuggestion: {
    title: 'Möchten Sie diese Seite auf Deutsch lesen?',
    switch: 'Zu Deutsch wechseln', dismiss: 'Jetzt nicht',
  },
  footer: { project: 'Projekt', contact: 'Kontakt und Feedback', sendEmail: 'E-Mail senden' },
  home: {
    description: 'Open-Source-Netzwerkwerkzeuge für Ihren Browser, Ihr Terminal und Ihre KI-Agenten. Öffnen Sie ein Werkzeug über die Navigation oder integrieren Sie Packetrove mithilfe der folgenden Anleitungen in Ihren Arbeitsablauf.',
    openSource: 'Open Source', anonymous: 'Kein Konto oder API-Schlüssel erforderlich',
    cidrDescription: 'Finden Sie das kleinste einzelne CIDR-Netz, das IPv4- oder IPv6-Adressen und Bereiche abdeckt. Berechnen Sie es lokal im Browser mit exakten Adresszahlen und einer klaren Erklärung zusätzlicher Abdeckung.',
    cidrLink: 'CIDR-Rechner öffnen',
    subtractDescription: 'Entferne ausgeschlossene Netze aus dem eingeschlossenen Adressraum. Kopiere eine exakte CIDR-Liste für WireGuard-Ausnahmen oder prüfe Lücken nach bekannten Zuweisungen, ohne deine Eingaben hochzuladen.',
    subtractLink: 'CIDR-Subtraktion öffnen',
    ipDescription: 'Prüfen Sie die öffentliche IP-Adresse Ihrer Verbindung. Bei einem VPN oder Proxy zeigt das Ergebnis dessen Ausgangsadresse; Ihre private lokale Adresse wird nicht angezeigt.',
    ipLink: 'Meine öffentliche IP-Adresse prüfen',
    apiTitle: 'Web-API', apiDescription: 'Rufen Sie Packetrove mit einem beliebigen HTTP-Client auf. Fragen Sie zum Beispiel Ihre aktuelle öffentliche IP-Adresse mit curl ab:',
    apiResponse: 'Die Antwort enthält die IP-Adresse mit anschließendem Zeilenumbruch und <code>Content-Type: text/plain</code>.', apiGuide: 'API-Anleitung lesen',
    cliTitle: 'Kommandozeilenschnittstelle', cliDescription: 'Installieren Sie das Programm aus dem Quellcode mit Node.js und pnpm:',
    cliExample: 'Geben Sie anschließend Ihre aktuelle öffentliche IP-Adresse aus:', cliGuide: 'CLI-Anleitung lesen (Englisch)',
    mcpTitle: 'Model Context Protocol (MCP)', mcpDescription: 'Verbinden Sie Ihren KI-Agenten über Streamable HTTP mit Packetrove. Eine Authentifizierung oder ein lokaler Server ist nicht erforderlich.',
    serverAddress: 'Serveradresse', mcpExample: 'Fügen Sie nach der Installation Ihres Clients den Server hinzu:',
    mcpCheck: 'Prüfen Sie die Verbindung mit <code>/mcp</code> in Ihrem Client. Die Abfrage der öffentlichen IP-Adresse zeigt die Verbindung, die der Agent verwendet.', mcpGuide: "Die MCP-Verbindungsanleitung lesen",
  },
  cidr: {
    title: 'Kleinstes umfassendes CIDR-Netz', description: 'Fassen Sie IPv4- oder IPv6-Adressen und Bereiche im kleinsten einzelnen CIDR-Netz zusammen, das alle Eingaben abdeckt.',
    local: 'Berechnung im Browser · Keine API-Anfrage', addresses: 'Ihre Adressen', inputLabel: 'IP-Adressen oder CIDR-Netze',
    inputHelp: 'Trennen Sie Einträge durch Kommas, Leerzeichen, Tabulatoren oder Zeilenumbrüche. Verwenden Sie eine Adressfamilie pro Berechnung. Höchstens {{maximum}} Einträge.',
    entryCount_one: '{{total}} Eintrag', entryCount_other: '{{total}} Einträge', clear: 'Leeren', example: 'Beispiel ausprobieren', calculate: 'Umfassendes CIDR-Netz berechnen',
    result: 'Ergebnis der Abdeckung', resultLabel: 'KLEINSTES UMFASSENDES CIDR-NETZ', copy: 'CIDR kopieren',
    copySuccess: 'CIDR kopiert.', copyFailure: 'Die Zwischenablage ist nicht verfügbar. Markieren und kopieren Sie das CIDR-Netz oben.',
    first: 'Erste Adresse', last: 'Letzte Adresse', unique: 'Eindeutige Eingabeadressen', covered: 'Abgedeckte Adressen', additional: 'Zusätzliche Adressen',
    exact: 'Exakte Abdeckung: Dieses CIDR-Netz fügt keine Adressen hinzu.',
    expansionOne: 'Dieses CIDR-Netz fügt {{total}} Adresse hinzu. Seine Anwendung erweitert die Adressen, die Ihre Liste erlaubt oder sperrt.',
    expansionOther: 'Dieses CIDR-Netz fügt {{total}} Adressen hinzu. Seine Anwendung erweitert die Adressen, die Ihre Liste erlaubt oder sperrt.',
    normalized: 'Normalisierte Eingaben ({{total}})', emptyTitle: 'Ihr Ergebnis erscheint hier',
    emptyDescription: 'Geben Sie Ihre Adressen ein, um das umfassende CIDR-Netz, seinen Adressbereich und die zusätzliche Abdeckung zu sehen.',
    explanationTitle: 'Die Abdeckung verstehen',
    explanation: 'Das längste mögliche Präfix ergibt den kleinsten einzelnen abdeckenden Bereich. Dieser Bereich kann Adressen außerhalb Ihrer ursprünglichen Eingaben enthalten. Überlappende Adressen werden nur einmal gezählt, und CIDR-Netze mit gesetzten Hostbits werden normalisiert.',
    countExplanation: 'Die Anzahl umfasst alle Adressen eines Bereichs, einschließlich Netzwerk- und Broadcast-Adressen. Prüfen Sie die zusätzliche Abdeckung, bevor Sie das Ergebnis in einer Liste erlaubter oder gesperrter Adressen verwenden.',
    examplesTitle: 'Beispiele für CIDR-Berechnungen', exactExample: 'Exakte IPv4-Abdeckung', expandedExample: 'IPv4 mit zusätzlicher Abdeckung', ipv6Example: 'Exakte IPv6-Abdeckung',
    limits: 'Geben Sie einzelne Adressen oder CIDR-Netze ein, bis zu {{maximum}} Einträge. IPv4 und IPv6 können nicht in einer Berechnung gemischt werden. IPv6-Adresszahlen bleiben auch für sehr große Bereiche exakt.',
    exampleResult: '{{cidr}} deckt {{covered}} Adressen ab und fügt {{additional}} hinzu.',
    line: 'Zeile {{line}}: {{message}}',
  },
  subtract: {
    title: 'CIDR-Subtraktion',
    description: 'Ziehe ausgeschlossene IPv4- oder IPv6-Netze vom eingeschlossenen Adressraum ab. Erhalte die kleinste exakte CIDR-Liste, ohne zusätzliche Adressen.',
    inputs: 'Deine Adresslisten',
    include: 'Einschließen',
    exclude: 'Ausschließen',
    includeLabel: 'Eingeschlossene IP-Adressen oder CIDRs',
    excludeLabel: 'Ausgeschlossene IP-Adressen oder CIDRs',
    includeHelp: 'Trenne Einträge durch Kommas, Leerzeichen, Tabulatoren oder Zeilenumbrüche. Schließe mindestens eine Adresse oder einen Bereich ein.',
    excludeHelp: 'Trenne Einträge durch Kommas, Leerzeichen, Tabulatoren oder Zeilenumbrüche. Leer lassen, um die eingeschlossene Liste zu vereinfachen, ohne Adressen zu entfernen.',
    calculate: 'CIDRs subtrahieren',
    result: 'Verbleibender Adressraum',
    output: 'Verbleibende CIDRs',
    included: 'Eingeschlossene Adressen',
    removed: 'Entfernte Adressen',
    remaining: 'Verbleibende Adressen',
    blocks: 'CIDRs im Ergebnis',
    copyList: 'Mit Zeilenumbrüchen kopieren',
    copyAllowed: 'Mit Kommas kopieren',
    copySuccess: 'Mit Zeilenumbrüchen kopiert.',
    allowedSuccess: 'Mit Kommas kopiert.',
    copyFailure: 'Kopieren ist nicht möglich. Wähle die Liste oben aus und kopiere sie.',
    formats: 'Zeilenumbrüche setzen jeden CIDR in eine eigene Zeile. Bei Kommas steht zwischen den CIDRs ein Komma und ein Leerzeichen.',
    emptyTitle: 'Keine Adressen verbleiben',
    emptyDescription: 'Die Ausschlüsse haben alle eingeschlossenen Adressen entfernt. Es gibt keine CIDR-Liste zum Kopieren.',
    pendingTitle: 'Dein Ergebnis erscheint hier',
    pendingDescription: 'Gib eine eingeschlossene Liste und optionale Ausschlüsse ein, um den exakten Rest zu berechnen.',
    explanationTitle: 'Was das Ergebnis bedeutet',
    explanation: 'Die Berechnung zieht die Vereinigung der Ausschlüsse von der Vereinigung der eingeschlossenen Bereiche ab. Überschneidungen werden einmal gezählt, Host-Bits werden normalisiert und keine Adressen hinzugefügt. Alle Adressen eines Bereichs zählen, einschließlich Netzwerk- und Broadcast-Adressen.',
    review: 'Nutze das Ergebnis für WireGuard-Ausnahmen oder um Lücken nach bekannten Zuweisungen zu prüfen. Die Lücken beziehen sich auf deine Eingaben; sie beweisen nicht, dass die Adressen im tatsächlichen Netzwerk ungenutzt sind. Prüfe die Liste vor der Anwendung.',
    limits: 'Verwende eine Adressfamilie und insgesamt höchstens {{inputs}} Einträge in beiden Listen, mit höchstens {{length}} Zeichen pro Eintrag. Ergebnisse dürfen bis zu {{outputs}} CIDRs enthalten; größere Ergebnisse liefern einen Fehler ohne Teilliste.',
    examplesTitle: 'Subtraktionsbeispiele',
    example: '{{exclude}} von {{include}} abziehen:',
    line: '{{list}}, Zeile {{line}}: {{message}}',
    listIssue: '{{list}}: {{message}}',
    outputLimitTitle: 'Das Ergebnis enthält zu viele CIDRs.',
  },
  ip: {
    title: 'Meine öffentliche IP-Adresse', description: 'Sehen Sie die öffentliche IP-Adresse Ihrer aktuellen Verbindung zu Packetrove.',
    online: 'Online-Abfrage · Die Anwendung speichert das Ergebnis nicht', connection: 'Ihre aktuelle Verbindung', checking: 'Öffentliche IP-Adresse wird abgefragt…',
    resultLabel: 'ÖFFENTLICHE IP-ADRESSE', copy: 'IP kopieren', copySuccess: 'IP-Adresse kopiert.',
    copyFailure: 'Die Zwischenablage ist nicht verfügbar. Markieren und kopieren Sie die IP-Adresse oben.', checkingButton: 'Abfrage läuft…', retry: 'Erneut versuchen', refresh: 'IP aktualisieren',
    explanationTitle: 'Was diese Adresse aussagt',
    explanation: 'Dies ist die Adresse, die Packetrove bei dieser Anfrage sieht. Wenn Sie ein VPN oder einen Proxy verwenden, ist es dessen Ausgangsadresse. Ihr Browser und Ihre Kommandozeilenwerkzeuge können unterschiedliche Netzwerkwege verwenden.',
    familyExplanation: 'Eine Verbindung verwendet entweder IPv4 oder IPv6. Diese Abfrage zeigt diese Adresse; sie ermittelt weder beide Adressfamilien noch Ihre private lokale Adresse. Aktualisieren Sie die Abfrage nach einem Netzwerkwechsel oder einer Änderung der Proxy-Einstellungen.',
  },
  api: {
    title: 'API-Dokumentation', loading: 'API-Dokumentation wird geladen…', specification: 'OpenAPI-Spezifikation',
    unavailableTitle: 'API-Dokumentation nicht verfügbar',
    unavailableDescription: 'Die Dokumentation konnte nicht geladen oder angezeigt werden. Sie können zum Rechner zurückkehren; Ihre Eingaben, das Ergebnis oder die Validierungsfehler bleiben erhalten.',
    returnToCalculator: 'Zum Rechner zurückkehren',
    description: 'Erkunden Sie die Endpunkte, kopieren Sie Anfragebeispiele und testen Sie die API ohne Konto oder API-Schlüssel. Beim Senden einer Anfrage werden deren Eingaben an die API übertragen. Abfragen der öffentlichen IP-Adresse zeigen die Verbindung Ihres Browsers.',
    englishReference: 'Die interaktive Referenz und die Spezifikation sind auf Englisch.',
    cidrSummary: 'Senden Sie IPv4- oder IPv6-Adressen und CIDR-Netze als JSON. Die Antwort enthält das kleinste umfassende CIDR-Netz, normalisierte Eingaben und exakte Adresszahlen als dezimale Zeichenfolgen. Diese API-Anfrage sendet Ihre Eingaben an den Server.',
    cidrResponse: 'Dieses Beispiel liefert {{cidr}} mit {{additional}} zusätzlichen Adressen. Prüfen Sie additionalAddressCount, bevor Sie das Ergebnis in einer Liste erlaubter oder gesperrter Adressen verwenden.',
    ipSummary: 'Liefert die öffentliche IP-Adresse dieser HTTP-Verbindung. Fordern Sie text/plain für eine Adresse mit anschließendem Zeilenumbruch oder application/json für Adresse und Adressfamilie an. Antworten werden nicht zwischengespeichert. Ein VPN oder Proxy verändert die beobachtete Ausgangsadresse.',
    subtractSummary: "Ziehe exclude exakt von include ab. Das Ergebnis enthält eine minimale kanonische CIDR-Liste und exakte Adresszahlen als Dezimalzeichenfolgen. Diese Anfrage sendet Eingaben an den Server.",
    subtractResponse: "Dieses Beispiel liefert {{cidrs}} mit {{remaining}} verbleibenden Adressen und ohne zusätzliche Abdeckung.",
  },
  discovery: {
    subtract: {
      title: "Fragen zur CIDR-Subtraktion",
      mcpTitle: "CIDR-Subtraktion über MCP verwenden",
      purpose: "Lass einen KI-Agenten ausgeschlossene Netze vom eingeschlossenen Adressraum abziehen und die exakten verbleibenden CIDRs zurückgeben.",
      inputs: "Übergib include und exclude als Arrays einer Adressfamilie. include darf nicht leer sein; exclude darf leer sein. Insgesamt höchstens {{maximumInputs}} Einträge mit je {{maximumLength}} Zeichen.",
      result: "Lies cidrs sowie includedAddressCount, removedAddressCount und remainingAddressCount als exakte Dezimalzeichenfolgen. Vollständige Entfernung liefert eine leere Liste. Mehr als {{maximumOutputs}} CIDRs führt zu einem Fehler ohne Teilliste.",
      boundary: "Remote-API- und MCP-Aufrufe senden Eingaben an den Server; der Browser rechnet lokal. Verbleibende Bereiche beziehen sich auf deine Eingaben und belegen keine tatsächliche Verfügbarkeit. WireGuard und Firewallregeln werden nicht verändert.",
      openTool: "Subtraktion im Browser öffnen",
      questions: {
        wireguard: {
          question: "Wie erstelle ich WireGuard-Ausnahmen für AllowedIPs?",
          answer: "Tragen Sie die gewünschten Tunnelbereiche unter Einschließen und die Ausnahmen unter Ausschließen ein. Mit Kommas kopieren liefert die exakten verbleibenden CIDRs als Wert für die WireGuard-Einstellung AllowedIPs. Prüfen Sie ihn vor der Anwendung; Packetrove konfiguriert weder WireGuard noch Routen."
        },
        remaining: {
          question: "Beweisen verbleibende Bereiche, dass Adressen ungenutzt sind?",
          answer: "Sie zeigen Lücken relativ zu Ihren Einschluss- und Ausschlusslisten. Das Werkzeug prüft keine tatsächliche Netznutzung und sucht keine Subnetze einer bestimmten Größe."
        },
        outside: {
          question: "Was geschieht mit überlappenden oder außerhalb liegenden Ausschlüssen?",
          answer: "Überschneidungen zählen auf jeder Seite einmal. Entfernt werden nur Adressen, die auch eingeschlossen sind; außerhalb liegende Ausschlüsse entfernen nichts. Vollständige Entfernung ist ein erfolgreiches Ergebnis mit einer leeren CIDR-Liste und null verbleibenden Adressen."
        },
        covering: {
          question: "Wie unterscheidet sich Subtraktion von einem abdeckenden CIDR?",
          answer: "Subtraktion erhält exakt die Vereinigung der eingeschlossenen Bereiche abzüglich der ausgeschlossenen Bereiche, einschließlich Lücken. Sie liefert eine minimale sortierte Liste kanonischer CIDRs ohne zusätzliche Adressen. Ein einzelnes abdeckendes CIDR kann zusätzliche Adressen enthalten."
        },
        access: {
          question: "Kann ich Subtraktion über MCP, Web-API oder CLI aufrufen?",
          answer: "Subtraktion ist auf der Website, über die Web-API und MCP verfügbar. Browsereingaben bleiben lokal; API und MCP senden sie an den Server. Die CLI bietet derzeit keine Subtraktion."
        }
      }
    },
    cidr: {
      title: "Fragen zu abdeckenden CIDR-Netzen",
      mcpTitle: "Den Rechner über MCP verwenden",
      purpose: "Lassen Sie einen KI-Agenten für eine ausgewählte Gruppe erlaubter oder gesperrter Firewall-Einträge ein abdeckendes CIDR-Netz berechnen und die zusätzliche Abdeckung erklären.",
      inputs: "Akzeptiert 1 bis {{maximumInputs}} IPv4- oder IPv6-Adressen oder CIDR-Bereiche mit höchstens {{maximumLength}} Zeichen pro Eintrag. Verwenden Sie nur eine Adressfamilie pro Aufruf.",
      result: "cidr und range beschreiben das abgedeckte Netz. Prüfen Sie additionalAddressCount vor der Verwendung in Firewall-Regeln. Alle Adressanzahlen sind Dezimalzeichenfolgen, damit IPv6-Werte exakt bleiben.",
      boundary: "Entfernte MCP-Aufrufe senden Ihre Eingaben an den Server. Der Webrechner arbeitet lokal. Dieses Werkzeug berechnet ein CIDR-Netz; mehrere Zusammenfassungen für das Eintragslimit einer ganzen Liste erfordern ein gesondertes Ziel. Es ändert keine Firewall-Regeln.",
      openTool: "Den Browserrechner öffnen",
      questions: {
        firewall: {
          question: "Wie reduziere ich Einträge in einer Firewall-IP-Liste?",
          answer: "Fassen Sie eine ausgewählte Gruppe zu einem abdeckenden CIDR-Netz zusammen. Prüfen Sie zusätzliche Adressen zuerst: Sie werden in einer Erlaubnisliste ebenfalls erlaubt oder in einer Sperrliste ebenfalls gesperrt."
        },
        covering: {
          question: "Erhält ein einzelnes CIDR-Netz genau die ursprünglichen Adressen?",
          answer: "Nur wenn die ursprüngliche Vereinigung dieses CIDR-Netz vollständig ausfüllt. Sonst fügt selbst das kleinste einzelne Netz Adressen hinzu. Packetrove zeigt die Erweiterung; es wählt keine optimale Kombination für die gesamte Liste."
        },
        overlap: {
          question: "Wie werden Überschneidungen und doppelte Eingaben gezählt?",
          answer: "Jede Adresse der ursprünglichen Vereinigung zählt einmal. CIDR-Netze mit Hostbits werden zur Netzadresse normalisiert. normalizedInputs behält doppelte Einträge, ohne die Adressanzahlen zu erhöhen."
        },
        counts: {
          question: "Sind auch sehr große IPv6-Adressanzahlen exakt?",
          answer: "Ja. Der Browser verwendet exakte Ganzzahlen, API und MCP liefern Dezimalzeichenfolgen. Gezählt werden alle von Regeln abgedeckten Adressen, einschließlich IPv4-Netz- und Broadcast-Adressen. Verwenden Sie eine Adressfamilie pro Berechnung."
        },
        privacy: {
          question: "Wohin gelangen meine Berechnungseingaben?",
          answer: "Der Webrechner arbeitet im Browser und sendet keine Eingaben an die API. Entwürfe bleiben im Arbeitsspeicher dieses Tabs. Die lokale CLI rechnet offline; Web-API und entferntes MCP senden Eingaben an den Server."
        }
      }
    },
    ip: {
      title: "Fragen zu Ihrer öffentlichen IP",
      mcpTitle: "Eine Verbindung über MCP prüfen",
      purpose: "Lassen Sie einen KI-Agenten die öffentliche IP prüfen, die für die Verbindung seines MCP-Werkzeugaufrufs beobachtet wird.",
      inputs: "Übergeben Sie ein leeres Objekt, {}. Das Werkzeug beobachtet die Verbindung der Anfrage und nimmt keine IP-Adresse zur Abfrage entgegen.",
      result: "Das Beispiel nutzt eine Dokumentationsadresse. Ein echter Aufruf liefert die beobachtete ip und family mit dem Wert ipv4 oder ipv6 für diese Anfrage.",
      boundary: "Ein gehosteter KI-Client kann seine eigene Ausgangsadresse liefern. Prüfen Sie Ihre Browserverbindung mit diesem Webwerkzeug oder die Terminalverbindung mit der CLI auf Ihrem Rechner. Ein Aufruf findet weder beide Familien noch private lokale Adressen oder die Adresse vor einem Proxy. Das Ergebnis ist kein Identitätsnachweis.",
      openTool: "Die öffentliche IP des Browsers prüfen",
      questions: {
        address: {
          question: "Welche IP-Adresse zeigt diese Seite?",
          answer: "Die öffentliche Adresse, die Packetrove für die aktuelle Browseranfrage beobachtet. Sie ist keine private lokale Adresse und identifiziert Ihr Gerät nicht."
        },
        vpn: {
          question: "Was ändert sich bei einem VPN oder Proxy?",
          answer: "Das Ergebnis zeigt die Ausgangsadresse dieser Verbindung. Aktualisieren Sie nach Änderungen am Netzwerk, VPN oder Proxy. Die Adresse vor dem Proxy wird nicht offengelegt."
        },
        family: {
          question: "Findet eine Abfrage IPv4 und IPv6 gleichzeitig?",
          answer: "Nein. Eine Anfrage beobachtet eine Adressfamilie. Eine erfolgreiche Abfrage belegt keine Verbindung über beide Familien."
        },
        client: {
          question: "Warum kann ein KI-Agent oder die CLI eine andere IP melden?",
          answer: "Jede Schnittstelle beobachtet die Verbindung ihrer Anfrage. Ein gehosteter MCP-Client kann ein anderes Netzwerk als Ihr Browser verwenden. Nutzen Sie das Webwerkzeug oder die CLI auf dem Netzwerkpfad, den Sie prüfen möchten."
        },
        privacy: {
          question: "Werden IP-Ergebnisse gespeichert oder zwischengespeichert?",
          answer: "Die Anwendung hält nur das aktuelle Ergebnis zur Anzeige im Arbeitsspeicher, ohne Abfrageverlauf oder Adressprotokolle. Ergebnisse und Fehler werden nicht zwischengespeichert. Die Hostingplattform verarbeitet die Anfrage weiterhin gemäß ihren Einstellungen."
        }
      }
    }
  },
  mcp: {
    title: "Packetrove mit einem KI-Agenten verbinden",
    explanation: "Verbinde einen kompatiblen MCP-Client, um die Netzwerkwerkzeuge von Packetrove zu verwenden. Beginne mit der Einrichtung und nutze anschließend die Beispiele.",
    connection: "Streamable HTTP · Kein Konto oder API-Schlüssel erforderlich",
    connectTitle: "Ihren Client verbinden",
    connectDescription: "Wenn Claude Code oder Codex installiert ist, fügen Sie diesen entfernten Server hinzu. Die Befehle konfigurieren den Client und installieren keinen lokalen Packetrove-Server.",
    clientGuide: "MCP-Dokumentation für {{client}}",
    check: "Prüfe die Verbindung im Client mit <code>/mcp</code>. Diese Werkzeuge müssen verfügbar sein: <code>{{tools}}</code>.",
    discovery: "Nach der Konfiguration entdeckt der Client Werkzeuge über tools/list. Beschreibungen und Schemas helfen bei Auswahl und Argumenten. Das Lesen einer Webseite konfiguriert keinen Client und gewährt keinen Werkzeugzugriff.",
    toolName: "Werkzeugname",
    arguments: "Beispielargumente",
    exampleResult: "Beispielergebnis mit Dokumentationsadressen",
    errorsTitle: "Ergebnisse lesen und Fehler behandeln",
    results: "Lesen Sie <code>structuredContent</code> oder das JSON im Textblock. Behalten Sie Adressanzahlen als Dezimalzeichenfolgen oder Ganzzahlen beliebiger Genauigkeit; große IPv6-Anzahlen verlieren bei der Umwandlung in Gleitkommazahlen Genauigkeit.",
    errors: "Wenn <code>isError</code> true ist, lesen Sie vor einem erneuten Versuch das Fehler-JSON. Korrigieren Sie <code>INVALID_INPUT</code> und <code>MIXED_ADDRESS_FAMILIES</code> anhand der Angaben des Nutzers. <code>CLIENT_IP_UNAVAILABLE</code> bedeutet, dass vertrauenswürdige Verbindungsmetadaten fehlen; erfinden Sie keine Adresse.",
    technicalGuide: "Die technische MCP-Anleitung im Repository lesen (Englisch)"
  },
  errors: {
    invalidInput: 'Ungültige Eingaben für die Berechnung.', mixedFamilies: 'Verwenden Sie innerhalb einer Berechnung nur IPv4 oder nur IPv6.',
    invalidJson: 'Die Anfrage muss gültiges JSON enthalten.', payloadTooLarge: 'Die Anfrage ist zu groß.', unsupportedMediaType: 'Der Inhaltstyp der Anfrage wird nicht unterstützt.',
    notFound: 'Die angeforderte Ressource existiert nicht.', methodNotAllowed: 'Diese Anfragemethode wird nicht unterstützt.',
    internal: 'Der Vorgang konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.', ipUnavailable: 'Die Verbindungsmetadaten sind nicht verfügbar. Bitte versuchen Sie es erneut.',
    network: 'Der Dienst zur IP-Abfrage ist nicht erreichbar. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.', invalidResponse: 'Der Dienst zur IP-Abfrage hat eine ungültige Antwort geliefert. Bitte versuchen Sie es erneut.',
    invalidAddress: 'Verwenden Sie eine standardmäßige IPv4- oder IPv6-Adresse mit einem optionalen gültigen CIDR-Präfix. Zonenkennungen und führende Nullen in IPv4-Adressen werden nicht unterstützt.',
    emptyInputs: 'Geben Sie mindestens eine IP-Adresse oder ein CIDR-Netz ein.', tooManyInputs: 'Verwenden Sie höchstens {{limit}} Einträge pro Berechnung.',
    inputTooLong: 'Jeder Eintrag darf höchstens {{limit}} Zeichen enthalten.', expectedFamily: 'Verwenden Sie {{family}}, passend zur ersten Eingabe.',
    tooManyOutputs: 'Das vollständige Ergebnis überschreitet {{limit}} CIDRs. Verwende weniger Ausschlüsse oder kleinere eingeschlossene Bereiche. Es wird kein Teilergebnis zurückgegeben.',
  },
  meta: {
    mcp: {"title": "Packetrove MCP-Anleitung — CIDR und öffentliche IP", "description": "Verbinde Claude Code oder Codex über MCP mit Packetrove. Erfahre mehr über Argumente, exakte CIDR-Ergebnisse, IP-Verbindungsgrenzen und Fehlerbehandlung ohne API-Schlüssel."},
    home: { title: 'Packetrove — CIDR-Rechner und öffentliche IP-Abfrage', description: 'Berechnen Sie umfassende CIDR-Netze lokal im Browser und prüfen Sie Ihre öffentliche IP-Adresse. Open-Source-Werkzeuge für IPv4 und IPv6 über Web, API, CLI und MCP, ohne Konto.' },
    cidr: { title: 'Rechner für das kleinste umfassende CIDR-Netz — Packetrove', description: 'Finden Sie das kleinste einzelne CIDR-Netz für IPv4- oder IPv6-Adressen und Bereiche. Berechnen Sie es im Browser mit exakten Adresszahlen, zusätzlicher Abdeckung und Beispielen.' },
    subtract: { title: 'CIDR-Subtraktionsrechner — Packetrove', description: 'Subtrahiere IPv4- oder IPv6-CIDR-Listen lokal im Browser. Kopiere eine exakte minimale Liste für WireGuard AllowedIPs oder prüfe den verbleibenden Adressraum nach bekannten Zuweisungen.' },
    ip: { title: 'Wie lautet meine IP? Öffentliche IP-Abfrage — Packetrove', description: 'Prüfen Sie die öffentliche IPv4- oder IPv6-Adresse Ihrer Verbindung und verstehen Sie VPN- und Proxy-Ausgangsadressen, ohne Konto.' },
    api: { title: 'Packetrove-API — CIDR und öffentliche IP-Adresse', description: 'Berechnen Sie umfassende CIDR-Netze und prüfen Sie öffentliche IP-Adressen mit der Packetrove-API. Kopieren Sie curl-Beispiele und erkunden Sie die OpenAPI-Referenz ohne API-Schlüssel.' },
    notFound: { title: 'Seite nicht gefunden — Packetrove', description: 'Diese Packetrove-Seite existiert nicht. Kehren Sie zur Startseite zurück, um die Netzwerkwerkzeuge zu verwenden.' },
    imageAlt: 'Packetrove-Würfellogo neben dem Projektnamen und dem englischen Slogan Network tools for humans and agents.',
  },
} satisfies TranslationResource;
