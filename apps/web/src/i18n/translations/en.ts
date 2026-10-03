export const en = {
  common: {
    pageLoading: "Loading page…", pageLoadFailure: "This page could not be loaded. Please try again.", retryPage: "Retry",
    home: 'Home', homeLabel: 'Packetrove home', navigation: 'Main navigation',
    language: 'Language', tools: 'IP ADDRESS TOOLS', copied: 'Copied', dismissCopy: 'Dismiss copy error',
    tagline: 'Network tools for humans and agents',
    source: 'View Packetrove on GitHub', sourceCommit: 'View source for commit {{commit}} on GitHub', sourceLicense: 'Source code: MIT',
    feedbackPrompt: 'Found a bug or have an idea? Tell us on GitHub.', reportBug: 'Report a bug', requestFeature: 'Request a feature',
    notFound: 'Page not found', notFoundDescription: 'The page you requested does not exist.', returnHome: 'Return to home',
  },
  languageSuggestion: {
    title: 'Would you like to read this page in English?',
    switch: 'Switch to English', dismiss: 'Not now',
  },
  "support": {
    "title": "Support",
    "introduction": "Get help with the Packetrove website, Web API, CLI, and remote MCP connection. No account or API key is required.",
    "contactTitle": "Contact the maintainer",
    "contactBody": "The individual maintainer reads the email below. Use email for private support, privacy requests, or security reports. Support is provided as time permits, without a guaranteed response time.",
    "publicTitle": "Public feedback",
    "publicBody": "Report reproducible bugs or suggest features on GitHub. Issues and attachments are public. Do not include credentials, actual public-IP lookup results, or private network data.",
    "detailsTitle": "Help us reproduce the problem",
    "detailsBody": "Describe the tool and interface, browser or client version, steps, expected result, and actual result or error code. Use synthetic inputs and remove secrets from logs and screenshots.",
    "guidesTitle": "Connection guides and privacy",
    "guidesBody": "Check the API and MCP guides for connection and input details. The CLI guide is in English. The privacy policy explains remote processing and support correspondence."
  },
  "terms": {
    "title": "Terms of Service",
    "updated": "Last updated: October 4, 2026.",
    "introduction": "These terms apply to the Packetrove hosted website, Web API, and remote MCP service, operated by its individual maintainer. By using the hosted service, you agree to these terms.",
    "sections": {
      "use": {
        "title": "Acceptable use",
        "body": "Use the service lawfully and only with data you are authorized to process. Respect documented input limits. Do not disrupt the service, bypass security controls, or send credentials or secrets as tool inputs."
      },
      "results": {
        "title": "Check results before use",
        "body": "You are responsible for reviewing results before applying them to a network. A covering CIDR may add addresses; calculated gaps do not prove live availability. Public-IP lookup observes the calling connection, which may be an AI client's exit address. Packetrove does not configure networks or firewall rules."
      },
      "availability": {
        "title": "Availability and responsibility",
        "body": "The hosted service is provided as is and as available, without guaranteed availability, accuracy, or suitability. It may change, be limited, or stop. To the extent permitted by law, the maintainer is not liable for losses arising from its use. These terms do not exclude rights or liabilities that applicable law does not allow to be excluded."
      },
      "license": {
        "title": "Open source license",
        "body": "Packetrove source code, including the CLI, remains available under the MIT License. These hosted-service terms do not change the permissions or notices in that license. Third-party components retain their own licenses."
      },
      "privacy": {
        "title": "Privacy and other services",
        "body": "The Privacy Policy explains Packetrove's data processing. AI clients, GitHub, and other services you choose to use have their own terms and privacy policies."
      },
      "changes": {
        "title": "Changes to these terms",
        "body": "Revisions are published on this page with an updated date and apply to subsequent use of the hosted service. If you do not agree to a revision, stop using the hosted service."
      }
    },
    "contactTitle": "Questions",
    "contactBody": "Contact the Packetrove maintainer about these terms or use the support page for help."
  },
  privacy: {
    "title": "Privacy Policy",
    "updated": "Last updated: October 4, 2026.",
    "introduction": "This policy covers the Packetrove website, Web API, CLI, and remote MCP service, including AI plugin use. Packetrove is maintained by Liu Yue. No account or API key is required.",
    "cloudflarePolicy": "Cloudflare Privacy Policy",
    "sections": {
        "correspondence": {
          "title": "Support correspondence",
          "body": "If you email us, we receive your email address, any name you provide, and your message. The individual maintainer uses these details to answer and follow up on your request. Support correspondence is generally retained long term, without a fixed expiry; contact us to request deletion. Email is held in the mail service. GitHub issue reports and their public history are held by GitHub and follow its retention controls."
        },
        "local": {
            "title": "Local calculations and browser storage",
            "body": "Browser calculations and offline CLI calculations keep inputs and results on your device. Calculator drafts stay in page memory. The website stores only a handled-language-suggestion flag in sessionStorage for the current tab; it does not store addresses or results there. Copying a result puts it on your system clipboard."
        },
        "remote": {
            "title": "Remote tool inputs and results",
            "body": "API and remote MCP calculations send the supplied IP addresses, CIDRs, or range endpoints to Packetrove. We process them in memory to return the result, without a database or retained calculation history. We do not request conversation history or account credentials. The calling client receives the result and may retain it under its own policies."
        },
        "connection": {
            "title": "Public IP checks",
            "body": "A public-IP check reads Cloudflare-provided connection information and returns one observed address. The application does not retain lookup history or log the returned IP. A hosted AI client may observe its own exit address; use your browser or a local CLI to inspect your device connection."
        },
        "logs": {
            "title": "Application operational logs",
            "body": "Completed MCP tool callbacks emit an operational event with a fixed event name, the tool name, success or error, and a controlled error code on failure. We use these events to count tool executions and diagnose errors. Retries count separately; discovery and requests rejected before a tool callback are not included. Unexpected HTTP failures emit a fixed event and error code. These application-generated events contain no inputs, results, returned IP addresses, headers, or raw exception details. We do not build user profiles, track users across sites, sell tool data, use it for advertising, or train models with it."
        },
        "providers": {
            "title": "Hosting, recipients, and retention",
            "body": "Cloudflare hosts the service and processes requests, including connection addresses, headers, and remote tool arguments. Platform logs may add timestamps, URLs, request identifiers, and technical metadata. Operator-accessible Workers Logs, when enabled, remain queryable for up to seven days: currently three days on Free, with seven days announced from December 1, 2026. This does not promise deletion of all Cloudflare network or security records within seven days. Cloudflare infrastructure processing follows its own policy and may occur outside your country. Packetrove maintainers can access enabled operational logs to diagnose the service."
        },
        "controls": {
            "title": "Your choices",
            "body": "Use browser calculations or offline CLI calculations to avoid submitting calculation inputs remotely. Public-IP checks still require a network request. Disable the plugin or remove the MCP connection to stop future calls; this does not delete results already held by your AI client. We do not provide an account-linked call history or a per-call logging opt-out."
        },
        "contact": {
            "title": "Privacy questions and requests",
            "body": "Contact the maintainer using the email below for privacy questions and applicable access or deletion requests. Because tool calls are not linked to an account, we may be unable to identify an individual call. Optional email and GitHub communications remain in those services and use their retention controls. Public GitHub issues should not contain private network data or secrets. Policy changes are published on this page."
        }
    }
},
  footer: {
    project: 'Project Resources', integrations: 'Integrations', contact: 'Contact & Feedback',
    apiDocumentation: 'API Documentation', cliGuide: 'CLI Guide', sendEmail: 'Send an email',
  },
  home: {
    rangeDescription: "Convert inclusive start and end IP addresses into the minimal exact CIDR list. Calculate locally and copy every block without adding addresses.",
    rangeLink: "Open IP range converter",
    galleryTitle: "Explore the tools",
    galleryDescription: "Use the arrows or swipe through the example previews, then open the tool you need.",
    galleryPrevious: "Previous tool",
    galleryNext: "Next tool",
    galleryPosition: "{{current}} of {{total}}",
    previewLabel: "Example",
    previewInputs: "Example inputs",
    ipPreview: "Documentation address only. Open the tool to check your connection.",
    integrationsTitle: "Use Packetrove in your workflow",
    apiIntroduction: "Call the tools from an HTTP client using shared JSON contracts.",
    cliIntroduction: "Calculate covering CIDRs locally or check the connection from your terminal.",
    description: 'Open source network utilities for your browser, terminal, and AI agents. Use the navigation to open a tool, or connect Packetrove to your own workflow below.',
    openSource: 'Open source', anonymous: 'No account or API key required',
    cidrDescription: 'Find the smallest single CIDR covering IPv4 or IPv6 addresses and ranges. Calculate locally in your browser, with exact address counts and a clear explanation of any extra coverage.',
    cidrLink: 'Open CIDR calculator',
    subtractDescription: 'Remove excluded networks from your included address space. Copy an exact CIDR list for WireGuard exceptions or inspect gaps after known allocations, without uploading your inputs.',
    subtractLink: 'Open CIDR subtraction',
    ipDescription: 'Check the public IP used by your connection. If you use a VPN or proxy, the result shows its exit address; it does not reveal your private local address.',
    ipLink: 'Check my public IP',
    apiTitle: 'Web API', apiDescription: 'Call Packetrove from any HTTP client. For example, get your current public IP with curl:',
    apiResponse: 'The response is the IP address followed by a newline, with <code>Content-Type: text/plain</code>.', apiGuide: 'Read the API guide',
    cliTitle: 'Command-line interface', cliDescription: 'Install from source with Node.js and pnpm:',
    cliExample: 'Then print your current public IP:', cliGuide: 'Read the CLI guide',
    mcpTitle: 'Model Context Protocol', mcpDescription: 'Connect your AI agent to Packetrove over Streamable HTTP. No authentication or local server is needed.',
    serverAddress: 'Server address', mcpExample: 'With your client installed, add the server:',
    mcpCheck: 'Use <code>/mcp</code> in your client to check the connection. Public IP checks observe the connection used by the agent.', mcpGuide: "Read the MCP connection guide",
  },
  cidr: {
    title: 'Smallest Covering CIDR', description: 'Combine IPv4 or IPv6 addresses and ranges into the smallest single CIDR that covers them all.',
    local: 'Calculated in your browser · No API request', addresses: 'Your addresses', inputLabel: 'IP addresses or CIDR ranges',
    inputHelp: 'Separate entries with commas, spaces, tabs, or line breaks. Use one address family per calculation. Up to {{maximum}} entries.',
    entryCount_one: '{{total}} entry', entryCount_other: '{{total}} entries', clear: 'Clear', example: 'Try an example', calculate: 'Calculate covering CIDR',
    result: 'Coverage result', resultLabel: 'SMALLEST COVERING CIDR', copy: 'Copy CIDR',
    copySuccess: 'CIDR copied.', copyFailure: 'Copy is unavailable. Select and copy the CIDR above.',
    first: 'First address', last: 'Last address', unique: 'Unique input addresses', covered: 'Covered addresses', additional: 'Additional addresses',
    exact: 'Exact coverage: this CIDR adds no addresses.',
    expansion: 'Applying this CIDR expands the range of addresses allowed or blocked by your list.',
    normalized: 'Normalized inputs ({{total}})', emptyTitle: 'Your result will appear here',
    emptyDescription: 'Enter your addresses to see their covering CIDR, address range, and any extra coverage.',
    explanationTitle: 'Understand the coverage',
    explanation: 'The longest possible prefix gives the smallest single covering range. That range can include addresses outside your original entries. Overlapping entries are counted once, and CIDRs with host bits are normalized.',
    countExplanation: 'Counts include every address in a range, including network and broadcast addresses. Review additional coverage before using a result in an allowlist or blocklist.',
    examplesTitle: 'CIDR calculation examples', exactExample: 'Exact IPv4 coverage', expandedExample: 'IPv4 with extra coverage', ipv6Example: 'Exact IPv6 coverage',
    limits: 'Enter individual addresses or CIDR ranges, with up to {{maximum}} entries. IPv4 and IPv6 cannot be mixed in one calculation. IPv6 address counts remain exact, even for very large ranges.',
    exampleResult: '{{cidr}} covers {{covered}} addresses and adds {{additional}}.',
    line: 'Line {{line}}: {{message}}',
    lineEntry: 'Line {{line}}, item {{entry}}: {{message}}',
  },
  subtract: {
    title: 'CIDR Subtraction', description: 'Subtract excluded IPv4 or IPv6 networks from your included address space. Get the smallest exact CIDR list, with no added addresses.',
    normalizedInclude: "Normalized include inputs ({{total}})",
    normalizedExclude: "Normalized exclude inputs ({{total}})",
    normalizedHelp: "Each entry is normalized separately. Input order, repeated entries, and nested ranges are preserved.",
    noExcludedInputs: "No excluded inputs.",
    inputs: 'Your address lists', include: 'Include', exclude: 'Exclude',
    includeLabel: 'Included IP addresses or CIDRs', excludeLabel: 'Excluded IP addresses or CIDRs',
    includeHelp: 'Separate entries with commas, spaces, tabs, or line breaks. Include at least one address or range.',
    excludeHelp: 'Separate entries with commas, spaces, tabs, or line breaks. Leave empty to simplify the include list without removing addresses.',
    calculate: 'Subtract CIDRs', result: 'Remaining address space', output: 'Remaining CIDRs',
    included: 'Included addresses', removed: 'Addresses removed', remaining: 'Remaining addresses', blocks: 'Result CIDRs',
    completed: 'Calculation complete. Remaining addresses: {{addresses}}. CIDRs: {{cidrs}}.',
    copyList: 'Copy with newlines', copyAllowed: 'Copy with commas', copySuccess: 'Copied with newlines.', allowedSuccess: 'Copied with commas.',
    copyFailure: 'Copy is unavailable. Select and copy the list above.',
    formats: 'Newlines put one CIDR on each line. Commas separate CIDRs with a comma and a space.',
    emptyTitle: 'No addresses remain', emptyDescription: 'The exclusions removed every included address. There is no CIDR list to copy.',
    pendingTitle: 'Your result will appear here', pendingDescription: 'Enter an include list and optional exclusions to calculate the exact remainder.',
    explanationTitle: 'What the result means',
    explanation: 'The calculation subtracts the union of exclusions from the union of included ranges. Overlaps count once, host bits are normalized, and no addresses are added. All addresses in a range count, including network and broadcast addresses.',
    review: 'Use the result for WireGuard exceptions or to inspect gaps after known allocations. Gaps are relative to your inputs; they do not prove addresses are unused on the live network. Review the list before applying it.',
    limits: 'Use one address family and at most {{inputs}} entries across both lists, with at most {{length}} characters per entry. Results may contain up to {{outputs}} CIDRs; larger results return an error with no partial list.',
    examplesTitle: 'Subtraction examples', example: 'Remove {{exclude}} from {{include}}:',
    line: '{{list}}, line {{line}}: {{message}}', listIssue: '{{list}}: {{message}}',
    lineEntry: '{{list}}, line {{line}}, item {{entry}}: {{message}}',
    outputLimitTitle: 'The result contains too many CIDRs.',
  },
  range: {
    "title": "IP Range to CIDRs",
    "description": "Convert one inclusive IPv4 or IPv6 start/end range into the smallest exact CIDR list, without adding addresses.",
    "inputs": "Your IP range",
    "start": "Start IP",
    "end": "End IP",
    "startHelp": "First included address. Enter one IPv4 or IPv6 address without a CIDR prefix (up to 64 characters).",
    "endHelp": "Last included address. Use the same family and an address at or after Start IP (up to 64 characters).",
    "calculate": "Convert range to CIDRs",
    "result": "Exact range result",
    "output": "Exact CIDR list",
    "addresses": "Addresses in range",
    "completed": "Calculation complete. Addresses: {{addresses}}. CIDRs: {{cidrs}}.",
    "pendingDescription": "Enter both inclusive endpoints to see their exact CIDR list and address count.",
    "explanation": "Both endpoints are included. The result is the minimal sorted CIDR list covering exactly this range, with no gaps, overlaps, or added addresses. A single covering CIDR can include addresses outside the range. Counts include every address, including IPv4 network and broadcast addresses, and remain exact for large IPv6 ranges.",
    "examplesTitle": "IP range examples",
    "example": "Inclusive range: {{start}} through {{end}}.",
    "issue": "{{field}}: {{message}}",
    "emptyEndpoint": "Enter one IPv4 or IPv6 address.",
    "invalidEndpoint": "Use a standard IPv4 or IPv6 address without a CIDR prefix. Zone identifiers and IPv4 leading zeros are not supported.",
    "endpointCidr": "Enter an IP address without a CIDR prefix.",
    "reversedRange": "Enter an end IP at or after the start IP. Endpoints are not automatically swapped.",
    "expectedFamily": "Use {{family}} to match the start IP."
  },
  ip: {
    title: 'My Public IP', description: 'See the public IP address used by your current connection to Packetrove.',
    online: 'Checked online · Not stored by the application', connection: 'Your current connection', checking: 'Checking your public IP…',
    resultLabel: 'PUBLIC IP ADDRESS', copy: 'Copy IP', copySuccess: 'IP address copied.',
    copyFailure: 'Copy is unavailable. Select and copy the IP address above.', checkingButton: 'Checking…', retry: 'Try again', refresh: 'Refresh IP',
    explanationTitle: 'What this address tells you',
    explanation: "This is the address seen by Packetrove for this request. If you use a VPN or proxy, it is the exit address. Your browser and command-line tools can use different network paths.",
    familyExplanation: 'A connection uses either IPv4 or IPv6. This check shows that address; it does not discover both families or your private local address. Refresh after changing networks or proxy settings.',
  },
  api: {
    examplesTitle: 'Endpoint summaries and examples',
    rangeSummary: "Submit start and end IP addresses from one family. Both endpoints are inclusive. Return canonical endpoints, the minimal exact CIDR list, a CIDR count, and a decimal-string address count. This request sends inputs to the server.",
    rangeResponse: "This example returns {{cidrs}}, representing exactly {{addresses}} addresses.",
    title: 'API documentation', loading: 'Loading API documentation…', specification: 'OpenAPI specification',
    unavailableTitle: 'API documentation is unavailable',
    unavailableDescription: 'The documentation could not be loaded or displayed. You can return to the calculator with your input, result, or validation errors preserved.',
    returnToCalculator: 'Return to the calculator',
    description: "Explore the endpoints, copy request examples, and try the API without an account or API key. Sending a request submits its inputs to the API. Public IP checks observe your browser's connection.",
    englishReference: 'The interactive reference and specification are in English.',
    cidrSummary: 'Submit IPv4 or IPv6 addresses and CIDR ranges as JSON. The response includes the smallest covering CIDR, normalized inputs, and exact address counts as decimal strings. This API request sends your inputs to the server.',
    cidrResponse: 'This example returns {{cidr}} with {{additional}} additional addresses. Check additionalAddressCount before using the result in an allowlist or blocklist.',
    ipSummary: 'Return the public IP observed for this HTTP connection. Request text/plain for a single address followed by a newline, or application/json for an address and family. Responses are not cached. A VPN or proxy changes the observed exit address.',
    subtractSummary: "Subtract the exclude list from the include list exactly. Return a minimal canonical CIDR list and exact decimal-string address counts. This API request sends your inputs to the server.",
    subtractResponse: "This example returns {{cidrs}}, with {{remaining}} remaining addresses and no additional coverage.",
  },
  discovery: {
    range: {
      "title": "Questions about IP range conversion",
      "mcpTitle": "Convert IP ranges through MCP",
      "purpose": "Ask an AI agent to represent one inclusive start/end IP range as its minimal exact CIDR list.",
      "inputs": "Pass start and end as IPv4 or IPv6 addresses from the same family, without CIDR prefixes, up to {{maximumLength}} characters each. End must be at or after start.",
      "result": "Read canonical range.first and range.last, sorted cidrs, cidrCount, and exact decimal-string addressCount. Equal endpoints produce one /32 or /128; a complete address space produces /0. Errors identify the start or end field.",
      "boundary": "The browser calculates locally. API and remote MCP calls submit endpoints to the server. The tool does not inspect live allocation or change firewall, routing, or VPN configuration. CLI range conversion is not available.",
      "openTool": "Open browser range conversion",
      "questions": {
        "exact": {
          "question": "How does this differ from a single covering CIDR?",
          "answer": "This list contains exactly the inclusive range, with no additional addresses. A single covering CIDR can include addresses before the start or after the end. Use exact conversion when an allowlist must match the supplied range."
        },
        "order": {
          "question": "Can I use equal or reversed endpoints?",
          "answer": "Equal endpoints return one host CIDR: /32 for IPv4 or /128 for IPv6. Reversed endpoints are rejected and never silently swapped. Both endpoints must be IP addresses of the same family, without CIDR prefixes."
        },
        "counts": {
          "question": "Which addresses are counted?",
          "answer": "Every address between the endpoints counts, including both endpoints and IPv4 network and broadcast addresses. Counts remain exact even across the complete IPv6 address space; addresses are not individually enumerated."
        },
        "privacy": {
          "question": "Where do my endpoints go?",
          "answer": "Browser calculations stay in memory on your device, without uploads, persistence, logging, or input-bearing URLs. Web API and remote MCP calls send endpoints to the server. This operation is available on the website, Web API, and MCP."
        }
      }
    },
    subtract: {
      title: "Questions about CIDR subtraction",
      mcpTitle: "Use subtraction through MCP",
      purpose: "Ask an AI agent to subtract excluded networks from included address space and return the exact remaining CIDRs.",
      inputs: "Pass include and exclude arrays from one address family. Include must be nonempty; exclude may be empty. Use at most {{maximumInputs}} entries across both lists, with at most {{maximumLength}} characters each.",
      result: "Read cidrs and the exact decimal-string includedAddressCount, removedAddressCount, and remainingAddressCount. Complete removal returns an empty list. Results exceeding {{maximumOutputs}} CIDRs fail without a partial list.",
      boundary: "Remote API and MCP calls send inputs to the server; the browser calculates locally. Remaining ranges are relative to your inputs and do not prove live availability. The tool does not configure WireGuard or change firewall rules.",
      openTool: "Open browser subtraction",
      questions: {
        wireguard: {
          question: "How do I prepare WireGuard AllowedIPs exceptions?",
          answer: "Put the intended tunnel ranges in Include and the exceptions in Exclude. Use Copy with commas to copy the exact remaining CIDRs as the value for the WireGuard AllowedIPs setting. Review it before applying; Packetrove does not configure WireGuard or change routes."
        },
        remaining: {
          question: "Do remaining ranges prove that addresses are unused?",
          answer: "They show gaps relative to your include and exclude lists. The tool does not inspect live network usage or find subnets of a requested size."
        },
        outside: {
          question: "What happens to overlapping or out-of-range exclusions?",
          answer: "Overlaps on each side count once. Only addresses also present in Include are removed; exclusions outside it remove nothing. Complete removal succeeds with an empty CIDR list and zero remaining addresses."
        },
        covering: {
          question: "How does subtraction differ from a covering CIDR?",
          answer: "Subtraction preserves the exact remainder of union(include) minus union(exclude), including gaps. It returns a minimal sorted list of canonical CIDRs without adding addresses. A single covering CIDR can include extra addresses."
        },
        access: {
          question: "Can I call subtraction through MCP, the Web API, or CLI?",
          answer: "Subtraction is available on the website, Web API, and MCP. Browser inputs stay local; API and MCP calls send inputs to the server. The CLI does not currently expose subtraction."
        }
      }
    },
    cidr: {
      title: "Questions about covering CIDRs",
      mcpTitle: "Use this calculator through MCP",
      purpose: "Ask an AI agent to calculate one covering CIDR for a selected group of firewall allowlist or blocklist entries and explain the extra coverage.",
      inputs: "Accept 1 to {{maximumInputs}} IPv4 or IPv6 addresses or CIDRs, up to {{maximumLength}} characters each. Use one address family per call.",
      result: "Read cidr and range for the covered network. Check additionalAddressCount before using it in firewall rules. All address counts are decimal strings so IPv6 values stay exact.",
      boundary: "Remote MCP calls send your inputs to the server. The browser calculator runs locally. This tool calculates one CIDR; choosing several merges to meet a whole-list entry limit requires a separate decision. It never changes firewall rules.",
      openTool: "Open the browser calculator",
      questions: {
        firewall: {
          question: "How can I reduce entries in a firewall IP list?",
          answer: "Combine a selected group into one covering CIDR. Review the additional addresses first: they become allowed in an allowlist or blocked in a blocklist."
        },
        covering: {
          question: "Does one covering CIDR preserve exactly the original addresses?",
          answer: "Only when the original union fills that CIDR. Otherwise the smallest single covering CIDR adds addresses. Packetrove shows that expansion; it does not choose the best combination of merges for an entire list."
        },
        overlap: {
          question: "How are overlaps and duplicate inputs counted?",
          answer: "Each address in the original union counts once. CIDRs with host bits are normalized to their network address. Duplicate entries remain in normalizedInputs but do not inflate address counts."
        },
        counts: {
          question: "Can IPv6 counts be trusted for very large ranges?",
          answer: "Yes. The browser uses exact integers, and API and MCP counts are decimal strings. Counts include all addresses covered by firewall rules, including IPv4 network and broadcast addresses. Use one address family per calculation."
        },
        privacy: {
          question: "Where do my calculation inputs go?",
          answer: "The web calculator runs in your browser without sending inputs to the API. Drafts stay in this tab’s memory. The local CLI calculates offline; Web API and remote MCP calls submit inputs to the server."
        }
      }
    },
    ip: {
      title: "Questions about your public IP",
      mcpTitle: "Inspect a connection through MCP",
      purpose: "Ask an AI agent to inspect the public IP observed for the connection making its MCP tool call.",
      inputs: "Pass an empty object, {}. The tool observes the request connection; it does not accept an IP address to look up.",
      result: "The example uses a documentation address. A real call returns the observed ip and its family, either ipv4 or ipv6, for that request.",
      boundary: "A hosted AI client can return its own exit address. To inspect your browser connection, use this web tool; to inspect your computer’s command-line connection, run the CLI on that computer. One call does not discover both families, private local addresses, or an address before a proxy. The result is not an identity proof.",
      openTool: "Check my browser’s public IP",
      questions: {
        address: {
          question: "Which IP address does this page show?",
          answer: "The public address observed for your browser’s current request to Packetrove. It is not your private local address and does not identify your device."
        },
        vpn: {
          question: "What changes when I use a VPN or proxy?",
          answer: "The result shows the exit address used by that connection. Refresh after changing networks, VPNs, or proxy settings. It does not reveal an address before the proxy."
        },
        family: {
          question: "Does a check discover both IPv4 and IPv6?",
          answer: "No. One request observes one address family. A successful check does not establish connectivity in both IPv4 and IPv6."
        },
        client: {
          question: "Why can an AI agent or CLI report a different IP?",
          answer: "Each interface observes the connection making its request. A hosted MCP client may use a different network from your browser. Run the web tool or CLI on the network path you want to inspect."
        },
        privacy: {
          question: "Are IP results stored or cached?",
          answer: "The application keeps the current result in memory for display, without lookup history or address logging. Results and errors are not cached. The hosting platform still processes the request under its settings."
        }
      }
    }
  },
  mcp: {
    navigation: "MCP Guide",
    sdkTitle: "Run a Node.js example",
    sdkDescription: "In a new directory, save the code below as <code>packetrove-example.mjs</code>, then run the commands. The example uses <code>@modelcontextprotocol/client@{{version}}</code>, discovers tools, and calls the covering-CIDR tool with documentation addresses.",
    sdkLocal: "For local development, start <code>pnpm dev:api</code> and replace the server URL in the example with <code>{{localUrl}}</code>.",
    httpErrors: "Business errors use the shared error JSON. The MCP SDK handles protocol validation errors. Invalid JSON, unsupported media types, and oversized bodies are rejected at the HTTP boundary.",
    deploymentTitle: "Deployment and connection limits",
    serverBehavior: "The server supports modern stateless requests and legacy Streamable HTTP initialization, discovery, and calls. It does not provide persistent sessions or standalone server event streams.",
    operationalLogging: "We count tool executions using operational events containing the tool name, success or error, and a controlled error code. These events exclude inputs, results, and lookup addresses. Cloudflare may add request metadata; see the privacy policy for processing and retention.",
    connectionPrivacy: "Public IP metadata is read for each tool-call request, with isolated server instances for concurrent clients. MCP results and errors use Cache-Control: no-store, no-transform. The application does not retain or log lookup addresses.",
    toolMigration: "Previous tool names have no compatibility aliases: {{toolRenames}}. Refresh tool discovery and update saved calls.",
    endpointMigration: "The website’s <code>/mcp</code> path is not the service endpoint: GET returns 404 and POST returns 405, without proxying or redirecting tool calls. Configure clients with <code>{{serverUrl}}</code>. For your own deployment, update the domains and separate exact Host and browser Origin allowlists; non-browser clients without an Origin header are supported.",
    deploymentGuide: "Deployment, self-hosting, and production verification",
    registryGuide: "MCP Registry publication and version policy",
    title: "Connect Packetrove to an AI agent",
    explanation: "Connect a compatible MCP client to use Packetrove network tools. Start with the setup below, then use the tool examples.",
    connection: "Streamable HTTP · No account or API key required",
    connectTitle: "Connect your client",
    connectDescription: "With Claude Code or Codex installed, add this remote server. These commands configure the client; they do not install a local Packetrove server.",
    clientGuide: "{{client}} MCP documentation",
    check: "Use <code>/mcp</code> in your client to inspect the connection. Confirm that these tools are available: <code>{{tools}}</code>.",
    discovery: "After configuration, the client discovers available tools with tools/list. Tool descriptions and schemas guide selection and arguments. Reading a web page does not configure a client or grant it tool access.",
    identityTitle: "Server identity",
    identityExplanation: "The server advertises the following service identity, with its release version. Individual tool names, descriptions, and schemas are listed separately through tools/list.",
    identityPresentation: "Clients decide whether to display the title, description, website, or icon and may ignore optional fields. Successful protocol discovery does not prove that a client renders this information. The PNG icon is 32×32 and has no theme restriction.",
    toolName: "Tool name",
    arguments: "Example arguments",
    exampleResult: "Example result using documentation addresses",
    errorsTitle: "Read results and handle errors",
    results: "Read <code>structuredContent</code>, or the JSON in the text content block. Keep address counts as decimal strings or arbitrary-precision integers; converting large IPv6 counts to floating-point numbers loses precision.",
    resourceLinkLabel: "Optional tool page link in successful responses",
    resultLinks: "Successful responses keep the result in <code>structuredContent</code> and the first JSON text block, then add an optional <code>resource_link</code> to the English tool page. Links contain no inputs or results and do not restore your calculation. Clients choose whether to display, ignore, or open links; automatic rendering or citation is not guaranteed. Opening the public-IP page checks a new browser connection, which may differ from the MCP caller connection. Errors contain no tool page link.",
    errors: "If <code>isError</code> is true, read the error JSON before retrying. Correct <code>INVALID_INPUT</code> and <code>MIXED_ADDRESS_FAMILIES</code> using the user’s information. <code>CLIENT_IP_UNAVAILABLE</code> means trusted connection metadata is missing; do not invent an address.",
    technicalGuide: "Read the technical MCP guide in the repository (English)"
  },
  errors: {
    invalidInput: 'Invalid calculation input.', mixedFamilies: 'Use either IPv4 or IPv6 throughout one calculation.',
    invalidJson: 'The request must contain valid JSON.', payloadTooLarge: 'The request is too large.', unsupportedMediaType: 'Unsupported request content type.',
    notFound: 'The requested resource does not exist.', methodNotAllowed: 'This request method is not supported.',
    internal: 'Unable to complete this operation. Please try again.', ipUnavailable: 'Connection metadata is unavailable. Please try again.',
    network: 'Unable to reach the IP lookup service. Check your connection and try again.', invalidResponse: 'The IP lookup service returned an invalid response. Please try again.',
    invalidAddress: 'Use a standard IPv4 or IPv6 address with an optional valid CIDR prefix. Zone identifiers and IPv4 leading zeros are not supported.',
    emptyInputs: 'Enter at least one IP address or CIDR range.', tooManyInputs: 'Use at most {{limit}} entries per calculation.',
    inputTooLong: 'Each entry must contain at most {{limit}} characters.', expectedFamily: 'Expected {{family}} to match the first input.',
    tooManyOutputs: 'The complete result exceeds {{limit}} CIDRs. Use fewer exclusions or smaller included ranges. No partial result is returned.',
  },
  meta: {
    support: {"title":"Packetrove Support","description":"Contact the Packetrove maintainer, report problems safely, and find API, MCP, CLI, and privacy information."},
    terms: {"title":"Packetrove Terms of Service","description":"Read the terms for Packetrove's hosted service, including acceptable use, result limitations, availability, privacy, and the MIT License."},
    privacy: {"title": "Packetrove Privacy Policy", "description": "Read how Packetrove processes local calculations, remote tool inputs, connection addresses, operational logs, and hosting data, with retention and user choices."},
    range: {
      "title": "IP Range to CIDRs Converter — Packetrove",
      "description": "Convert inclusive IPv4 or IPv6 start/end addresses to a minimal exact CIDR list locally. Copy all blocks and verify exact counts without extra coverage."
    },
    mcp: {"title": "Packetrove MCP Guide", "description": "Connect compatible AI clients to Packetrove through MCP. Explore connection setup, tool discovery, arguments, structured results, and error handling. No API key required."},
    home: { title: 'Packetrove — Network tools for humans and agents', description: 'Open source network tools for developers and AI agents. Use Packetrove on the web or connect it to your workflow through the API, CLI, and MCP. No account required.' },
    cidr: { title: 'Smallest Covering CIDR Calculator — Packetrove', description: 'Find the smallest single CIDR covering IPv4 or IPv6 addresses and ranges. Calculate in your browser with exact address counts, extra coverage, and worked examples.' },
    subtract: { title: 'CIDR Subtraction Calculator — Packetrove', description: 'Subtract IPv4 or IPv6 CIDR lists locally in your browser. Copy an exact minimal list for WireGuard AllowedIPs or inspect remaining address space after known allocations.' },
    ip: { title: 'What Is My IP? Public IP Lookup — Packetrove', description: 'Check the public IPv4 or IPv6 address used by your current connection. Understand VPN and proxy exit addresses without an account.' },
    api: { title: 'Packetrove API Documentation', description: 'Integrate Packetrove network tools through a public HTTP API. Explore endpoints, request examples, structured responses, and the OpenAPI reference. No API key required.' },
    notFound: { title: 'Page not found — Packetrove', description: 'This Packetrove page does not exist. Return to the homepage to use the network tools.' },
    imageAlt: 'Packetrove cube logo beside the project name and the tagline Network tools for humans and agents.',
  },
} as const;
