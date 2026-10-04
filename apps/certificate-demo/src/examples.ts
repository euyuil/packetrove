import fixtures from './fixtures.json';

export { fixtures };
export const bundle = (...names: Array<keyof typeof fixtures>) => names.map(name => fixtures[name]).join('\n');

export const examples = [
  { id: 'normal', title: '正常证书包', description: '叶证书 → 中间证书 → 自签名根证书；可以逐条验证签名。',
    pem: bundle('leaf', 'intermediate', 'rootA'), hostname: 'service.example.com' },
  { id: 'omitted-root', title: '省略根证书', description: '常见的服务器证书包形式；未提供根证书会显示为信息提示。',
    pem: bundle('leaf', 'intermediate'), hostname: 'service.example.com' },
  { id: 'missing-intermediate', title: '缺少中间证书', description: '输入中找不到叶证书的签发者；给出下一步检查建议。',
    pem: bundle('leaf', 'rootA'), hostname: 'service.example.com' },
  { id: 'expired', title: '已过期', description: '叶证书在 2021 年到期；签名检查与有效期检查分别展示。',
    pem: bundle('expired', 'intermediate'), hostname: 'expired.example.com' },
  { id: 'future', title: '尚未生效', description: '叶证书从 2038 年开始有效。',
    pem: bundle('future', 'intermediate'), hostname: 'future.example.com' },
  { id: 'hostname-mismatch', title: '主机名不匹配', description: '证书包的签名关系可以成立，但 DNS SAN 不包含预期的主机名。',
    pem: bundle('leaf', 'intermediate'), hostname: 'wrong.example.org' },
  { id: 'multiple-leaves', title: '多个叶证书', description: '需要明确选择要检查主机名的叶证书，不会自动挑选。',
    pem: bundle('leaf', 'leafTwo', 'intermediate'), hostname: 'service.example.com' },
  { id: 'cross-signing', title: '交叉签名与乱序输入', description: '两个中间证书使用同一公钥，由不同根证书签发；保留原始位置和两条候选关系。',
    pem: bundle('rootB', 'crossSigned', 'leaf', 'rootA', 'intermediate'), hostname: 'service.example.com' },
  { id: 'invalid-candidate', title: '同名签发者候选失败', description: '其中一个同名签发者的公钥不匹配；另一条已验证关系仍然保留。',
    pem: bundle('leaf', 'wrongIntermediate', 'intermediate', 'rootA'), hostname: 'service.example.com' },
  { id: 'duplicate', title: '重复证书', description: '相同证书保留各自原始位置，但不会制造额外的叶证书歧义。',
    pem: bundle('leaf', 'intermediate', 'leaf'), hostname: 'service.example.com' },
];
