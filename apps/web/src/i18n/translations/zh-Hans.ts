import type { TranslationResource } from '../translation-resource';

export const zhHans = {
  common: {
    pageLoading: "正在加载页面…", pageLoadFailure: "页面加载失败，请重试。", retryPage: "重试",
    home: '首页', homeLabel: 'Packetrove 首页', navigation: '主导航',
    language: '语言', tools: 'IP 地址工具', copied: '已复制', dismissCopy: '关闭复制错误提示',
    tagline: '面向用户与智能体的网络工具',
    source: '在 GitHub 查看 Packetrove', sourceCommit: '在 GitHub 查看提交 {{commit}} 的源代码', sourceLicense: '源代码：MIT',
    feedbackPrompt: '发现问题或有新想法？欢迎在 GitHub 告诉我们。', reportBug: '报告问题', requestFeature: '功能建议',
    notFound: '页面不存在', notFoundDescription: '你访问的页面不存在。', returnHome: '返回首页',
  },
  languageSuggestion: {
    title: '想使用中文浏览吗？', switch: '切换为中文', dismiss: '暂不切换',
  },
  privacy: {
    "title": "隐私政策",
    "updated": "最后更新：2026 年 10 月 3 日。",
    "introduction": "本政策涵盖 Packetrove 网站、Web API、CLI 和远程 MCP 服务，包括通过 AI 插件使用这些服务。Packetrove 由 Liu Yue 维护，无需账户或 API 密钥。",
    "cloudflarePolicy": "Cloudflare 隐私政策",
    "sections": {
        "local": {
            "title": "本地计算与浏览器存储",
            "body": "浏览器计算和离线 CLI 计算的输入与结果保留在你的设备上，计算草稿仅保留在页面内存中。网站只在当前标签页的 sessionStorage 中保存一个已处理语言提示的标记，不在其中保存地址或结果。复制结果会将其放入系统剪贴板。"
        },
        "remote": {
            "title": "远程工具的输入与结果",
            "body": "API 和远程 MCP 计算会将提供的 IP 地址、CIDR 或范围端点发送到 Packetrove。我们在内存中处理这些参数并返回结果，不使用数据库保存计算历史，也不请求会话历史或账户凭据。调用客户端会收到结果，并可能按其自身政策保留结果。"
        },
        "connection": {
            "title": "公网 IP 查询",
            "body": "公网 IP 查询读取 Cloudflare 提供的连接信息，返回一个观察到的地址。应用不保存查询历史，也不记录返回的 IP。云端 AI 客户端可能查到自己的出口地址；要查询设备的连接，请使用该设备上的浏览器或本地 CLI。"
        },
        "logs": {
            "title": "应用运营日志",
            "body": "MCP 工具回调执行结束后会生成运营事件，包含固定事件名称、工具名称、成功或错误状态，以及失败时的受控错误代码。我们用这些事件统计工具执行次数和诊断错误。重试单独计数；工具发现以及进入工具回调前被拒绝的请求不计入。意外的 HTTP 请求失败生成固定事件名称和错误代码。这些由应用生成的事件不包含输入、结果、返回的 IP 地址、请求头或原始异常详情。我们不建立用户画像、不跨站跟踪、不出售工具数据、不用于广告，也不用于训练模型。"
        },
        "providers": {
            "title": "托管、接收方与保留期限",
            "body": "Cloudflare 托管本服务并处理请求，包括连接地址、请求头和远程工具参数。平台日志可能附加时间、URL、请求标识及技术元数据。启用的 Workers Logs 可供运营者查询最多七天：当前 Free 方案为三天，已公告自 2026 年 12 月 1 日起为七天。这不表示 Cloudflare 的所有网络或安全记录都在七天内删除。Cloudflare 的基础设施处理遵循其自身政策，且可能发生在你所在国家之外。Packetrove 维护者可以访问启用的运营日志来诊断服务。"
        },
        "controls": {
            "title": "你的选择",
            "body": "使用浏览器计算或离线 CLI 计算，可以避免远程提交计算输入。公网 IP 查询仍需网络请求。停用插件或移除 MCP 连接可停止后续调用，但不会删除 AI 客户端已经保存的结果。我们不提供与账户关联的调用历史，也不提供单次调用的日志退出开关。"
        },
        "contact": {
            "title": "隐私咨询与请求",
            "body": "如需咨询隐私问题，或提出适用的访问或删除请求，请通过下方邮箱联系维护者。工具调用不关联账户，因此我们可能无法识别某次具体调用。可选的邮件和 GitHub 沟通保留在这些服务中，并使用其保留控制。公开 GitHub issue 不应包含私有网络数据或密钥。本政策的变更会在此页面发布。"
        }
    }
},
  footer: {
    project: '项目资源', integrations: '接入与集成', contact: '联系与反馈',
    apiDocumentation: 'API 文档', cliGuide: '命令行指南（英文）', sendEmail: '发送邮件',
  },
  home: {
    rangeDescription: "将包含起止端点的 IP 范围转换为最少且精确的 CIDR 列表。在本地计算并复制全部网段，不增加额外地址。",
    rangeLink: "打开 IP 范围转换",
    galleryTitle: "工具预览",
    galleryDescription: "使用左右箭头或滑动卡片浏览示例，再打开需要的工具。",
    galleryPrevious: "上一个工具",
    galleryNext: "下一个工具",
    galleryPosition: "第 {{current}} 项，共 {{total}} 项",
    previewLabel: "示例",
    previewInputs: "示例输入",
    ipPreview: "此处仅展示文档示例地址。打开工具可查询当前连接。",
    integrationsTitle: "接入你的工作流程",
    apiIntroduction: "通过 HTTP 客户端调用工具，使用统一的 JSON 契约。",
    cliIntroduction: "在终端内本地计算覆盖 CIDR，或查询终端连接的公网地址。",
    description: '在浏览器、终端和 AI 智能体中使用开源网络工具。从导航中选择工具，或参考下方说明将 Packetrove 接入你的工作流程。',
    openSource: '开源', anonymous: '无需账户或 API 密钥',
    cidrDescription: '查找覆盖 IPv4 或 IPv6 地址和网段的最小单个 CIDR。在浏览器内完成计算，查看精确地址数，以及额外覆盖范围的说明。',
    cidrLink: '打开 CIDR 计算器',
    subtractDescription: '从包含的地址空间中扣除排除网段。复制精确的 CIDR 列表来设置 WireGuard 例外，或查看扣除已知分配后的空隙，无需上传输入。',
    subtractLink: '打开 CIDR 相减计算器',
    ipDescription: '查询当前连接使用的公网 IP。使用 VPN 或代理时，结果显示出口地址，不会显示本地私有地址。',
    ipLink: '查询我的公网 IP',
    apiTitle: 'Web API', apiDescription: '使用任意 HTTP 客户端调用 Packetrove。例如，通过 curl 查看当前公网 IP：',
    apiResponse: '响应包含 IP 地址及一个换行符，内容类型为 <code>Content-Type: text/plain</code>。', apiGuide: '阅读 API 指南',
    cliTitle: '命令行工具', cliDescription: '使用 Node.js 和 pnpm 从源代码安装：',
    cliExample: '然后输出当前公网 IP：', cliGuide: '阅读命令行指南（英文）',
    mcpTitle: '模型上下文协议（MCP）', mcpDescription: '通过 Streamable HTTP 将 AI 智能体连接到 Packetrove，无需身份验证或本地服务器。',
    serverAddress: '服务器地址', mcpExample: '安装客户端后，添加服务器：',
    mcpCheck: '在客户端中使用 <code>/mcp</code> 检查连接。公网 IP 查询显示的是智能体所用连接的地址。', mcpGuide: "阅读 MCP 接入指南",
  },
  cidr: {
    title: '最小覆盖 CIDR', description: '将 IPv4 或 IPv6 地址和网段合并为覆盖全部输入的最小单个 CIDR 网段。',
    local: '在浏览器内计算 · 无需 API 请求', addresses: '输入地址', inputLabel: 'IP 地址或 CIDR 网段',
    inputHelp: '可用逗号、空格、制表符或换行分隔。每次计算只使用 IPv4 或 IPv6 中的一种，最多 {{maximum}} 项。',
    entryCount_other: '{{total}} 项', clear: '清空', example: '试用示例', calculate: '计算覆盖 CIDR',
    result: '覆盖结果', resultLabel: '最小覆盖 CIDR', copy: '复制 CIDR',
    copySuccess: '已复制 CIDR。', copyFailure: '无法使用剪贴板，请选中并复制上方 CIDR。',
    first: '起始地址', last: '结束地址', unique: '输入中的不同地址数', covered: '覆盖地址数', additional: '额外地址数',
    exact: '精确覆盖：此 CIDR 没有增加额外地址。',
    expansion: '使用此 CIDR 会扩大列表允许或拦截的地址范围。',
    normalized: '规范化输入（{{total}}）', emptyTitle: '计算结果将显示在这里',
    emptyDescription: '输入地址后，可查看覆盖 CIDR、地址范围以及额外覆盖情况。',
    explanationTitle: '理解覆盖范围',
    explanation: '最长的可用前缀对应最小的单个覆盖网段。该网段可能包含原始输入之外的地址。重叠地址只计数一次，含主机位的 CIDR 会规范化为网络地址。',
    countExplanation: '计数包含网段内的全部地址，包括网络地址和广播地址。将结果用于允许列表或拦截列表之前，请检查额外覆盖的范围。',
    examplesTitle: 'CIDR 计算示例', exactExample: 'IPv4 精确覆盖', expandedExample: 'IPv4 额外覆盖', ipv6Example: 'IPv6 精确覆盖',
    limits: '支持单个 IP 地址或 CIDR 网段，最多 {{maximum}} 项。一次计算不能混用 IPv4 和 IPv6。即使网段非常大，IPv6 地址数也保持精确。',
    exampleResult: '{{cidr}} 覆盖 {{covered}} 个地址，额外增加 {{additional}} 个地址。',
    line: '第 {{line}} 行：{{message}}',
    lineEntry: '第 {{line}} 行第 {{entry}} 项：{{message}}',
  },
  subtract: {
    title: 'CIDR 相减', description: '从包含的 IPv4 或 IPv6 地址空间中扣除排除网段，得到不增加额外地址的最少 CIDR 列表。',
    normalizedInclude: "规范化包含输入（{{total}} 项）",
    normalizedExclude: "规范化排除输入（{{total}} 项）",
    normalizedHelp: "每项输入分别规范化，保留输入顺序、重复条目和嵌套网段。",
    noExcludedInputs: "没有排除输入。",
    inputs: '输入地址列表', include: '包含列表', exclude: '排除列表',
    includeLabel: '包含的 IP 地址或 CIDR 网段', excludeLabel: '排除的 IP 地址或 CIDR 网段',
    includeHelp: '可用逗号、空格、制表符或换行分隔。至少包含一个地址或网段。',
    excludeHelp: '可用逗号、空格、制表符或换行分隔。留空时只精简包含列表，不移除地址。',
    calculate: '计算 CIDR 相减', result: '剩余地址空间', output: '剩余 CIDR 列表',
    included: '包含地址数', removed: '实际移除地址数', remaining: '剩余地址数', blocks: '结果 CIDR 数',
    completed: '计算完成。剩余地址数：{{addresses}}；CIDR 数：{{cidrs}}。',
    copyList: '复制（换行分隔）', copyAllowed: '复制（逗号分隔）', copySuccess: '已按换行分隔复制。', allowedSuccess: '已按逗号分隔复制。',
    copyFailure: '无法使用剪贴板，请选中并复制上方列表。',
    formats: '换行分隔：每行一个 CIDR。逗号分隔：CIDR 之间使用逗号和一个空格。',
    emptyTitle: '没有剩余地址', emptyDescription: '排除列表已移除全部包含地址，没有可复制的 CIDR 列表。',
    pendingTitle: '计算结果将在这里显示', pendingDescription: '输入包含列表和可选的排除列表，计算精确的剩余范围。',
    explanationTitle: '如何理解结果',
    explanation: '先分别合并包含和排除范围，再从包含范围中扣除排除范围。重叠地址只计数一次，含主机位的 CIDR 会规范化，不会增加额外地址。网段内所有地址均计入，包括网络地址和广播地址。',
    review: '可用结果设置 WireGuard 例外，或查看扣除已知分配后的空隙。空隙只相对于输入而言，不代表这些地址在真实网络中无人使用。应用前请检查列表。',
    limits: '一次计算使用同一种地址类型，两侧列表合计最多 {{inputs}} 项，每项最多 {{length}} 个字符。结果最多 {{outputs}} 个 CIDR，超过上限会报错，不返回部分列表。',
    examplesTitle: 'CIDR 相减示例', example: '从 {{include}} 中扣除 {{exclude}}：',
    line: '{{list}}第 {{line}} 行：{{message}}', listIssue: '{{list}}：{{message}}',
    lineEntry: '{{list}}第 {{line}} 行第 {{entry}} 项：{{message}}',
    outputLimitTitle: '结果中的 CIDR 数量过多。',
  },
  range: {
    "title": "IP 范围转 CIDR",
    "description": "将一组包含起止端点的 IPv4 或 IPv6 地址范围转换为最少且精确的 CIDR 列表，不增加范围外的地址。",
    "inputs": "你的 IP 地址范围",
    "start": "起始 IP",
    "end": "结束 IP",
    "startHelp": "范围内的第一个地址。输入一个不含 CIDR 前缀的 IPv4 或 IPv6 地址，最多 64 个字符。",
    "endHelp": "范围内的最后一个地址。须与起始 IP 属于同一地址族，且不早于起始 IP，最多 64 个字符。",
    "calculate": "将范围转换为 CIDR",
    "result": "精确范围结果",
    "output": "精确 CIDR 列表",
    "addresses": "范围内地址数",
    "completed": "计算完成。地址数：{{addresses}}。CIDR 数：{{cidrs}}。",
    "pendingDescription": "输入包含在范围内的起止地址，查看精确 CIDR 列表和地址数。",
    "explanation": "起始和结束地址都包含在范围内。结果是精确覆盖此范围的最少 CIDR 列表，按网络地址排序，没有空隙、重叠或额外地址。单个覆盖 CIDR 可能包含范围外的地址。计数包括所有地址，也包括 IPv4 网络地址和广播地址；大范围 IPv6 的地址数仍保持精确。",
    "examplesTitle": "IP 范围示例",
    "example": "含端点范围：{{start}} 至 {{end}}。",
    "issue": "{{field}}：{{message}}",
    "emptyEndpoint": "请输入一个 IPv4 或 IPv6 地址。",
    "invalidEndpoint": "请使用标准 IPv4 或 IPv6 地址，不要包含 CIDR 前缀。不支持区域标识和 IPv4 前导零。",
    "endpointCidr": "请输入不含 CIDR 前缀的 IP 地址。",
    "reversedRange": "结束 IP 须等于或晚于起始 IP，工具不会自动交换端点。",
    "expectedFamily": "请使用 {{family}}，与起始 IP 一致。"
  },
  ip: {
    title: '我的公网 IP', description: '查看当前连接到 Packetrove 时使用的公网 IP 地址。',
    online: '在线查询 · 应用不存储结果', connection: '当前连接', checking: '正在查询公网 IP…',
    resultLabel: '公网 IP 地址', copy: '复制 IP', copySuccess: '已复制 IP 地址。',
    copyFailure: '无法使用剪贴板，请选中并复制上方 IP 地址。', checkingButton: '查询中…', retry: '重试', refresh: '刷新 IP',
    explanationTitle: '这个地址代表什么',
    explanation: '这是 Packetrove 在本次请求中观察到的地址。使用 VPN 或代理时，显示的是出口地址。浏览器与命令行工具可能使用不同的网络路径。',
    familyExplanation: '一次连接使用 IPv4 或 IPv6 中的一种。本次查询显示该连接的地址，无法同时发现两种地址，也不会显示本地私有地址。切换网络或代理设置后，请刷新查询。',
  },
  api: {
    examplesTitle: '接口概要与示例',
    rangeSummary: "提交属于同一地址族的 start 和 end IP 地址，范围包含两个端点。返回规范化端点、最少精确 CIDR 列表、CIDR 数量和十进制字符串地址数。请求会将输入发送到服务器。",
    rangeResponse: "此示例返回 {{cidrs}}，精确表示 {{addresses}} 个地址。",
    title: 'API 文档', loading: '正在加载 API 文档…', specification: 'OpenAPI 规范',
    unavailableTitle: 'API 文档暂时无法显示',
    unavailableDescription: '文档加载或显示失败。你可以返回计算器，继续使用当前输入、结果或验证提示。',
    returnToCalculator: '返回计算器',
    description: '浏览接口、复制请求示例并试用 API，无需账户或 API 密钥。发送请求会将输入提交到 API；公网 IP 查询观察的是浏览器所用连接。',
    englishReference: '交互式接口文档与规范使用英文。',
    cidrSummary: '通过 JSON 提交 IPv4 或 IPv6 地址及 CIDR 网段。响应包含最小覆盖 CIDR、规范化输入和以十进制字符串表示的精确地址数。调用此 API 会将输入发送到服务器。',
    cidrResponse: '此示例返回 {{cidr}}，额外覆盖 {{additional}} 个地址。将结果用于允许列表或拦截列表之前，请检查 additionalAddressCount。',
    ipSummary: '返回本次 HTTP 连接所使用的公网 IP。请求 text/plain 可获得地址及一个换行符，请求 application/json 可获得地址和地址族。响应不缓存；使用 VPN 或代理会改变观察到的出口地址。',
    subtractSummary: "从包含列表中精确扣除排除列表，返回最少规范 CIDR 列表和以十进制字符串表示的精确地址数。调用此 API 会将输入发送到服务器。",
    subtractResponse: "此示例返回 {{cidrs}}，剩余 {{remaining}} 个地址，不增加额外覆盖。",
  },
  discovery: {
    range: {
      "title": "IP 范围转换常见问题",
      "mcpTitle": "通过 MCP 转换 IP 范围",
      "purpose": "让智能体将一组包含起止端点的 IP 范围表示为最少且精确的 CIDR 列表。",
      "inputs": "start 和 end 须是不含 CIDR 前缀且属于同一地址族的 IPv4 或 IPv6 地址，每个最多 {{maximumLength}} 个字符。end 须等于或晚于 start。",
      "result": "读取规范化 range.first、range.last，已排序的 cidrs、cidrCount，以及精确十进制字符串 addressCount。端点相同返回一个 /32 或 /128；完整地址空间返回 /0。错误会指出 start 或 end 字段。",
      "boundary": "浏览器在本地计算；API 和远程 MCP 调用会将端点发送到服务器。工具不检查实际地址分配，也不修改防火墙、路由或 VPN 配置。CLI 尚不支持范围转换。",
      "openTool": "打开浏览器范围转换",
      "questions": {
        "exact": {
          "question": "这与单个覆盖 CIDR 有何区别？",
          "answer": "此列表只包含起止地址之间的全部地址，不增加额外地址。单个覆盖 CIDR 可能包含起始地址之前或结束地址之后的地址。允许列表需要精确匹配给定范围时，应使用精确转换。"
        },
        "order": {
          "question": "端点相同或顺序相反时会怎样？",
          "answer": "端点相同会返回一个主机 CIDR：IPv4 为 /32，IPv6 为 /128。顺序相反会报错，不会自动交换。两个端点须属于同一地址族，且不能含 CIDR 前缀。"
        },
        "counts": {
          "question": "哪些地址会计入数量？",
          "answer": "端点之间的每个地址都计入，包括两个端点及 IPv4 网络地址和广播地址。即使覆盖整个 IPv6 地址空间，计数也保持精确，计算不会逐个枚举地址。"
        },
        "privacy": {
          "question": "起止地址会发送到哪里？",
          "answer": "浏览器计算只在设备内存中进行，不上传、持久化、记录输入或将输入写入网址。Web API 和远程 MCP 调用会将端点发送到服务器。网站、Web API 和 MCP 均提供此功能。"
        }
      }
    },
    subtract: {
      title: "关于 CIDR 扣除的常见问题",
      mcpTitle: "通过 MCP 使用 CIDR 相减",
      purpose: "让 AI 智能体从包含的地址空间中扣除排除网段，返回精确的剩余 CIDR 列表。",
      inputs: "传入同一种地址族的 include 和 exclude 数组。include 必须非空，exclude 可以为空。两侧合计最多 {{maximumInputs}} 项，每项最多 {{maximumLength}} 个字符。",
      result: "读取 cidrs 和以十进制字符串表示的 includedAddressCount、removedAddressCount、remainingAddressCount。全部扣除返回空列表；结果超过 {{maximumOutputs}} 个 CIDR 时返回错误，不返回部分列表。",
      boundary: "远程 API 和 MCP 调用会将输入发送到服务器；网页在浏览器内计算。剩余范围只相对于输入，不证明实际网络中地址未被使用。工具不会配置 WireGuard 或修改防火墙规则。",
      openTool: "打开浏览器相减工具",
      questions: {
        wireguard: {
          question: "如何生成 WireGuard AllowedIPs 的例外列表？",
          answer: "在包含列表中填写希望进入隧道的地址范围，在排除列表中填写例外。选择“复制（逗号分隔）”，即可将精确剩余 CIDR 列表用作 WireGuard 的 AllowedIPs 设置值。应用前请检查；Packetrove 不会配置 WireGuard 或修改路由。"
        },
        remaining: {
          question: "剩余范围能证明这些地址未被使用吗？",
          answer: "它只表示相对于包含和排除列表的空缺。工具不会检查实际网络使用情况，也不会寻找指定大小的子网。"
        },
        outside: {
          question: "排除范围重叠或超出包含范围时会怎样？",
          answer: "两侧的重叠地址都只计一次。只扣除同时位于包含列表中的地址；范围外的排除项不会移除地址。全部扣除是成功的空结果，返回零个 CIDR 和零个剩余地址。"
        },
        covering: {
          question: "扣除与覆盖 CIDR 有什么区别？",
          answer: "扣除精确保留包含列表并集减去排除列表并集后的剩余集合，包括其中的间隙。结果是按顺序排列的最少规范 CIDR 列表，不会新增地址。单个覆盖 CIDR 则可能包含额外地址。"
        },
        access: {
          question: "能通过 MCP、Web API 或 CLI 调用扣除吗？",
          answer: "网页、Web API 和 MCP 均提供相减操作。浏览器输入保留在本地；API 和 MCP 调用会将输入发送到服务器。CLI 目前不提供相减操作。"
        }
      }
    },
    cidr: {
      title: "覆盖 CIDR 常见问题",
      mcpTitle: "通过 MCP 使用计算器",
      purpose: "让 AI 智能体为选定的一组防火墙允许列表或拦截列表条目计算单个覆盖 CIDR，并解释额外覆盖范围。",
      inputs: "接受 1 至 {{maximumInputs}} 个 IPv4 或 IPv6 地址或 CIDR，每项最多 {{maximumLength}} 个字符。每次调用只使用一种地址族。",
      result: "通过 cidr 和 range 查看覆盖网段。在修改防火墙规则前检查 additionalAddressCount。所有地址数均为十进制字符串，保持 IPv6 计数精确。",
      boundary: "远程 MCP 调用会将输入发送到服务器；网页计算器在浏览器内运行。本工具为给定输入计算一个 CIDR；要选择多个合并组合以满足整张名单的条目限制，需要另行确定目标。本工具不会修改防火墙规则。",
      openTool: "打开浏览器计算器",
      questions: {
        firewall: {
          question: "怎样减少防火墙 IP 列表的条目？",
          answer: "将选定的一组条目合并为一个覆盖 CIDR。先检查额外地址：在允许列表中，它们会被额外放行；在拦截列表中，它们会被额外拦截。"
        },
        covering: {
          question: "单个覆盖 CIDR 会精确保留原来的地址集合吗？",
          answer: "只有原始地址的并集恰好填满该 CIDR 时才会精确覆盖。否则，最小单个覆盖 CIDR 仍会增加地址。Packetrove 会显示扩大的范围，但不会为整张名单选择最佳合并组合。"
        },
        overlap: {
          question: "重叠网段和重复输入怎样计数？",
          answer: "原始并集中的每个地址只计数一次。含主机位的 CIDR 会规范化为网络地址。normalizedInputs 会保留重复条目，但地址计数不会因此增加。"
        },
        counts: {
          question: "很大的 IPv6 网段也能精确计数吗？",
          answer: "可以。浏览器使用精确整数，API 和 MCP 以十进制字符串返回计数。计数包含防火墙规则覆盖的全部地址，包括 IPv4 网络地址和广播地址。一次计算只使用一种地址族。"
        },
        privacy: {
          question: "计算输入会发送到哪里？",
          answer: "网页计算器在浏览器内运行，不会将输入发送到 API。草稿只保留在当前标签页的内存中。本地 CLI 可离线计算；Web API 和远程 MCP 调用会将输入提交到服务器。"
        }
      }
    },
    ip: {
      title: "公网 IP 常见问题",
      mcpTitle: "通过 MCP 查看连接地址",
      purpose: "让 AI 智能体查看发起本次 MCP 工具调用的连接所使用的公网 IP。",
      inputs: "传入空对象 {}。工具观察当前请求的连接，不接受待查询的 IP 地址参数。",
      result: "示例使用文档专用地址。实际调用会返回本次请求观察到的 ip 和地址族 family，其值为 ipv4 或 ipv6。",
      boundary: "托管 AI 客户端可能返回它自己的出口地址。要查看浏览器连接，请使用本网页工具；要查看电脑的命令行连接，请在该电脑上运行 CLI。一次调用不能同时发现两种地址族、本地私有地址或代理之前的地址。查询结果不能证明客户端身份。",
      openTool: "查询浏览器的公网 IP",
      questions: {
        address: {
          question: "这个页面显示的是哪个 IP？",
          answer: "这是 Packetrove 在浏览器当前请求中观察到的公网地址。它不是本地私有地址，也不能用来识别你的设备。"
        },
        vpn: {
          question: "使用 VPN 或代理后会怎样？",
          answer: "结果显示该连接所使用的出口地址。切换网络、VPN 或代理设置后，请刷新查询。它不会显示代理之前的地址。"
        },
        family: {
          question: "一次查询会同时发现 IPv4 和 IPv6 吗？",
          answer: "不会。一次请求只观察一种地址族。查询成功并不代表同时具备 IPv4 和 IPv6 连通性。"
        },
        client: {
          question: "为什么 AI 智能体或 CLI 查到的 IP 不同？",
          answer: "各接口观察的是发起请求的连接。托管 MCP 客户端使用的网络可能与浏览器不同。请在想要检查的网络路径上运行网页工具或 CLI。"
        },
        privacy: {
          question: "IP 查询结果会存储或缓存吗？",
          answer: "应用仅在内存中保留当前结果用于显示，不保存查询历史，也不记录地址日志。结果和错误均不缓存。托管平台仍会根据其配置处理请求。"
        }
      }
    }
  },
  mcp: {
    navigation: "MCP 指南",
    sdkTitle: "运行 Node.js 示例",
    sdkDescription: "在新目录中，将下方代码保存为 <code>packetrove-example.mjs</code>，再运行命令。示例使用 <code>@modelcontextprotocol/client@{{version}}</code>，发现工具，并用文档专用地址调用覆盖 CIDR 工具。",
    sdkLocal: "本地开发时，启动 <code>pnpm dev:api</code>，并将示例中的服务器地址改为 <code>{{localUrl}}</code>。",
    httpErrors: "业务错误使用共享的错误 JSON。MCP SDK 处理协议校验错误。无效 JSON、不支持的媒体类型和过大的请求体会在 HTTP 层被拒绝。",
    deploymentTitle: "部署与连接限制",
    serverBehavior: "服务器支持现代无状态请求，以及旧版 Streamable HTTP 的初始化、工具发现和调用；不提供持久会话或独立的服务器事件流。",
    operationalLogging: "我们通过运营事件统计工具执行次数，事件包含工具名称、成功或错误状态和受控错误代码，不包含输入、结果或查询到的地址。Cloudflare 可能附加请求元数据；数据处理和保留期限见隐私政策。",
    connectionPrivacy: "每次工具调用分别读取公网 IP 连接信息，并为并发客户端隔离服务器实例。MCP 结果和错误使用 Cache-Control: no-store, no-transform。应用不保存或记录查询地址。",
    toolMigration: "旧工具名称没有兼容别名：{{toolRenames}}。请刷新工具发现，并更新已保存的调用。",
    endpointMigration: "网站的 <code>/mcp</code> 路径不是服务端点：GET 返回 404，POST 返回 405，不会代理或重定向工具调用。请将客户端配置为 <code>{{serverUrl}}</code>。自建部署需更新域名及各自的 Host 与浏览器 Origin 精确允许列表；支持不带 Origin 请求头的非浏览器客户端。",
    deploymentGuide: "部署、自托管与生产验证",
    registryGuide: "MCP Registry 发布与版本规则",
    title: "将 Packetrove 接入 AI 智能体",
    explanation: "连接兼容 MCP 的客户端来使用 Packetrove 网络工具。先按下方步骤接入，再参考工具示例。",
    connection: "Streamable HTTP · 无需账户或 API 密钥",
    connectTitle: "连接客户端",
    connectDescription: "安装 Claude Code 或 Codex 后，添加这个远程服务器。以下命令配置客户端，不会安装本地 Packetrove 服务器。",
    clientGuide: "{{client}} MCP 官方文档",
    check: "在客户端中使用 <code>/mcp</code> 检查连接。确认以下工具可用：<code>{{tools}}</code>。",
    discovery: "完成配置后，客户端通过 tools/list 发现工具，并根据工具描述和参数结构选择调用。阅读网页不会自动配置客户端或授予工具访问权限。",
    identityTitle: "服务器身份信息",
    identityExplanation: "服务器提供以下服务身份信息，版本随发布版本更新。每个工具的名称、描述和参数结构由 tools/list 单独列出。",
    identityPresentation: "客户端自行决定是否显示标题、简介、官网或图标，也可以忽略可选字段。协议发现成功不代表客户端会展示这些信息。PNG 图标为 32×32，没有主题限制。",
    toolName: "工具名称",
    arguments: "示例参数",
    exampleResult: "使用文档专用地址的示例结果",
    errorsTitle: "读取结果与处理错误",
    results: "读取 <code>structuredContent</code>，或解析文本内容块中的 JSON。地址计数应保留为十进制字符串或任意精度整数；将很大的 IPv6 计数转换为浮点数会丢失精度。",
    resourceLinkLabel: "成功响应中的可选工具页面链接",
    resultLinks: "成功响应会保留 <code>structuredContent</code> 和第一个 JSON 文本内容块中的结果，再附上一个指向英文工具页面的可选 <code>resource_link</code>。链接不含输入或结果，也不会恢复你的计算。是否显示、忽略或打开链接由客户端决定，不保证自动展示或引用。打开公网 IP 页面会检查浏览器的新连接，可能与 MCP 调用者的连接不同。错误响应不附工具页面链接。",
    errors: "<code>isError</code> 为 true 时，先读取错误 JSON，再决定是否重试。根据用户提供的信息修正 <code>INVALID_INPUT</code> 和 <code>MIXED_ADDRESS_FAMILIES</code>。<code>CLIENT_IP_UNAVAILABLE</code> 表示缺少可信的连接信息，请勿推测地址。",
    technicalGuide: "阅读仓库中的 MCP 技术指南（英文）"
  },
  errors: {
    invalidInput: '计算输入无效。', mixedFamilies: '一次计算请统一使用 IPv4 或 IPv6。',
    invalidJson: '请求必须包含有效的 JSON。', payloadTooLarge: '请求内容过大。', unsupportedMediaType: '不支持此请求内容类型。',
    notFound: '请求的资源不存在。', methodNotAllowed: '不支持此请求方法。',
    internal: '无法完成此操作，请重试。', ipUnavailable: '无法获取可信的连接信息，请重试。',
    network: '无法连接到 IP 查询服务，请检查网络连接后重试。', invalidResponse: 'IP 查询服务返回了无效响应，请重试。',
    invalidAddress: '请输入标准 IPv4 或 IPv6 地址，可附带有效的 CIDR 前缀。不支持区域标识符或 IPv4 地址中的前导零。',
    emptyInputs: '请至少输入一个 IP 地址或 CIDR 网段。', tooManyInputs: '每次计算最多支持 {{limit}} 项。',
    inputTooLong: '每项最多支持 {{limit}} 个字符。', expectedFamily: '请使用 {{family}}，与第一项保持一致。',
    tooManyOutputs: '完整结果超过 {{limit}} 个 CIDR。请减少排除项或缩小包含范围，不会返回部分结果。',
  },
  meta: {
    privacy: {"title": "Packetrove 隐私政策", "description": "了解 Packetrove 如何处理本地计算、远程工具输入、连接地址、运营日志和托管数据，以及保留期限和用户选择。"},
    range: {
      "title": "IP 范围转 CIDR — Packetrove",
      "description": "在本地将包含起止端点的 IPv4 或 IPv6 范围转换为最少精确 CIDR 列表，复制全部网段并核对精确地址数，不增加范围外地址。"
    },
    mcp: {"title": "Packetrove MCP 接入指南", "description": "通过 MCP 将兼容的 AI 客户端接入 Packetrove。了解连接配置、工具发现、参数、结构化结果与错误处理，无需 API 密钥。"},
    home: { title: 'Packetrove — 面向用户与智能体的网络工具', description: '面向开发者与 AI 智能体的开源网络工具。通过网页使用 Packetrove，或通过 API、命令行和 MCP 接入你的工作流程，无需账户。' },
    cidr: { title: '最小覆盖 CIDR 计算器 — Packetrove', description: '在浏览器内计算覆盖 IPv4 或 IPv6 地址和网段的最小单个 CIDR，查看精确地址数、额外覆盖范围与计算示例。' },
    subtract: { title: 'CIDR 相减计算器 — Packetrove', description: '在浏览器内完成 IPv4 或 IPv6 CIDR 列表相减，复制精确的最少列表用于 WireGuard AllowedIPs，或查看扣除已知分配后的剩余地址空间。' },
    ip: { title: '我的公网 IP 查询 — Packetrove', description: '查询当前连接使用的公网 IPv4 或 IPv6 地址，了解 VPN 与代理出口地址的含义，无需账户。' },
    api: { title: 'Packetrove API 文档', description: '通过公共 HTTP API 将 Packetrove 网络工具接入应用和脚本。浏览接口、请求示例、结构化响应与 OpenAPI 文档，无需 API 密钥。' },
    notFound: { title: '页面不存在 — Packetrove', description: '此 Packetrove 页面不存在，请返回首页使用网络工具。' },
    imageAlt: 'Packetrove 立方体标志、项目名称与英文标语 Network tools for humans and agents。',
  },
} satisfies TranslationResource;
