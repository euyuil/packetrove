import type { TranslationResource } from '../resources';

export const ptBR = {
  languageSuggestion: {
    title: 'Quer ler esta página em português?',
    switch: 'Mudar para português', dismiss: 'Agora não',
  },
  common: {
    home: 'Início', homeLabel: 'Página inicial do Packetrove', navigation: 'Navegação principal',
    language: 'Idioma', tools: 'FERRAMENTAS DE ENDEREÇOS IP', copied: 'Copiado', dismissCopy: 'Fechar o erro de cópia',
    tagline: 'Ferramentas de rede para pessoas e agentes de IA',
    source: 'Ver o Packetrove no GitHub', sourceCommit: 'Ver o código do commit {{commit}} no GitHub', sourceLicense: 'Código-fonte: MIT',
    feedbackPrompt: 'Encontrou um problema ou tem uma ideia? Conte para nós no GitHub.', reportBug: 'Relatar um problema', requestFeature: 'Sugerir uma funcionalidade',
    notFound: 'Página não encontrada', notFoundDescription: 'A página solicitada não existe.', returnHome: 'Voltar ao início',
  },
  footer: { project: 'Projeto', contact: 'Contato e feedback', sendEmail: 'Enviar um e-mail' },
  home: {
    galleryTitle: "Explore as ferramentas",
    galleryDescription: "Role ou use as setas para ver exemplos e abrir uma ferramenta.",
    galleryPrevious: "Ferramenta anterior",
    galleryNext: "Próxima ferramenta",
    galleryPosition: "{{current}} de {{total}}",
    previewLabel: "Exemplo",
    previewInputs: "Entradas de exemplo",
    ipPreview: "Apenas um endereço de documentação. Abra a ferramenta para verificar sua conexão.",
    integrationsTitle: "Use o Packetrove no seu fluxo de trabalho",
    apiIntroduction: "Chame as ferramentas de um cliente HTTP usando contratos JSON compartilhados.",
    cliIntroduction: "Calcule CIDRs de cobertura localmente ou verifique a conexão pelo terminal.",
    description: 'Ferramentas de rede de código aberto para seu navegador, terminal e agentes de IA. Abra uma ferramenta pela navegação ou siga as instruções abaixo para integrar o Packetrove ao seu trabalho.',
    openSource: 'Código aberto', anonymous: 'Não exige conta nem chave de API',
    cidrDescription: 'Encontre o menor CIDR único que cobre endereços e intervalos IPv4 ou IPv6. Calcule no navegador com contagens exatas de endereços e uma explicação clara da cobertura adicional.',
    cidrLink: 'Abrir a calculadora CIDR',
    subtractDescription: 'Remova as redes excluídas do espaço de endereços incluído. Copie uma lista exata de CIDRs para exceções do WireGuard ou veja os espaços restantes após alocações conhecidas, sem enviar suas entradas.',
    subtractLink: 'Abrir a subtração de CIDRs',
    ipDescription: 'Consulte o IP público da sua conexão. Se você usa uma VPN ou um proxy, o resultado mostra o endereço de saída, sem revelar seu endereço local privado.',
    ipLink: 'Consultar meu IP público',
    apiTitle: 'API web', apiDescription: 'Use o Packetrove com qualquer cliente HTTP. Por exemplo, consulte seu IP público atual com curl:',
    apiResponse: 'A resposta contém o endereço IP seguido de uma quebra de linha, com <code>Content-Type: text/plain</code>.', apiGuide: 'Ler o guia da API',
    cliTitle: 'Interface de linha de comando', cliDescription: 'Instale a partir do código-fonte com Node.js e pnpm:',
    cliExample: 'Depois, exiba seu IP público atual:', cliGuide: 'Ler o guia da CLI (em inglês)',
    mcpTitle: 'Model Context Protocol (MCP)', mcpDescription: 'Conecte seu agente de IA ao Packetrove por Streamable HTTP. Não é necessário autenticar nem executar um servidor local.',
    serverAddress: 'Endereço do servidor', mcpExample: 'Após instalar seu cliente, adicione o servidor:',
    mcpCheck: 'Use <code>/mcp</code> no seu cliente para verificar a conexão. A consulta de IP público mostra o endereço da conexão usada pelo agente.', mcpGuide: "Ler o guia de conexão MCP",
  },
  cidr: {
    title: 'Menor CIDR de cobertura', description: 'Combine endereços e intervalos IPv4 ou IPv6 no menor CIDR único que cobre todos eles.',
    local: 'Calculado no navegador · Sem requisição à API', addresses: 'Seus endereços', inputLabel: 'Endereços IP ou intervalos CIDR',
    inputHelp: 'Separe as entradas com vírgulas, espaços, tabulações ou quebras de linha. Use uma única família de endereços por cálculo. Até {{maximum}} entradas.',
    entryCount_one: '{{total}} entrada', entryCount_other: '{{total}} entradas', entryCount_many: '{{total}} entradas',
    clear: 'Limpar', example: 'Testar um exemplo', calculate: 'Calcular o CIDR de cobertura',
    result: 'Resultado de cobertura', resultLabel: 'MENOR CIDR DE COBERTURA', copy: 'Copiar CIDR',
    copySuccess: 'CIDR copiado.', copyFailure: 'A área de transferência está indisponível. Selecione e copie o CIDR acima.',
    first: 'Primeiro endereço', last: 'Último endereço', unique: 'Endereços únicos de entrada', covered: 'Endereços cobertos', additional: 'Endereços adicionais',
    exact: 'Cobertura exata: este CIDR não adiciona endereços.',
    expansionOne: 'Este CIDR adiciona {{total}} endereço. Ao aplicá-lo, você amplia os endereços permitidos ou bloqueados pela sua lista.',
    expansionOther: 'Este CIDR adiciona {{total}} endereços. Ao aplicá-lo, você amplia os endereços permitidos ou bloqueados pela sua lista.',
    normalized: 'Entradas normalizadas ({{total}})', emptyTitle: 'Seu resultado aparecerá aqui',
    emptyDescription: 'Digite seus endereços para ver o CIDR que os cobre, o intervalo de endereços e a cobertura adicional.',
    explanationTitle: 'Entenda a cobertura',
    explanation: 'O maior comprimento de prefixo possível produz o menor intervalo único que cobre todas as entradas. Esse intervalo pode incluir endereços ausentes das entradas originais. Endereços sobrepostos são contados uma só vez, e CIDRs com bits de host diferentes de zero são normalizados.',
    countExplanation: 'As contagens incluem todos os endereços de um intervalo, inclusive os de rede e broadcast. Confira a cobertura adicional antes de usar o resultado em uma lista de endereços permitidos ou bloqueados.',
    examplesTitle: 'Exemplos de cálculo CIDR', exactExample: 'Cobertura IPv4 exata', expandedExample: 'IPv4 com cobertura adicional', ipv6Example: 'Cobertura IPv6 exata',
    limits: 'Digite endereços individuais ou intervalos CIDR, até {{maximum}} entradas. Não é possível misturar IPv4 e IPv6 no mesmo cálculo. As contagens IPv6 permanecem exatas, mesmo para intervalos muito grandes.',
    exampleResult: '{{cidr}} cobre {{covered}} endereços e adiciona {{additional}}.',
    line: 'Linha {{line}}: {{message}}',
    lineEntry: 'Linha {{line}}, item {{entry}}: {{message}}',
  },
  subtract: {
    title: 'Subtração de CIDRs', description: 'Remova as redes IPv4 ou IPv6 excluídas do espaço de endereços incluído. Obtenha a menor lista exata de CIDRs, sem adicionar endereços.',
    inputs: 'Suas listas de endereços', include: 'Incluir', exclude: 'Excluir',
    includeLabel: 'Endereços IP ou CIDRs incluídos', excludeLabel: 'Endereços IP ou CIDRs excluídos',
    includeHelp: 'Separe as entradas com vírgulas, espaços, tabulações ou quebras de linha. Inclua pelo menos um endereço ou intervalo.',
    excludeHelp: 'Separe as entradas com vírgulas, espaços, tabulações ou quebras de linha. Deixe em branco para simplificar a lista incluída sem remover endereços.',
    calculate: 'Subtrair CIDRs', result: 'Espaço de endereços restante', output: 'CIDRs restantes',
    included: 'Endereços incluídos', removed: 'Endereços removidos', remaining: 'Endereços restantes', blocks: 'CIDRs do resultado',
    completed: 'Cálculo concluído. Endereços restantes: {{addresses}}. CIDRs: {{cidrs}}.',
    copyList: 'Copiar com quebras de linha', copyAllowed: 'Copiar com vírgulas', copySuccess: 'Copiado com quebras de linha.', allowedSuccess: 'Copiado com vírgulas.',
    copyFailure: 'A cópia está indisponível. Selecione e copie a lista acima.',
    formats: 'Com quebras de linha, cada CIDR fica em uma linha. Com vírgulas, os CIDRs são separados por uma vírgula e um espaço.',
    emptyTitle: 'Nenhum endereço restante', emptyDescription: 'As exclusões removeram todos os endereços incluídos. Não há lista de CIDRs para copiar.',
    pendingTitle: 'Seu resultado aparecerá aqui', pendingDescription: 'Digite uma lista de inclusão e exclusões opcionais para calcular o restante exato.',
    explanationTitle: 'O que o resultado significa',
    explanation: 'O cálculo subtrai a união das exclusões da união dos intervalos incluídos. Sobreposições contam uma só vez, os bits de host são normalizados e nenhum endereço é adicionado. Todos os endereços de um intervalo contam, inclusive os de rede e broadcast.',
    review: 'Use o resultado para exceções do WireGuard ou para ver espaços restantes após alocações conhecidas. Esses espaços dependem das suas entradas; eles não comprovam que os endereços estão sem uso na rede real. Confira a lista antes de aplicá-la.',
    limits: 'Use uma única família de endereços e, no máximo, {{inputs}} entradas somando as duas listas, com até {{length}} caracteres por entrada. O resultado pode conter até {{outputs}} CIDRs; resultados maiores retornam um erro sem lista parcial.',
    examplesTitle: 'Exemplos de subtração', example: 'Remover {{exclude}} de {{include}}:',
    line: '{{list}}, linha {{line}}: {{message}}', listIssue: '{{list}}: {{message}}',
    lineEntry: '{{list}}, linha {{line}}, item {{entry}}: {{message}}',
    outputLimitTitle: 'O resultado contém CIDRs demais.',
  },
  ip: {
    title: 'Meu IP público', description: 'Veja o endereço IP público usado pela sua conexão atual com o Packetrove.',
    online: 'Consulta online · O aplicativo não armazena o resultado', connection: 'Sua conexão atual', checking: 'Consultando seu IP público…',
    resultLabel: 'ENDEREÇO IP PÚBLICO', copy: 'Copiar IP', copySuccess: 'Endereço IP copiado.',
    copyFailure: 'A área de transferência está indisponível. Selecione e copie o endereço IP acima.', checkingButton: 'Consultando…', retry: 'Tentar novamente', refresh: 'Atualizar IP',
    explanationTitle: 'O que este endereço representa',
    explanation: 'Este é o endereço observado pelo Packetrove nesta requisição. Se você usa uma VPN ou um proxy, ele é o endereço de saída. Seu navegador e suas ferramentas de linha de comando podem usar caminhos de rede diferentes.',
    familyExplanation: 'Uma conexão usa IPv4 ou IPv6. Esta consulta mostra esse endereço; ela não identifica as duas famílias nem seu endereço local privado. Atualize após mudar de rede ou alterar a configuração do proxy.',
  },
  api: {
    title: 'Documentação da API', loading: 'Carregando a documentação da API…', specification: 'Especificação OpenAPI',
    unavailableTitle: 'A documentação da API está indisponível',
    unavailableDescription: 'Não foi possível carregar ou exibir a documentação. Você pode voltar à calculadora mantendo suas entradas, o resultado ou os erros de validação.',
    returnToCalculator: 'Voltar à calculadora',
    description: 'Explore os endpoints, copie exemplos de requisições e teste a API sem conta nem chave de API. Ao enviar uma requisição, os dados são transmitidos à API. As consultas de IP público mostram a conexão do seu navegador.',
    englishReference: 'A referência interativa e a especificação estão em inglês.',
    cidrSummary: 'Envie endereços IPv4 ou IPv6 e intervalos CIDR em JSON. A resposta inclui o menor CIDR de cobertura, as entradas normalizadas e contagens exatas de endereços como strings decimais. Esta requisição à API envia suas entradas ao servidor.',
    cidrResponse: 'Este exemplo retorna {{cidr}} com {{additional}} endereços adicionais. Confira additionalAddressCount antes de usar o resultado em uma lista de endereços permitidos ou bloqueados.',
    ipSummary: 'Retorna o IP público observado nesta conexão HTTP. Solicite text/plain para um endereço seguido de uma quebra de linha, ou application/json para um endereço e sua família. As respostas não são armazenadas em cache. Uma VPN ou um proxy altera o endereço de saída observado.',
    subtractSummary: "Subtraia exclude de include de forma exata. Retorna a lista mínima de CIDRs canônicos e contagens exatas como strings decimais. Esta chamada envia os dados ao servidor.",
    subtractResponse: "Este exemplo retorna {{cidrs}}, com {{remaining}} endereços restantes e sem cobertura adicional.",
  },
  discovery: {
    subtract: {
      title: "Perguntas sobre a subtração de CIDRs",
      mcpTitle: "Usar a subtração pelo MCP",
      purpose: "Peça a um agente de IA para subtrair as redes excluídas do espaço incluído e retornar os CIDRs restantes exatos.",
      inputs: "Envie arrays include e exclude de uma só família. include não pode estar vazio; exclude pode. Use no máximo {{maximumInputs}} entradas no total, com {{maximumLength}} caracteres por entrada.",
      result: "Leia cidrs e as contagens decimais exatas includedAddressCount, removedAddressCount e remainingAddressCount. A remoção completa retorna uma lista vazia. Mais de {{maximumOutputs}} CIDRs gera um erro sem lista parcial.",
      boundary: "Chamadas remotas de API e MCP enviam os dados ao servidor; o navegador calcula localmente. As faixas restantes dependem das entradas e não comprovam disponibilidade real. Nenhuma configuração do WireGuard ou regra de firewall é alterada.",
      openTool: "Abrir a subtração no navegador",
      questions: {
        wireguard: {
          question: "Como preparo exceções AllowedIPs do WireGuard?",
          answer: "Coloque os intervalos desejados do túnel em Incluir e as exceções em Excluir. Use Copiar com vírgulas para copiar os CIDRs restantes exatos como valor de AllowedIPs do WireGuard. Confira antes de aplicar; o Packetrove não configura o WireGuard nem altera rotas."
        },
        remaining: {
          question: "Os intervalos restantes provam que os endereços estão livres?",
          answer: "Eles mostram lacunas relativas às suas listas de inclusão e exclusão. A ferramenta não consulta o uso real da rede nem procura sub-redes de um tamanho solicitado."
        },
        outside: {
          question: "O que acontece com exclusões sobrepostas ou fora do intervalo incluído?",
          answer: "As sobreposições de cada lista são contadas uma vez. Só são removidos endereços também presentes em Incluir; exclusões externas não removem nada. A remoção completa retorna com sucesso uma lista CIDR vazia e zero endereços restantes."
        },
        covering: {
          question: "Qual é a diferença entre subtração e um CIDR de cobertura?",
          answer: "A subtração mantém exatamente a união das inclusões menos a união das exclusões, incluindo lacunas. Retorna uma lista mínima e ordenada de CIDRs canônicos sem adicionar endereços. Um único CIDR de cobertura pode incluir endereços adicionais."
        },
        access: {
          question: "Posso chamar a subtração via MCP, API web ou CLI?",
          answer: "A subtração está disponível no site, na API web e no MCP. Os dados do navegador ficam locais; API e MCP os enviam ao servidor. A CLI ainda não oferece subtração."
        }
      }
    },
    cidr: {
      title: "Perguntas sobre CIDRs de cobertura",
      mcpTitle: "Usar esta calculadora via MCP",
      purpose: "Peça a um agente de IA que calcule um único CIDR para um grupo escolhido de entradas permitidas ou bloqueadas pelo firewall e explique a cobertura adicional.",
      inputs: "Aceita de 1 a {{maximumInputs}} endereços IPv4 ou IPv6 ou intervalos CIDR, com até {{maximumLength}} caracteres por entrada. Use uma só família por chamada.",
      result: "Consulte cidr e range para conhecer a rede coberta. Confira additionalAddressCount antes de usar o resultado nas regras do firewall. Todas as contagens são strings decimais para manter a precisão do IPv6.",
      boundary: "Chamadas MCP remotas enviam suas entradas ao servidor. A calculadora web funciona localmente. Esta ferramenta calcula um único CIDR; escolher várias combinações para respeitar o limite de uma lista inteira exige definir outro objetivo. Ela não altera regras do firewall.",
      openTool: "Abrir a calculadora no navegador",
      questions: {
        firewall: {
          question: "Como reduzo as entradas de uma lista de IPs do firewall?",
          answer: "Combine um grupo escolhido em um CIDR de cobertura. Confira primeiro os endereços adicionais: eles serão permitidos por uma lista de permissão ou bloqueados por uma lista de bloqueio."
        },
        covering: {
          question: "Um único CIDR preserva exatamente os endereços originais?",
          answer: "Somente quando a união original preenche todo esse CIDR. Caso contrário, até o menor CIDR único adiciona endereços. O Packetrove mostra essa ampliação; ele não escolhe a melhor combinação de agrupamentos para uma lista inteira."
        },
        overlap: {
          question: "Como são contadas as sobreposições e as entradas repetidas?",
          answer: "Cada endereço da união original é contado uma vez. CIDRs com bits de host são normalizados para o endereço de rede. normalizedInputs mantém entradas repetidas sem aumentar as contagens de endereços."
        },
        counts: {
          question: "As contagens continuam exatas para intervalos IPv6 muito grandes?",
          answer: "Sim. O navegador usa inteiros exatos, e a API e o MCP retornam strings decimais. As contagens incluem todos os endereços cobertos pelas regras, inclusive os de rede e broadcast do IPv4. Use uma só família por cálculo."
        },
        privacy: {
          question: "Para onde vão minhas entradas de cálculo?",
          answer: "A calculadora web funciona no navegador sem enviar entradas à API. Os dados digitados ficam na memória desta aba. A CLI local calcula offline; a API web e chamadas MCP remotas enviam as entradas ao servidor."
        }
      }
    },
    ip: {
      title: "Perguntas sobre seu IP público",
      mcpTitle: "Consultar uma conexão via MCP",
      purpose: "Peça a um agente de IA que consulte o IP público observado para a conexão que faz sua chamada MCP.",
      inputs: "Passe um objeto vazio, {}. A ferramenta observa a conexão da requisição; ela não aceita um endereço IP para consultar.",
      result: "O exemplo usa um endereço reservado para documentação. Uma chamada real retorna ip e family, com ipv4 ou ipv6, observados para essa requisição.",
      boundary: "Um cliente de IA hospedado pode retornar seu próprio endereço de saída. Use esta ferramenta web para consultar a conexão do navegador ou a CLI no seu computador para a conexão do terminal. Uma chamada não descobre as duas famílias, endereços locais privados nem um endereço anterior ao proxy. O resultado não é uma prova de identidade.",
      openTool: "Consultar o IP público do meu navegador",
      questions: {
        address: {
          question: "Qual endereço IP esta página mostra?",
          answer: "O endereço público observado na requisição atual do seu navegador ao Packetrove. Ele não é seu endereço local privado e não identifica seu dispositivo."
        },
        vpn: {
          question: "O que muda quando uso uma VPN ou um proxy?",
          answer: "O resultado mostra o endereço de saída usado por essa conexão. Atualize após mudar de rede, VPN ou proxy. Ele não revela um endereço anterior ao proxy."
        },
        family: {
          question: "Uma consulta descobre IPv4 e IPv6?",
          answer: "Não. Uma requisição observa uma só família. Uma consulta bem-sucedida não comprova conectividade nas duas famílias."
        },
        client: {
          question: "Por que um agente de IA ou a CLI pode informar outro IP?",
          answer: "Cada interface observa a conexão que faz sua requisição. Um cliente MCP hospedado pode usar uma rede diferente da do seu navegador. Execute a ferramenta web ou a CLI no caminho de rede que deseja consultar."
        },
        privacy: {
          question: "Os resultados de IP são armazenados ou ficam em cache?",
          answer: "O aplicativo mantém o resultado atual na memória para exibição, sem histórico de consultas nem registros de endereços. Os resultados e erros não são armazenados em cache. A plataforma de hospedagem ainda processa a requisição conforme suas configurações."
        }
      }
    }
  },
  mcp: {
    navigation: "Guia MCP",
    sdkTitle: "Executar um exemplo Node.js",
    sdkDescription: "Em um novo diretório, salve o código como <code>packetrove-example.mjs</code> e execute os comandos. O exemplo usa <code>@modelcontextprotocol/client@{{version}}</code>, descobre ferramentas e chama a ferramenta CIDR com endereços de documentação.",
    sdkLocal: "Para desenvolvimento local, inicie <code>pnpm dev:api</code> e substitua a URL do servidor por <code>{{localUrl}}</code>.",
    httpErrors: "Erros de negócio usam o JSON de erro compartilhado. O SDK MCP valida o protocolo. JSON inválido, tipos de conteúdo não suportados e corpos muito grandes são rejeitados na camada HTTP.",
    deploymentTitle: "Implantação e limites de conexão",
    serverBehavior: "O servidor aceita solicitações modernas sem estado e inicialização, descoberta e chamadas do Streamable HTTP anterior. Não oferece sessões persistentes nem fluxos de eventos independentes do servidor.",
    connectionPrivacy: "Os metadados de IP público são lidos em cada chamada, com instâncias isoladas entre clientes simultâneos. Resultados e erros MCP usam Cache-Control: no-store, no-transform. O aplicativo não armazena nem registra endereços consultados.",
    toolMigration: "O nome anterior <code>get_public_ip</code> não tem alias de compatibilidade. Atualize a descoberta e use <code>{{ipTool}}</code> nas chamadas salvas.",
    endpointMigration: "O caminho <code>/mcp</code> do site não é o serviço: GET retorna 404 e POST 405, sem proxy ou redirecionamento. Configure os clientes com <code>{{serverUrl}}</code>. Na sua implantação, atualize domínios e listas exatas separadas de Host e Origin do navegador; clientes sem cabeçalho Origin são aceitos.",
    deploymentGuide: "Implantação, hospedagem própria e verificação em produção",
    title: "Conectar o Packetrove a um agente de IA",
    explanation: "Conecte um cliente MCP compatível para usar as ferramentas de rede do Packetrove. Comece pela configuração abaixo e consulte os exemplos.",
    connection: "Streamable HTTP · Sem conta nem chave de API",
    connectTitle: "Conectar seu cliente",
    connectDescription: "Com o Claude Code ou o Codex instalado, adicione este servidor remoto. Os comandos configuram o cliente; eles não instalam um servidor Packetrove local.",
    clientGuide: "Documentação MCP do {{client}}",
    check: "Use <code>/mcp</code> no cliente para verificar a conexão. Confirme que estas ferramentas estão disponíveis: <code>{{tools}}</code>.",
    discovery: "Após a configuração, o cliente descobre as ferramentas com tools/list. As descrições e os esquemas orientam a escolha e os argumentos. Ler uma página web não configura um cliente nem dá acesso às ferramentas.",
    toolName: "Nome da ferramenta",
    arguments: "Exemplo de argumentos",
    exampleResult: "Exemplo de resultado com endereços de documentação",
    errorsTitle: "Ler resultados e tratar erros",
    results: "Leia <code>structuredContent</code> ou o JSON do bloco de texto. Mantenha as contagens como strings decimais ou inteiros de precisão arbitrária; converter grandes contagens IPv6 em números de ponto flutuante perde precisão.",
    errors: "Se <code>isError</code> for true, leia o JSON do erro antes de tentar novamente. Corrija <code>INVALID_INPUT</code> e <code>MIXED_ADDRESS_FAMILIES</code> com as informações do usuário. <code>CLIENT_IP_UNAVAILABLE</code> indica que faltam metadados confiáveis da conexão; não invente um endereço.",
    technicalGuide: "Ler o guia técnico MCP do repositório (em inglês)"
  },
  errors: {
    invalidInput: 'As entradas do cálculo são inválidas.', mixedFamilies: 'Use somente IPv4 ou somente IPv6 no mesmo cálculo.',
    invalidJson: 'A requisição deve conter JSON válido.', payloadTooLarge: 'A requisição é grande demais.', unsupportedMediaType: 'O tipo de conteúdo da requisição não é compatível.',
    notFound: 'O recurso solicitado não existe.', methodNotAllowed: 'Este método de requisição não é compatível.',
    internal: 'Não foi possível concluir a operação. Tente novamente.', ipUnavailable: 'Os metadados da conexão estão indisponíveis. Tente novamente.',
    network: 'Não foi possível acessar o serviço de consulta de IP. Verifique sua conexão e tente novamente.', invalidResponse: 'O serviço de consulta de IP retornou uma resposta inválida. Tente novamente.',
    invalidAddress: 'Use um endereço IPv4 ou IPv6 padrão, com um prefixo CIDR válido opcional. Identificadores de zona e zeros à esquerda em IPv4 não são compatíveis.',
    emptyInputs: 'Digite pelo menos um endereço IP ou intervalo CIDR.', tooManyInputs: 'Use no máximo {{limit}} entradas por cálculo.',
    inputTooLong: 'Cada entrada deve conter no máximo {{limit}} caracteres.', expectedFamily: 'Use {{family}}, como na primeira entrada.',
    tooManyOutputs: 'O resultado completo ultrapassa {{limit}} CIDRs. Use menos exclusões ou intervalos incluídos menores. Nenhum resultado parcial é retornado.',
  },
  meta: {
    mcp: {"title": "Guia MCP do Packetrove — CIDR e IP público", "description": "Conecte Claude Code ou Codex ao Packetrove via MCP. Entenda argumentos, resultados CIDR exatos, limites do IP da conexão e tratamento de erros, sem chave de API."},
    home: { title: 'Packetrove — Calculadora CIDR e consulta de IP público', description: 'Calcule CIDRs de cobertura no navegador e consulte seu IP público. Ferramentas IPv4 e IPv6 de código aberto para web, API, CLI e MCP, sem conta.' },
    cidr: { title: 'Calculadora do menor CIDR de cobertura — Packetrove', description: 'Encontre o menor CIDR único que cobre endereços e intervalos IPv4 ou IPv6. Calcule no navegador com contagens exatas, cobertura adicional e exemplos.' },
    subtract: { title: 'Calculadora de subtração de CIDRs — Packetrove', description: 'Subtraia listas de CIDRs IPv4 ou IPv6 localmente no navegador. Copie uma lista mínima exata para AllowedIPs do WireGuard ou veja o espaço restante após alocações conhecidas.' },
    ip: { title: 'Qual é meu IP? Consulta de IP público — Packetrove', description: 'Consulte o endereço IPv4 ou IPv6 público da sua conexão e entenda os endereços de saída de VPNs e proxies, sem conta.' },
    api: { title: 'API do Packetrove — CIDR e IP público', description: 'Use a API do Packetrove para calcular CIDRs de cobertura e consultar IPs públicos. Copie exemplos de curl e explore a referência OpenAPI sem chave de API.' },
    notFound: { title: 'Página não encontrada — Packetrove', description: 'Esta página do Packetrove não existe. Volte ao início para usar as ferramentas de rede.' },
    imageAlt: 'Logotipo cúbico do Packetrove ao lado do nome do projeto e do slogan em inglês Network tools for humans and agents.',
  },
} satisfies TranslationResource & { cidr: { entryCount_many: string } };
