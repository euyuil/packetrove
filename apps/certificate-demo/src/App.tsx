import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Accordion, Alert, Badge, Box, Button, Card, Code, Container, Divider, Group,
  Paper, Select, SimpleGrid, Stack, Table, Text, Textarea, TextInput, ThemeIcon, Title,
} from '@mantine/core';
import { IconCertificate } from '@tabler/icons-react';
import { MAX_CERTIFICATES, MAX_PEM_BYTES, type BundleResult, type CheckStatus } from './checker';
import { evidenceLabels, findingCopy, inputErrorCopy, statusCopy } from './copy';
import { examples } from './examples';
import { RelationshipGraph } from './RelationshipGraph';
import { useBundleCheck } from './useBundleCheck';

const severityCopy = { error: '错误', warning: '警告', info: '信息' };
const severityColor = { error: 'red', warning: 'orange', info: 'blue' };
const statusColor: Record<CheckStatus, string> = { verified: 'teal', failed: 'red', unsupported: 'orange', unavailable: 'gray' };
const date = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false });

function CheckBadge({ status }: { status: CheckStatus }) {
  return <Badge color={statusColor[status]} variant="light">{statusCopy[status]}</Badge>;
}

function Findings({ result }: { result: BundleResult }) {
  const findings = [...result.findings].sort((a, b) =>
    ['error', 'warning', 'info'].indexOf(a.severity) - ['error', 'warning', 'info'].indexOf(b.severity));
  return <Stack gap="sm">
    {findings.map((finding, index) => <Card key={`${finding.code}-${index}`} withBorder padding="md">
      <Stack gap="xs">
        <Group gap="xs">
          <Badge color={severityColor[finding.severity]} variant="light">{severityCopy[finding.severity]}</Badge>
          <Text size="sm" fw={600}>{findingCopy[finding.code].title}</Text>
          <Text size="xs" c="dimmed">{finding.certificateIndexes.map(index => `#${index + 1}`).join('、')}</Text>
        </Group>
        <Code fz="xs" w="fit-content">{finding.code}</Code>
        <Stack gap={4}>
          {Object.entries(finding.evidence).map(([key, value]) => <Text key={key} size="xs" style={{ overflowWrap: 'anywhere' }}>
            <Text span fw={600}>{evidenceLabels[key] ?? key}：</Text>
            {typeof value === 'boolean' ? (value ? '是' : '否') : value === null ? '未提供' :
              typeof value === 'string' && value in statusCopy ? statusCopy[value as CheckStatus] : String(value)}
          </Text>)}
        </Stack>
        <Text size="sm"><Text span fw={600}>下一步：</Text>{findingCopy[finding.code].action}</Text>
      </Stack>
    </Card>)}
    {!findings.length && <Text c="dimmed" size="sm">没有产生诊断条目。请仍然单独检查客户端信任和实际部署。</Text>}
  </Stack>;
}

function Certificates({ result }: { result: BundleResult }) {
  return <Accordion variant="separated" multiple defaultValue={['0']}>
    {result.certificates.map(certificate => <Accordion.Item key={certificate.index} value={String(certificate.index)}>
      <Accordion.Control>
        <Group gap="xs" wrap="wrap">
          <Text fw={600}>#{certificate.index + 1}</Text>
          <Badge variant="light" color={certificate.ca ? 'gray' : 'violet'}>{certificate.ca ? 'CA' : '非 CA'}</Badge>
          <Text size="sm" style={{ overflowWrap: 'anywhere' }}>{certificate.subject}</Text>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="xs">
          {[
            ['原始位置', `第 ${certificate.index + 1} 个证书块，从第 ${certificate.line} 行开始`],
            ['Subject', certificate.subject], ['Issuer', certificate.issuer],
            ['SAN', certificate.sans.map(name => `${name.type}: ${name.value}`).join('；') || '未提供'],
            ['生效时间', date(certificate.notBefore)], ['有效期截止', date(certificate.notAfter)],
            ['basicConstraints', certificate.basicConstraintsPresent ? `CA=${certificate.ca}` : '未提供'],
            ['keyCertSign', certificate.keyCertSign === null ? 'Key Usage 未提供' : certificate.keyCertSign ? '允许' : '未允许'],
            ['签名算法', certificate.signatureAlgorithm], ['序列号', certificate.serialNumber],
            ['SHA-256 指纹', certificate.fingerprintSha256],
          ].map(([label, value]) => <Box key={label}>
            <Text size="xs" c="dimmed">{label}</Text>
            <Text size="sm" ff={label === 'SHA-256 指纹' ? 'monospace' : 'text'} style={{ overflowWrap: 'anywhere' }}>{value}</Text>
          </Box>)}
          {certificate.selfSignature && <Group gap="xs"><Text size="sm">自签名检查</Text><CheckBadge status={certificate.selfSignature} /></Group>}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>)}
  </Accordion>;
}

export function App() {
  const { input, result, error, checking, replaceInput, inspect } = useBundleCheck({ pem: examples[0]!.pem, hostname: examples[0]!.hostname });
  const [exampleId, setExampleId] = useState('normal');
  const pemRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { void inspect({ pem: examples[0]!.pem, hostname: examples[0]!.hostname }); }, [inspect]);
  const example = examples.find(value => value.id === exampleId)!;
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void inspect(input); }
  const bytes = new TextEncoder().encode(input.pem).length;

  return <Box bg="gray.0" mih="100vh" py={{ base: 'md', sm: 'xl' }}>
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between" gap="sm">
          <Text fw={700} c="violet.8">Packetrove</Text>
          <Badge variant="outline" color="violet">本地演示 · #142</Badge>
        </Group>
        <Stack gap="xs">
          <Group gap={12} align="flex-start" wrap="nowrap">
            <ThemeIcon size={40} variant="light" flex="0 0 auto" aria-hidden="true"><IconCertificate size={24} /></ThemeIcon>
            <Title order={1} fz={{ base: 26, sm: 32 }} lh="40px" miw={0}>证书包检查</Title>
          </Group>
          <Text c="dimmed">粘贴 PEM，查看每张证书、候选签发关系，以及有证据支持的下一步建议。</Text>
          <Text size="sm" c="violet.8">输入和结果仅保留在当前页面内存中，证书检查在浏览器本地运行。</Text>
        </Stack>
        <Alert color="blue" variant="light" title="检查范围">
          检查解析、重复、有效期、候选关系的签名、CA 标记、keyCertSign 和可选的 DNS 主机名。
          不执行完整 RFC 5280 路径验证、客户端信任库检查、吊销检查或线上探测；结果不能证明部署安全。
        </Alert>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
          <Paper withBorder p="lg" radius="md">
            <Stack gap="md">
              <Title order={2} size="h4">输入证书包</Title>
              <Stack gap="xs">
                <Select label="合成证书样例" value={exampleId} allowDeselect={false}
                  data={examples.map(value => ({ value: value.id, label: value.title }))} onChange={value => value && setExampleId(value)} />
                <Text size="sm" c="dimmed">{example.description}</Text>
                <Button variant="default" onClick={() => { void inspect({ pem: example.pem, hostname: example.hostname }); }}>加载并检查</Button>
              </Stack>
              <Divider />
              <form onSubmit={submit}>
                <Stack gap="md">
                  {error && <Alert color="red" title="输入未被检查" role="alert">
                    <Stack gap="xs">
                      <Text size="sm">{inputErrorCopy[error.code] ?? '当前环境无法完成检查。请用其他工具复核。'}</Text>
                      {error.location && <Group gap="xs"><Text size="xs">第 {error.location.line} 行</Text>
                        <Button variant="outline" color="red" size="xs" onClick={() => {
                          pemRef.current?.focus();
                          pemRef.current?.setSelectionRange(error.location!.offset, error.location!.end);
                        }}>定位输入</Button>
                      </Group>}
                      <Code fz="xs" w="fit-content">{error.code}</Code>
                    </Stack>
                  </Alert>}
                  <Textarea ref={pemRef} label="PEM 证书" description={`只接受 CERTIFICATE 块及块间空白；最多 ${MAX_CERTIFICATES} 张、${MAX_PEM_BYTES / 1024} KiB。私钥会被拒绝。`}
                    value={input.pem} onChange={event => replaceInput({ pem: event.currentTarget.value, hostname: input.hostname ?? '' })}
                    minRows={15} maxRows={22} autosize spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
                    styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }} error={Boolean(error?.location)} />
                  <Group justify="space-between">
                    <Text size="xs" c={bytes > MAX_PEM_BYTES ? 'red' : 'dimmed'}>{bytes.toLocaleString('zh-CN')} / {MAX_PEM_BYTES.toLocaleString('zh-CN')} 字节</Text>
                    <Button variant="default" size="xs" onClick={() => replaceInput({ pem: '', hostname: '' })}>清空输入</Button>
                  </Group>
                  <TextInput label="预期主机名（可选）" description="只接受 ASCII DNS 名称；根据所选叶证书的 DNS SAN 检查，不回退到 Common Name。"
                    placeholder="service.example.com" value={input.hostname ?? ''} autoComplete="off" autoCapitalize="off" spellCheck={false}
                    onChange={event => replaceInput({ pem: input.pem, hostname: event.currentTarget.value })} />
                  <Button type="submit" loading={checking} fullWidth>检查证书包</Button>
                </Stack>
              </form>
            </Stack>
          </Paper>
          <Stack gap="lg" aria-live="polite" aria-busy={checking}>
            <Paper withBorder p="lg" radius="md">
              <Stack gap="md">
                <Title order={2} size="h4">检查结果</Title>
                {result ? <>
                  <SimpleGrid cols={3} spacing="xs">
                    <Box><Text size="xs" c="dimmed">证书</Text><Text fw={700} size="xl">{result.certificates.length}</Text></Box>
                    <Box><Text size="xs" c="dimmed">已验证签名关系</Text><Text fw={700} size="xl">{result.relationships.filter(link => link.signature === 'verified').length}</Text></Box>
                    <Box><Text size="xs" c="dimmed">诊断条目</Text><Text fw={700} size="xl">{result.findings.length}</Text></Box>
                  </SimpleGrid>
                  <Text size="xs" c="dimmed">评估时间：{date(result.evaluatedAt)}（当前设备时间）</Text>
                  {result.leafIndexes.length > 1 && <Select label="选择用于主机名检查的叶证书" placeholder="请选择原始输入位置"
                    value={result.selectedLeafIndex === null ? null : String(result.selectedLeafIndex)} clearable
                    data={result.leafIndexes.map(index => ({ value: String(index), label: `#${index + 1} ${result.certificates[index]!.subject}` }))}
                    onChange={value => { void inspect({ pem: input.pem, hostname: input.hostname ?? '', ...(value === null ? {} : { leafIndex: Number(value) }) }); }} />}
                  {result.hostname && <Alert color={result.hostname.status === 'matched' ? 'blue' : result.hostname.status === 'mismatched' ? 'red' : 'orange'}
                    title={`主机名：${result.hostname.expected}`}>
                    {{ matched: 'DNS SAN 匹配；证书链和客户端信任仍需单独验证。', mismatched: 'DNS SAN 不匹配，详见诊断证据。',
                      ambiguous: '多个叶证书，选择目标后才能检查主机名。', 'no-leaf': '没有可用于检查的叶证书。' }[result.hostname.status]}
                  </Alert>}
                  <Title order={3} size="h5">签发关系</Title>
                  <RelationshipGraph result={result} />
                  {result.relationships.length > 0 && <Table.ScrollContainer minWidth={440}>
                    <Table fz="xs" withTableBorder verticalSpacing="xs">
                      <Table.Thead><Table.Tr><Table.Th>候选关系</Table.Th><Table.Th>签名</Table.Th><Table.Th>签发约束</Table.Th></Table.Tr></Table.Thead>
                      <Table.Tbody>{result.relationships.map(link => <Table.Tr key={`${link.childIndex}-${link.issuerIndex}`}>
                        <Table.Td>#{link.childIndex + 1} → #{link.issuerIndex + 1}</Table.Td>
                        <Table.Td><CheckBadge status={link.signature} /></Table.Td>
                        <Table.Td>{!link.issuerEligible ? '未通过 CA / Key Usage' : link.keyIdentifierMatch === false ? '密钥标识不匹配' : '本地约束通过'}</Table.Td>
                      </Table.Tr>)}</Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>}
                  <Title order={3} size="h5">诊断与下一步</Title>
                  <Findings result={result} />
                </> : <Text size="sm" c="dimmed" role="status">{checking ? '正在浏览器本地解析并验证签名…' : '输入修改后，旧结果已清除。点击“检查证书包”生成本次输入的结果。'}</Text>}
              </Stack>
            </Paper>
            {result && <Paper withBorder p="lg" radius="md"><Stack gap="md">
              <Title order={2} size="h4">证书详情 · 原始输入顺序</Title>
              <Certificates result={result} />
              <Accordion variant="contained"><Accordion.Item value="json"><Accordion.Control>结构化结果 JSON</Accordion.Control>
                <Accordion.Panel><Textarea aria-label="结构化结果 JSON" value={JSON.stringify(result, null, 2)} readOnly autosize minRows={8} maxRows={20}
                  styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }} /></Accordion.Panel>
              </Accordion.Item></Accordion>
            </Stack></Paper>}
          </Stack>
        </SimpleGrid>
        <Text size="xs" c="dimmed">本演示只用于本地评估。证书块编号从 1 开始显示，JSON 的 index 从 0 开始。刷新页面会重置输入。名称候选使用保守的编码比较；不枚举完整信任路径。</Text>
      </Stack>
    </Container>
  </Box>;
}
