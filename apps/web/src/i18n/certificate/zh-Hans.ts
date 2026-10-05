export const certificateCopy = {
  "certificate": {
    "title": "证书包检查",
    "description": "检查 PEM 证书包、候选签发关系和有证据支持的下一步建议。",
    "local": "浏览器本地检查 · 证书与结果仅保留在页面内存中",
    "scopeTitle": "检查范围",
    "scope": "检查解析、重复、有效期、候选签名、CA 和 keyCertSign 约束及可选 DNS 主机名。不执行完整 RFC 5280 路径验证、客户端信任或吊销检查，不能证明部署安全。",
    "inputs": "输入证书包",
    "samplesLabel": "合成证书样例",
    "loadSample": "试用示例",
    "samplesHelp": "选择一个公开合成证书包填入输入。准备好后，点击“检查证书包”执行检查。",
    "closeExamples": "关闭示例",
    "evidenceTitle": "证据",
    "pem": "PEM 证书",
    "pemHelp": "只接受 CERTIFICATE 块及块间空白；最多 {{maximum}} 张、{{kib}} KiB。私钥会被拒绝。",
    "bytes": "{{current}} / {{maximum}} 字节",
    "hostname": "预期主机名（可选）",
    "hostnameHelp": "仅接受 ASCII DNS 名称；检查所选叶证书的 DNS SAN，不回退到 Common Name。",
    "check": "检查证书包",
    "result": "检查结果",
    "completed": "检查完成。证书：{{certificates}}；诊断条目：{{findings}}。",
    "certificates": "证书",
    "verifiedLinks": "已验证签名",
    "findingCount": "诊断条目",
    "evaluation": "评估时间：{{time}}（设备时间）",
    "selectLeaf": "选择用于主机名检查的叶证书",
    "selectPosition": "请选择原始输入位置",
    "hostnameTitle": "主机名：{{hostname}}",
    "relationships": "签发关系",
    "candidate": "候选关系",
    "constraints": "签发约束",
    "constraintsFailed": "未通过 CA / Key Usage",
    "keyIdFailed": "密钥标识不同",
    "constraintsPassed": "本地约束通过",
    "findingsTitle": "诊断与下一步",
    "checking": "正在本地解析并验证签名…",
    "pending": "输入证书后执行检查。修改输入会清除旧结果。",
    "details": "证书详情 · 原始输入顺序",
    "explanationTitle": "理解检查结果",
    "explanation": "编号对应原始输入位置，JSON 索引从零开始。重复位置仍然保留。候选名称使用保守的编码比较；未找到签发者属于信息提示，一条候选失败不会否定其他关系。切换工具或语言会保留页面内存中的草稿，刷新会清空。",
    "dnsRules": "DNS SAN 匹配忽略 ASCII 大小写和主机名末尾的点。完整的最左侧通配符只匹配一层名称。不接受 URL、IP、端口、带通配符的输入或 Unicode 主机名；国际化域名请先转为 punycode。Common Name 仅用于显示，不用于身份检查。",
    "examplesTitle": "合成证书示例",
    "exampleNote": "公开合成证书。文档评估时间：{{time}}。实际检查使用当前运行环境的时间。",
    "graphLabel": "证书签发关系图。箭头从证书指向候选签发者；原始位置列在下方。",
    "graphHelp": "证书 → 候选签发者。实线表示签名和本地约束通过；虚线表示失败或未完成。自签名结果见详情。",
    "noCommonName": "未提供 CN",
    "ca": "CA 证书",
    "nonCa": "非 CA 证书",
    "nextAction": "下一步",
    "noFindings": "没有诊断条目。请单独检查客户端信任和实际部署。",
    "yes": "是",
    "no": "否",
    "notProvided": "未提供",
    "originalPosition": "原始位置",
    "position": "第 {{number}} 张证书，从第 {{line}} 行开始",
    "serial": "序列号",
    "selfSignature": "自签名检查",
    "json": "结构化结果 JSON",
    "inputLine": "第 {{line}} 行：{{message}}",
    "status": {
      "verified": "已验证",
      "failed": "失败",
      "unsupported": "不支持",
      "unavailable": "未完成"
    },
    "severity": {
      "error": "错误",
      "warning": "警告",
      "info": "信息"
    },
    "hostnameStatus": {
      "matched": "DNS SAN 匹配；证书链有效性和客户端信任需单独检查。",
      "mismatched": "DNS SAN 不匹配，请查看诊断证据。",
      "ambiguous": "选择目标叶证书后才能检查主机名。",
      "no-leaf": "没有可用于主机名检查的非 CA 叶证书。"
    },
    "samples": {
      "normal": "正常证书包",
      "omittedRoot": "省略根证书",
      "missingIntermediate": "缺少中间证书",
      "expired": "已过期",
      "future": "尚未生效",
      "hostnameMismatch": "主机名不匹配",
      "multipleLeaves": "多个叶证书",
      "crossSigning": "交叉签名与乱序输入",
      "invalidCandidate": "同名候选失败",
      "duplicate": "重复证书"
    },
    "errors": {
      "EMPTY_INPUT": "请粘贴至少一个 PEM 证书块。",
      "INPUT_TOO_LARGE": "PEM 超过 48 KiB UTF-8 限制。",
      "INVALID_PEM": "PEM 格式无效。只接受 CERTIFICATE 块、完整 Base64 和块间空白。",
      "PRIVATE_KEY_REJECTED": "私钥块被拒绝。请移除私钥，只提交证书。",
      "UNSUPPORTED_PEM_BLOCK": "不支持这个块类型。这里只接受 CERTIFICATE 块。",
      "INVALID_CERTIFICATE": "这个块不是受支持、格式正确的 DER X.509 证书。",
      "TOO_MANY_CERTIFICATES": "最多 16 张证书，不会返回部分结果。",
      "INVALID_HOSTNAME": "请输入 ASCII DNS 主机名，不含 URL、IP、端口或通配符；Unicode 名称请先转为 punycode。",
      "INVALID_LEAF_SELECTION": "请选择原始输入中包含非 CA 证书的位置。",
      "CRYPTO_UNAVAILABLE": "检查未能完成。请使用安全上下文中的受支持浏览器，或用其他实现复核。",
      "INVALID_INPUT": "请求无效。请检查 PEM、主机名和叶证书原始位置。",
      "INVALID_TIME": "运行环境的评估时间无效。"
    },
    "graphScrollHelp": "窄屏下可在关系图内左右滚动，查看每张证书。",
    "evidence": {
      "fingerprintSha256": "SHA-256 指纹",
      "evaluatedAt": "评估时间",
      "notAfter": "有效期截止",
      "notBefore": "生效时间",
      "subject": "Subject",
      "issuer": "Issuer",
      "signature": "签名检查",
      "algorithm": "签名算法",
      "ca": "CA 标记",
      "basicConstraintsPresent": "存在 basicConstraints",
      "keyCertSign": "keyCertSign",
      "authorityKeyIdentifier": "Authority Key Identifier",
      "subjectKeyIdentifier": "Subject Key Identifier",
      "candidateCount": "候选数量",
      "expectedHostname": "预期主机名",
      "dnsSubjectAlternativeNames": "DNS SAN"
    },
    "findings": {
      "DUPLICATE_CERTIFICATE": {
        "title": "这些位置包含重复证书",
        "action": "如果无意重复，请移除重复证书。"
      },
      "CERTIFICATE_EXPIRED": {
        "title": "评估时证书已过期",
        "action": "续期或替换证书，并核对实际提供的是哪张证书。"
      },
      "CERTIFICATE_NOT_YET_VALID": {
        "title": "评估时证书尚未生效",
        "action": "检查设备时间和证书启用日期。"
      },
      "SELF_SIGNED_CERTIFICATE": {
        "title": "签名能用证书自己的公钥验证",
        "action": "另外检查客户端信任和实际部署；这项观察不能证明其中任何一项。"
      },
      "SELF_SIGNATURE_FAILED": {
        "title": "名称自签发的证书自签名失败",
        "action": "核对这两个原始位置的证书。其他候选关系会独立验证。"
      },
      "SIGNATURE_UNSUPPORTED": {
        "title": "当前环境不支持签名算法",
        "action": "使用支持该算法的其他实现复核。未完成或不支持不等于签名失败。"
      },
      "SIGNATURE_CHECK_UNAVAILABLE": {
        "title": "签名检查未能完成",
        "action": "使用支持该算法的其他实现复核。未完成或不支持不等于签名失败。"
      },
      "ISSUER_NOT_IN_BUNDLE": {
        "title": "本次输入未找到编码相同的签发者名称",
        "action": "若服务器实际提供这份证书包，请检查 full-chain 配置。服务器通常省略根证书，缺少签发者本身不能证明证书链损坏。"
      },
      "CANDIDATE_SIGNATURE_FAILED": {
        "title": "候选签发关系的签名失败",
        "action": "核对这两个原始位置的证书。其他候选关系会独立验证。"
      },
      "ISSUER_NOT_CA": {
        "title": "候选签发者未声明 CA=true",
        "action": "确认预期的签发 CA、Key Usage 和密钥标识，并检查其他候选。"
      },
      "ISSUER_KEY_USAGE_REJECTED": {
        "title": "候选签发者未允许 keyCertSign",
        "action": "确认预期的签发 CA、Key Usage 和密钥标识，并检查其他候选。"
      },
      "ISSUER_KEY_ID_MISMATCH": {
        "title": "签发密钥标识与候选证书不同",
        "action": "确认预期的签发 CA、Key Usage 和密钥标识，并检查其他候选。"
      },
      "MULTIPLE_ISSUERS": {
        "title": "多个候选通过本地签发约束",
        "action": "分别检查候选路径。本工具不会选择一条权威信任路径。"
      },
      "LEAF_SELECTION_REQUIRED": {
        "title": "有多个可能的叶证书，需要选择",
        "action": "提供或明确选择目标非 CA 叶证书，再检查主机名。"
      },
      "NO_LEAF_CERTIFICATE": {
        "title": "输入未包含非 CA 叶证书",
        "action": "提供或明确选择目标非 CA 叶证书，再检查主机名。"
      },
      "HOSTNAME_MATCH": {
        "title": "主机名与所选叶证书的 DNS SAN 匹配",
        "action": "另外检查客户端信任和实际部署；这项观察不能证明其中任何一项。"
      },
      "HOSTNAME_MISMATCH": {
        "title": "主机名与所选叶证书的 DNS SAN 不匹配",
        "action": "核对主机名，或申请包含所需 DNS SAN 的证书。Common Name 不作为回退。"
      }
    }
  },
  "homepage": {
    "description": "本地检查 PEM 证书包的签名、候选签发关系和可选 DNS 身份。",
    "link": "检查证书包"
  },
  "apiSummary": "向服务器提交 PEM 证书和可选 DNS 主机名，获取原始位置、候选签名检查、证据和下一步建议。私钥会被拒绝；结果不代表客户端信任。",
  "meta": {
    "title": "证书包检查 — Packetrove",
    "description": "本地检查 PEM 证书的候选签名、有效期、签发约束和 DNS SAN，并查看可执行的建议。不上传，不进行完整信任验证。"
  },
  "remotePrivacy": "API 和远程 MCP 调用会将 IP 地址、CIDR、范围端点或 PEM 证书及可选主机名发送给 Packetrove。我们在内存中处理，不使用数据库，也不保留结果历史。应用日志和错误遥测不包含证书负载及敏感证书详情。请勿提交私钥或其他秘密。调用客户端收到结果后，可能按其自身政策保留。",
  "discovery": {
    "title": "证书包常见问题",
    "mcpTitle": "通过 MCP 检查证书包",
    "purpose": "让 AI 客户端检查提供的公开证书包，并给出有证据支持的下一步建议。",
    "inputs": "传入 pem（最多 48 KiB UTF-8 和 16 个 CERTIFICATE 块）、可选 ASCII DNS hostname 和可选零起始 leafIndex。私钥与其他块类型会被拒绝。",
    "result": "读取原始顺序的 certificates、候选 relationships、leafIndexes、selectedLeafIndex、hostname 状态、evaluatedAt 以及带稳定 code、severity、evidence 和 nextAction 的 findings。不支持的检查与签名失败分别报告。",
    "boundary": "浏览器检查在本地进行。API 和远程 MCP 会向服务器发送证书和可选主机名。不执行完整路径、客户端信任、吊销或线上探测；CLI 不提供此操作。不能将结果作为部署安全的证明。",
    "openTool": "打开浏览器证书检查",
    "questions": {
      "trust": {
        "question": "关系已验证是否代表可信？",
        "answer": "它只验证一条签名关系和本地签发约束。信任库、完整路径约束、吊销和实际部署需分别检查。"
      },
      "root": {
        "question": "未找到签发者是否证明证书链损坏？",
        "answer": "不能。这仅描述本次输入，服务器通常省略根证书。若这是实际提供的证书包，请检查 full-chain 配置和目标客户端的信任。"
      },
      "privacy": {
        "question": "我的证书会被发送到哪里？",
        "answer": "浏览器输入和结果仅保留在页面内存中，不上传、持久化、记录日志或进入 URL。API 和远程 MCP 会向服务器发送输入。私钥会被拒绝。"
      }
    }
  }
} as const;
