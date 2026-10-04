import type { FindingCode } from './checker';

/** Prototype translation resources; the public tool will require every supported locale. */
export const findingCopy: Record<FindingCode, { title: string; action: string }> = {
  DUPLICATE_CERTIFICATE: { title: '这些原始位置包含相同的证书', action: '确认是否有意重复；若无需要，可以在配置证书包时移除重复项。' },
  CERTIFICATE_EXPIRED: { title: '评估时间已超过证书的有效期', action: '续期或替换这张证书，并确认实际部署使用的是哪张证书。' },
  CERTIFICATE_NOT_YET_VALID: { title: '评估时间早于证书的生效时间', action: '检查设备时间和证书的启用日期。' },
  SELF_SIGNED_CERTIFICATE: { title: '证书能够使用自己的公钥验证签名', action: '自签名不代表客户端信任。请另外检查目标客户端的信任配置。' },
  SELF_SIGNATURE_FAILED: { title: 'Subject 与 Issuer 相同，但自签名验证失败', action: '检查这张证书，并使用独立的证书工具复核。' },
  SIGNATURE_UNSUPPORTED: { title: '当前运行环境或解析库不支持这项签名检查', action: '使用支持该算法的其他工具检查；此状态不等同于签名错误。' },
  SIGNATURE_CHECK_UNAVAILABLE: { title: '签名检查未能完成', action: '检查浏览器的 Web Crypto 支持，并用其他实现复核这条候选关系。' },
  ISSUER_NOT_IN_BUNDLE: { title: '本次输入中未找到编码相同的签发者名称', action: '若服务器实际提供这份证书包，请检查 full-chain 配置。服务器通常省略根证书；这一提示本身不证明证书链损坏。' },
  CANDIDATE_SIGNATURE_FAILED: { title: '这条候选签发关系的签名验证失败', action: '检查这两个位置的证书。其他候选关系会独立验证，不会因本条失败而失效。' },
  ISSUER_NOT_CA: { title: '候选签发者没有声明 basicConstraints CA=true', action: '确认应当使用哪张 CA 证书作为签发者；签名通过也不能代替这项约束。' },
  ISSUER_KEY_USAGE_REJECTED: { title: '候选签发者的 Key Usage 未允许 keyCertSign', action: '检查签发证书及其允许的密钥用途。' },
  ISSUER_KEY_ID_MISMATCH: { title: '签发密钥标识与候选证书的密钥标识不同', action: '核对预期签发者，并查看其他候选关系。' },
  MULTIPLE_ISSUERS: { title: '有多个候选签发者通过了本地关系检查', action: '分别检查这些候选路径。本工具不会选出一条权威信任链。' },
  LEAF_SELECTION_REQUIRED: { title: '存在多个非 CA 证书，需要选择目标叶证书', action: '在叶证书选择框中选择原始位置，再进行主机名检查。' },
  NO_LEAF_CERTIFICATE: { title: '本次输入未包含非 CA 证书', action: '如需检查主机名，请提供服务器的叶证书。' },
  HOSTNAME_MATCH: { title: '预期主机名与所选叶证书的 DNS SAN 匹配', action: '这项身份检查不代表证书链有效，也不代表客户端信任。' },
  HOSTNAME_MISMATCH: { title: '预期主机名与所选叶证书的 DNS SAN 不匹配', action: '核对主机名，或申请包含正确 DNS SAN 的证书。本演示不会回退到 Common Name。' },
};

export const evidenceLabels: Record<string, string> = {
  fingerprintSha256: 'SHA-256 指纹', evaluatedAt: '评估时间', notAfter: '有效期截止',
  notBefore: '生效时间', subject: 'Subject', issuer: 'Issuer', signature: '签名检查',
  algorithm: '签名算法', ca: 'CA 标记', basicConstraintsPresent: '存在 basicConstraints',
  keyCertSign: '允许 keyCertSign', authorityKeyIdentifier: 'Authority Key Identifier',
  subjectKeyIdentifier: 'Subject Key Identifier', candidateCount: '候选数量',
  expectedHostname: '预期主机名', dnsSubjectAlternativeNames: 'DNS SAN',
};

export const statusCopy = { verified: '已验证', failed: '失败', unsupported: '不支持', unavailable: '未完成' };
export const inputErrorCopy: Record<string, string> = {
  EMPTY_INPUT: '请粘贴至少一个 PEM 证书块。', INPUT_TOO_LARGE: 'PEM 输入不能超过 48 KiB。',
  INVALID_PEM: 'PEM 格式不完整或包含无效内容。只接受 CERTIFICATE 块和块之间的空白，Base64 必须完整。',
  PRIVATE_KEY_REJECTED: '检测到私钥块。请移除私钥；这里仅接受证书。',
  UNSUPPORTED_PEM_BLOCK: '检测到不支持的 PEM 类型。这里只接受 CERTIFICATE 块。',
  INVALID_CERTIFICATE: '这个块无法解析为受支持、格式正确的 DER X.509 证书。',
  TOO_MANY_CERTIFICATES: '最多接受 16 张证书，超过限制时不会返回部分检查结果。',
  INVALID_HOSTNAME: '请输入 ASCII DNS 主机名，不含 URL、端口、IP 地址或通配符。国际化域名请先转换为 punycode。',
  INVALID_LEAF_SELECTION: '请选择原始输入中的非 CA 证书。',
  CRYPTO_UNAVAILABLE: '当前页面无法使用 Web Crypto，请通过 localhost 打开本地演示。',
};
