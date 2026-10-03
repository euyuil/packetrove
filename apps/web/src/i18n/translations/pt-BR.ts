import type { TranslationResource } from '../translation-resource';

export const ptBR = {
  languageSuggestion: {
    title: 'Quer ler esta página em português?',
    switch: 'Mudar para português', dismiss: 'Agora não',
  },
  common: {
    pageLoading: "Carregando página…", pageLoadFailure: "Não foi possível carregar esta página. Tente novamente.", retryPage: "Tentar novamente",
    home: 'Início', homeLabel: 'Página inicial do Packetrove', navigation: 'Navegação principal',
    language: 'Idioma', tools: 'FERRAMENTAS DE ENDEREÇOS IP', copied: 'Copiado', dismissCopy: 'Fechar o erro de cópia',
    tagline: 'Ferramentas de rede para pessoas e agentes de IA',
    source: 'Ver o Packetrove no GitHub', sourceCommit: 'Ver o código do commit {{commit}} no GitHub', sourceLicense: 'Código-fonte: MIT',
    feedbackPrompt: 'Encontrou um problema ou tem uma ideia? Conte para nós no GitHub.', reportBug: 'Relatar um problema', requestFeature: 'Sugerir uma funcionalidade',
    notFound: 'Página não encontrada', notFoundDescription: 'A página solicitada não existe.', returnHome: 'Voltar ao início',
  },
  "support": {
    "title": "Suporte",
    "introduction": "Obtenha ajuda com o site Packetrove, a Web API, a CLI e a conexão MCP remota. Não é necessário ter conta ou chave de API.",
    "contactTitle": "Entre em contato com o responsável",
    "contactBody": "A pessoa que mantém o projeto lê os e-mails enviados ao endereço abaixo. Use o e-mail para suporte privado, solicitações de privacidade ou relatos de segurança. O suporte depende do tempo disponível, sem prazo de resposta garantido.",
    "publicTitle": "Feedback público",
    "publicBody": "Relate problemas reproduzíveis ou sugira recursos no GitHub. Os relatos e anexos são públicos. Não inclua credenciais, resultados reais de consultas de IP público ou dados de redes privadas.",
    "detailsTitle": "Ajude a reproduzir o problema",
    "detailsBody": "Informe a ferramenta e a interface, a versão do navegador ou cliente, os passos, o resultado esperado e o resultado real ou código de erro. Use dados de exemplo fictícios e remova informações sigilosas de logs e capturas de tela.",
    "guidesTitle": "Guias de conexão e privacidade",
    "guidesBody": "Os guias de API e MCP explicam a conexão e as entradas. O guia da CLI está em inglês. A política de privacidade descreve o processamento remoto e as mensagens de suporte."
  },
  "terms": {
    "title": "Termos de serviço",
    "updated": "Última atualização: 4 de outubro de 2026.",
    "introduction": "Estes termos se aplicam ao site hospedado, à Web API e ao serviço MCP remoto do Packetrove, operados pela pessoa que mantém o projeto. Ao utilizá-los, você concorda com estes termos.",
    "sections": {
      "use": {
        "title": "Uso aceitável",
        "body": "Use o serviço de forma lícita e somente com dados que você tem autorização para processar. Respeite os limites de entrada documentados. Não interrompa o serviço, contorne controles de segurança ou envie credenciais ou segredos como entradas."
      },
      "results": {
        "title": "Confira os resultados antes de usar",
        "body": "Você é responsável por conferir os resultados antes de aplicá-los a uma rede. Um CIDR de cobertura pode acrescentar endereços; lacunas calculadas não provam disponibilidade real. A consulta de IP público observa a conexão da chamada, que pode ser a saída de um cliente de AI. O Packetrove não configura redes ou regras de firewall."
      },
      "availability": {
        "title": "Disponibilidade e responsabilidade",
        "body": "O serviço hospedado é fornecido como está e conforme disponível, sem garantia de disponibilidade, precisão ou adequação. Ele pode mudar, ser limitado ou parar. Na medida permitida pela lei, o responsável não responde por perdas decorrentes do uso. Estes termos não excluem direitos ou responsabilidades que a lei aplicável proíba excluir."
      },
      "license": {
        "title": "Licença de código aberto",
        "body": "O código-fonte do Packetrove, incluindo a CLI, permanece disponível sob a licença MIT. Estes termos não alteram as permissões ou avisos dessa licença. Componentes de terceiros mantêm suas próprias licenças."
      },
      "privacy": {
        "title": "Privacidade e outros serviços",
        "body": "A política de privacidade explica o tratamento de dados pelo Packetrove. Clientes de AI, GitHub e outros serviços escolhidos por você têm seus próprios termos e políticas de privacidade."
      },
      "changes": {
        "title": "Alterações nestes termos",
        "body": "As revisões são publicadas nesta página com uma data atualizada e se aplicam ao uso posterior do serviço hospedado. Se você não concordar com uma revisão, pare de usar o serviço hospedado."
      }
    },
    "contactTitle": "Dúvidas",
    "contactBody": "Entre em contato com o responsável pelo Packetrove sobre estes termos ou acesse a página de suporte para obter ajuda."
  },
  privacy: {
    "title": "Política de privacidade",
    "updated": "Última atualização: 4 de outubro de 2026.",
    "introduction": "Esta política abrange o site, a Web API, a CLI e o serviço MCP remoto do Packetrove, incluindo o uso por plugins de IA. O Packetrove é mantido por Liu Yue. Não é necessário ter conta nem chave de API.",
    "cloudflarePolicy": "Política de privacidade da Cloudflare",
    "sections": {
        "correspondence": {
          "title": "Correspondência de suporte",
          "body": "Se você nos enviar um e-mail, receberemos seu endereço, qualquer nome informado e a mensagem. A pessoa responsável usa esses dados para responder e acompanhar sua solicitação. A correspondência de suporte costuma ser mantida a longo prazo, sem prazo fixo; entre em contato para solicitar a exclusão. Os e-mails ficam no serviço de correio. Relatos do GitHub e seu histórico público ficam no GitHub e seguem seus controles de retenção."
        },
        "local": {
            "title": "Cálculos locais e armazenamento do navegador",
            "body": "Os cálculos no navegador e os cálculos offline da CLI mantêm entradas e resultados no seu dispositivo. Os rascunhos ficam na memória da página. O site guarda no sessionStorage apenas um indicador de sugestão de idioma já tratada na aba atual, sem endereços ou resultados. Copiar um resultado o coloca na área de transferência do sistema."
        },
        "remote": {
            "title": "Entradas e resultados de ferramentas remotas",
            "body": "Os cálculos por API e MCP remoto enviam ao Packetrove os endereços IP, CIDRs ou limites de intervalo fornecidos. Nós os processamos em memória para retornar o resultado, sem banco de dados nem histórico de cálculos armazenado. Não solicitamos histórico de conversas nem credenciais de conta. O cliente recebe o resultado e pode mantê-lo conforme suas próprias políticas."
        },
        "connection": {
            "title": "Consultas de IP público",
            "body": "Uma consulta lê as informações de conexão fornecidas pela Cloudflare e retorna um endereço observado. O aplicativo não mantém histórico de consultas nem registra o IP retornado. Um cliente de IA hospedado pode observar seu próprio endereço de saída; use o navegador ou uma CLI local para consultar a conexão do seu dispositivo."
        },
        "logs": {
            "title": "Logs operacionais do aplicativo",
            "body": "Ao concluir uma função de ferramenta MCP, um evento operacional registra um nome fixo, o nome da ferramenta, sucesso ou erro e um código de erro controlado em caso de falha. Usamos esses eventos para contar execuções e diagnosticar erros. Novas tentativas contam separadamente; descoberta e solicitações rejeitadas antes da função não entram na contagem. Falhas HTTP inesperadas geram um evento e um código fixos. Esses eventos da aplicação não contêm entradas, resultados, endereços IP retornados, cabeçalhos ou detalhes das exceções originais. Não criamos perfis, não rastreamos entre sites, não vendemos dados das ferramentas nem os usamos para publicidade ou treinamento de modelos."
        },
        "providers": {
            "title": "Hospedagem, destinatários e retenção",
            "body": "A Cloudflare hospeda o serviço e processa solicitações, incluindo endereços de conexão, cabeçalhos e argumentos das ferramentas remotas. Logs da plataforma podem acrescentar horários, URLs, identificadores de solicitações e metadados técnicos. Quando habilitados, Workers Logs acessíveis ao operador ficam disponíveis para consulta por até sete dias: atualmente três dias no Free, com sete dias anunciados a partir de 1º de dezembro de 2026. Isso não garante a exclusão de todos os registros de rede ou segurança da Cloudflare em sete dias. O processamento de infraestrutura da Cloudflare segue sua própria política e pode ocorrer fora do seu país. Os responsáveis pelo Packetrove podem acessar os logs operacionais habilitados para diagnosticar o serviço."
        },
        "controls": {
            "title": "Suas opções",
            "body": "Use cálculos no navegador ou na CLI offline para evitar enviar entradas de cálculo remotamente. Consultas de IP público ainda exigem uma solicitação de rede. Desative o plugin ou remova a conexão MCP para interromper chamadas futuras; isso não exclui resultados já mantidos pelo seu cliente de IA. Não oferecemos histórico de chamadas vinculado a uma conta nem opção de desativar logs por chamada."
        },
        "contact": {
            "title": "Dúvidas e solicitações de privacidade",
            "body": "Entre em contato com o responsável pelo e-mail abaixo para dúvidas de privacidade e solicitações de acesso ou exclusão aplicáveis. Como as chamadas não estão vinculadas a uma conta, talvez não possamos identificar uma chamada individual. Comunicações opcionais por e-mail e GitHub ficam nesses serviços e usam seus controles de retenção. Issues públicas do GitHub não devem conter dados de rede privados nem segredos. Mudanças desta política são publicadas nesta página."
        }
    }
},
  footer: {
    project: 'Recursos do projeto', integrations: 'Integrações', contact: 'Contato e feedback',
    apiDocumentation: 'Documentação da API', cliGuide: 'Guia da CLI (em inglês)', sendEmail: 'Enviar um e-mail',
  },
  home: {
    rangeDescription: "Converta IPs inicial e final inclusivos na lista CIDR mínima exata. Calcule localmente e copie todos os blocos sem adicionar endereços.",
    rangeLink: "Abrir conversor de intervalos IP",
    galleryTitle: "Explore as ferramentas",
    galleryDescription: "Use as setas ou deslize os cartões para ver exemplos e abrir a ferramenta que você precisa.",
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
    expansion: 'Ao aplicar este CIDR, você amplia os endereços permitidos ou bloqueados pela sua lista.',
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
    normalizedInclude: "Entradas incluídas normalizadas ({{total}})",
    normalizedExclude: "Entradas excluídas normalizadas ({{total}})",
    normalizedHelp: "Cada entrada é normalizada separadamente. A ordem de entrada, as entradas repetidas e os intervalos aninhados são preservados.",
    noExcludedInputs: "Nenhuma entrada excluída.",
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
  range: {
    "title": "Intervalo IP para CIDRs",
    "description": "Converta um intervalo inclusivo IPv4 ou IPv6 na menor lista CIDR exata, sem adicionar endereços.",
    "inputs": "Seu intervalo IP",
    "start": "IP inicial",
    "end": "IP final",
    "startHelp": "Primeiro endereço incluído. Insira um endereço IPv4 ou IPv6 sem prefixo CIDR, com até 64 caracteres.",
    "endHelp": "Último endereço incluído. Mesma família, igual ou posterior ao IP inicial, com até 64 caracteres.",
    "calculate": "Converter intervalo para CIDRs",
    "result": "Resultado exato do intervalo",
    "output": "Lista CIDR exata",
    "addresses": "Endereços no intervalo",
    "completed": "Cálculo concluído. Endereços: {{addresses}}. CIDRs: {{cidrs}}.",
    "pendingDescription": "Insira os dois limites inclusivos para ver a lista CIDR exata e o total de endereços.",
    "explanation": "Os dois limites estão incluídos. O resultado é a lista CIDR mínima e ordenada que cobre exatamente o intervalo, sem lacunas, sobreposições ou endereços adicionais. Um único CIDR de cobertura pode incluir endereços externos. Todos os endereços contam, incluindo os de rede e broadcast IPv4, com precisão mesmo em grandes intervalos IPv6.",
    "examplesTitle": "Exemplos de intervalos IP",
    "example": "Intervalo inclusivo: de {{start}} a {{end}}.",
    "issue": "{{field}}: {{message}}",
    "emptyEndpoint": "Insira um endereço IPv4 ou IPv6.",
    "invalidEndpoint": "Use um endereço IPv4 ou IPv6 padrão sem prefixo CIDR. Identificadores de zona e zeros iniciais IPv4 não são suportados.",
    "endpointCidr": "Insira um endereço IP sem prefixo CIDR.",
    "reversedRange": "O IP final deve ser igual ou posterior ao inicial. Os limites não são trocados automaticamente.",
    "expectedFamily": "Use {{family}} para corresponder ao IP inicial."
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
    examplesTitle: 'Resumos dos endpoints e exemplos',
    rangeSummary: "Envie start e end da mesma família. Ambos os limites são inclusivos. Retorna limites canônicos, lista CIDR mínima exata, número de CIDRs e total de endereços como string decimal. A solicitação envia dados ao servidor.",
    rangeResponse: "Este exemplo retorna {{cidrs}}, representando exatamente {{addresses}} endereços.",
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
    range: {
      "title": "Perguntas sobre conversão de intervalos IP",
      "mcpTitle": "Converter intervalos IP via MCP",
      "purpose": "Peça a um agente de IA para representar um intervalo IP inclusivo com sua lista CIDR mínima exata.",
      "inputs": "Passe start e end como endereços IPv4 ou IPv6 da mesma família, sem prefixos CIDR, com até {{maximumLength}} caracteres cada. end deve ser igual ou posterior a start.",
      "result": "Leia range.first e range.last canônicos, cidrs ordenados, cidrCount e addressCount como string decimal exata. Limites iguais produzem /32 ou /128; um espaço completo produz /0. Erros identificam start ou end.",
      "boundary": "O navegador calcula localmente. API e MCP remoto enviam limites ao servidor. A ferramenta não inspeciona alocações reais nem altera firewall, roteamento ou VPN. A CLI não oferece conversão de intervalos.",
      "openTool": "Abrir conversão no navegador",
      "questions": {
        "exact": {
          "question": "Qual a diferença para um único CIDR de cobertura?",
          "answer": "Esta lista contém exatamente o intervalo inclusivo, sem endereços adicionais. Um único CIDR pode incluir endereços antes do início ou depois do fim. Use a conversão exata quando uma lista de permissões precisar corresponder ao intervalo."
        },
        "order": {
          "question": "Posso usar limites iguais ou invertidos?",
          "answer": "Limites iguais retornam um CIDR de host: /32 para IPv4 ou /128 para IPv6. Limites invertidos são rejeitados e nunca trocados silenciosamente. Ambos devem pertencer à mesma família, sem prefixos CIDR."
        },
        "counts": {
          "question": "Quais endereços são contados?",
          "answer": "Todo endereço entre os limites conta, incluindo ambos e endereços de rede e broadcast IPv4. O total permanece exato até para todo o espaço IPv6; os endereços não são enumerados individualmente."
        },
        "privacy": {
          "question": "Para onde vão meus limites?",
          "answer": "Os cálculos no navegador ficam na memória do dispositivo, sem upload, persistência, logs ou entradas nas URLs. Web API e MCP remoto enviam limites ao servidor. A operação está disponível no site, Web API e MCP."
        }
      }
    },
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
    identityTitle: "Identidade do servidor",
    identityExplanation: "O servidor apresenta a seguinte identidade do serviço, com sua versão publicada. Nomes, descrições e esquemas de cada ferramenta são listados separadamente por tools/list.",
    identityPresentation: "Os clientes decidem se exibem o título, a descrição, o site ou o ícone e podem ignorar os campos opcionais. A descoberta bem-sucedida do protocolo não comprova que um cliente exiba essas informações. O ícone PNG tem 32×32 e não possui restrição de tema.",
    navigation: "Guia MCP",
    sdkTitle: "Executar um exemplo Node.js",
    sdkDescription: "Em um novo diretório, salve o código como <code>packetrove-example.mjs</code> e execute os comandos. O exemplo usa <code>@modelcontextprotocol/client@{{version}}</code>, descobre ferramentas e chama a ferramenta CIDR com endereços de documentação.",
    sdkLocal: "Para desenvolvimento local, inicie <code>pnpm dev:api</code> e substitua a URL do servidor por <code>{{localUrl}}</code>.",
    httpErrors: "Erros de negócio usam o JSON de erro compartilhado. O SDK MCP valida o protocolo. JSON inválido, tipos de conteúdo não suportados e corpos muito grandes são rejeitados na camada HTTP.",
    deploymentTitle: "Implantação e limites de conexão",
    serverBehavior: "O servidor aceita solicitações modernas sem estado e inicialização, descoberta e chamadas do Streamable HTTP anterior. Não oferece sessões persistentes nem fluxos de eventos independentes do servidor.",
    operationalLogging: "Contamos execuções com eventos operacionais que contêm o nome da ferramenta, sucesso ou erro e um código de erro controlado. Entradas, resultados e endereços consultados são excluídos. A Cloudflare pode adicionar metadados da solicitação; veja a política de privacidade para tratamento e retenção.",
    connectionPrivacy: "Os metadados de IP público são lidos em cada chamada, com instâncias isoladas entre clientes simultâneos. Resultados e erros MCP usam Cache-Control: no-store, no-transform. O aplicativo não armazena nem registra endereços consultados.",
    toolMigration: "Os nomes anteriores não têm aliases de compatibilidade: {{toolRenames}}. Atualize a descoberta de ferramentas e as chamadas salvas.",
    endpointMigration: "O caminho <code>/mcp</code> do site não é o serviço: GET retorna 404 e POST 405, sem proxy ou redirecionamento. Configure os clientes com <code>{{serverUrl}}</code>. Na sua implantação, atualize domínios e listas exatas separadas de Host e Origin do navegador; clientes sem cabeçalho Origin são aceitos.",
    deploymentGuide: "Implantação, hospedagem própria e verificação em produção",
    registryGuide: "Publicação no MCP Registry e política de versões",
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
    resourceLinkLabel: "Link opcional da ferramenta nas respostas bem-sucedidas",
    resultLinks: "As respostas bem-sucedidas mantêm o resultado em <code>structuredContent</code> e no primeiro bloco de texto JSON, e acrescentam um <code>resource_link</code> opcional para a página da ferramenta em inglês. Os links não contêm entradas nem resultados e não restauram o cálculo. Cada cliente decide se exibe, ignora ou abre os links; a exibição ou citação automática não é garantida. Abrir a página de IP público verifica uma nova conexão do navegador, que pode ser diferente da conexão do cliente MCP. Os erros não incluem links da ferramenta.",
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
    support: {"title":"Packetrove Suporte","description":"Entre em contato com o responsável pelo Packetrove, relate problemas com segurança e encontre informações de API, MCP, CLI e privacidade."},
    terms: {"title":"Packetrove Termos de serviço","description":"Leia os termos do serviço hospedado Packetrove: uso aceitável, limites dos resultados, disponibilidade, privacidade e licença MIT."},
    privacy: {"title": "Política de privacidade do Packetrove", "description": "Saiba como o Packetrove processa cálculos locais, entradas remotas, endereços de conexão, logs operacionais e dados de hospedagem, com retenção e opções do usuário."},
    range: {
      "title": "Conversor de intervalo IP para CIDRs — Packetrove",
      "description": "Converta localmente limites inclusivos IPv4 ou IPv6 em uma lista CIDR mínima exata. Copie todos os blocos e verifique totais exatos sem cobertura adicional."
    },
    mcp: {"title": "Guia MCP do Packetrove", "description": "Conecte clientes de IA compatíveis ao Packetrove via MCP. Consulte configuração, descoberta de ferramentas, argumentos, resultados estruturados e erros, sem chave de API."},
    home: { title: 'Packetrove — Ferramentas de rede para pessoas e agentes de IA', description: 'Ferramentas de rede de código aberto para desenvolvedores e agentes de IA. Use Packetrove na web ou em seu fluxo de trabalho via API, CLI e MCP, sem conta.' },
    cidr: { title: 'Calculadora do menor CIDR de cobertura — Packetrove', description: 'Encontre o menor CIDR único que cobre endereços e intervalos IPv4 ou IPv6. Calcule no navegador com contagens exatas, cobertura adicional e exemplos.' },
    subtract: { title: 'Calculadora de subtração de CIDRs — Packetrove', description: 'Subtraia listas de CIDRs IPv4 ou IPv6 localmente no navegador. Copie uma lista mínima exata para AllowedIPs do WireGuard ou veja o espaço restante após alocações conhecidas.' },
    ip: { title: 'Qual é meu IP? Consulta de IP público — Packetrove', description: 'Consulte o endereço IPv4 ou IPv6 público da sua conexão e entenda os endereços de saída de VPNs e proxies, sem conta.' },
    api: { title: 'Documentação da API do Packetrove', description: 'Integre as ferramentas de rede do Packetrove por uma API HTTP pública. Explore endpoints, exemplos, respostas estruturadas e OpenAPI, sem chave de API.' },
    notFound: { title: 'Página não encontrada — Packetrove', description: 'Esta página do Packetrove não existe. Volte ao início para usar as ferramentas de rede.' },
    imageAlt: 'Logotipo cúbico do Packetrove ao lado do nome do projeto e do slogan em inglês Network tools for humans and agents.',
  },
} satisfies TranslationResource;
