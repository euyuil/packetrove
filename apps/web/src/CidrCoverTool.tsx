import { useState, type FormEvent } from 'react';
import {
  Accordion, Alert, Badge, Button, DataList, Group, List, Paper, ScrollArea, SimpleGrid, Stack, Text, Textarea, Title,
} from '@mantine/core';
import { CIDR_COVER_EXAMPLES, MAX_INPUTS, type CidrCoverResult, type ErrorResponse } from '@packetrove/contracts';
import { smallestCoveringCidr, ToolError } from '@packetrove/core';
import { ClipboardCopyButton } from './ClipboardCopyButton';
import { useClipboardFeedback } from './useClipboardFeedback';

function inputRows(text: string) {
  return text.split(/\r?\n/).map((value, index) => ({ value: value.trim(), line: index + 1 }))
    .filter(row => row.value.length > 0);
}

function formatCount(count: string) {
  return BigInt(count).toLocaleString('en-US');
}

export function CidrCoverTool() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<CidrCoverResult | null>(null);
  const [error, setError] = useState<ErrorResponse['error'] | null>(null);
  const { copyFeedback, clearCopyFeedback, copyText } = useClipboardFeedback();
  const rows = inputRows(input);

  function replaceInput(value: string) {
    setInput(value);
    setResult(null);
    setError(null);
    clearCopyFeedback();
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearCopyFeedback();
    try {
      setResult(smallestCoveringCidr({ inputs: rows.map(row => row.value) }));
      setError(null);
    } catch (failure) {
      setResult(null);
      setError(failure instanceof ToolError ? failure.toResponse().error : {
        code: 'INTERNAL_ERROR', message: 'Unable to calculate this input. Please try again.',
      });
    }
  }

  function copyCidr() {
    if (!result) return;
    void copyText(result.cidr, 'CIDR copied.', 'Copy is unavailable. Select and copy the CIDR above.');
  }

  return (
    <Stack gap="xl">
      <Stack component="section" aria-labelledby="tool-title" gap="sm">
        <Text size="xs" c="var(--mantine-primary-color-filled)" fw={700}>IP ADDRESS TOOLS</Text>
        <Title order={1} id="tool-title">Smallest Covering CIDR</Title>
        <Text c="dimmed">Combine IPv4 or IPv6 addresses and ranges into the smallest single CIDR that covers them all.</Text>
        <Text size="sm" c="var(--mantine-primary-color-filled)">Calculated in your browser · No API request</Text>
      </Stack>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="input-heading">
          <Stack gap="lg">
            <Group justify="space-between">
              <Title order={2} size="h3" id="input-heading">Your addresses</Title>
              <Text size="sm" c="dimmed">IPv4 / IPv6</Text>
            </Group>
            <form onSubmit={calculate}>
              <Stack gap="md">
                <Textarea id="addresses" label="IP addresses or CIDR ranges" value={input}
                  description={`One entry per line. Use one address family per calculation. Up to ${MAX_INPUTS.toLocaleString('en-US')} entries.`}
                  descriptionProps={{ id: 'input-help' }}
                  rows={8} resize="vertical" spellCheck={false} autoCapitalize="off" autoCorrect="off"
                  classNames={{ input: 'network-value' }}
                  errorProps={{ component: 'div', id: 'input-error' }}
                  error={error && <Alert color="red" title={error.message} role="alert">
                    {error.issues && <List size="sm">{error.issues.map((issue, index) => <List.Item key={index}>
                      {issue.index === undefined ? '' : `Line ${rows[issue.index]?.line ?? issue.index + 1}: `}{issue.message}
                    </List.Item>)}</List>}
                  </Alert>}
                  placeholder={'203.0.113.1\n203.0.113.2\n203.0.113.6'}
                  onChange={event => replaceInput(event.currentTarget.value)} />
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">{rows.length.toLocaleString('en-US')} {rows.length === 1 ? 'entry' : 'entries'}</Text>
                  <Button type="button" variant="subtle" size="xs" onClick={() => replaceInput('')} disabled={!input}>Clear</Button>
                </Group>
                <Group gap="sm">
                  <Text size="sm" c="dimmed">Try an example</Text>
                  <Button type="button" variant="default" size="xs"
                    onClick={() => replaceInput(CIDR_COVER_EXAMPLES[1]!.request.inputs.join('\n'))}>IPv4</Button>
                  <Button type="button" variant="default" size="xs"
                    onClick={() => replaceInput(CIDR_COVER_EXAMPLES[2]!.request.inputs.join('\n'))}>IPv6</Button>
                </Group>
                <Button type="submit" fullWidth>Calculate covering CIDR</Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
        <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} aria-labelledby="result-heading">
          <Stack gap="lg">
            <Group justify="space-between">
              <Title order={2} size="h3" id="result-heading">Coverage result</Title>
              {result && <Badge variant="light">{result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</Badge>}
            </Group>
            <Stack gap="md" aria-live="polite">
              {result ? <>
                <Text size="xs" c="dimmed">SMALLEST COVERING CIDR</Text>
                <Group justify="space-between">
                  <Text component="code" className="network-value" size="xl" fw={600} c="var(--mantine-primary-color-filled)">{result.cidr}</Text>
                  <ClipboardCopyButton label="Copy CIDR" feedback={copyFeedback}
                    onCopy={copyCidr} onDismiss={clearCopyFeedback} />
                </Group>
                <DataList orientation="vertical" withDivider>
                  <DataList.Item>
                    <DataList.ItemLabel>First address</DataList.ItemLabel>
                    <DataList.ItemValue className="network-value">{result.range.first}</DataList.ItemValue>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.ItemLabel>Last address</DataList.ItemLabel>
                    <DataList.ItemValue className="network-value">{result.range.last}</DataList.ItemValue>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.ItemLabel>Unique input addresses</DataList.ItemLabel>
                    <DataList.ItemValue className="network-value" fw={600}>{formatCount(result.inputAddressCount)}</DataList.ItemValue>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.ItemLabel>Covered addresses</DataList.ItemLabel>
                    <DataList.ItemValue className="network-value" fw={600}>{formatCount(result.coveredAddressCount)}</DataList.ItemValue>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.ItemLabel>Additional addresses</DataList.ItemLabel>
                    <DataList.ItemValue className="network-value" fw={600} c={result.additionalAddressCount === '0' ? 'teal' : 'yellow.9'}>
                      {formatCount(result.additionalAddressCount)}
                    </DataList.ItemValue>
                  </DataList.Item>
                </DataList>
                <Alert color={result.additionalAddressCount === '0' ? 'teal' : 'yellow'} role="note">
                  {result.additionalAddressCount === '0'
                    ? 'Exact coverage: this CIDR adds no addresses.'
                    : `This CIDR adds ${formatCount(result.additionalAddressCount)} addresses. Applying it expands the addresses allowed or blocked by your list.`}
                </Alert>
                <Accordion variant="contained">
                  <Accordion.Item value="normalized-inputs">
                    <Accordion.Control>Normalized inputs ({result.normalizedInputs.length})</Accordion.Control>
                    <Accordion.Panel>
                      <ScrollArea.Autosize mah={200} type="auto">
                        <List type="ordered" size="sm">{result.normalizedInputs.map((entry, index) => <List.Item key={index}>
                          <Text component="code" className="network-value" size="sm">{entry}</Text>
                        </List.Item>)}</List>
                      </ScrollArea.Autosize>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              </> : <Stack align="center" py="xl" gap="sm">
                <Title order={3} size="h4">Your result will appear here</Title>
                <Text size="sm" c="dimmed" ta="center">Enter your addresses to see their covering CIDR, address range, and any extra coverage.</Text>
              </Stack>}
            </Stack>
          </Stack>
        </Paper>
      </SimpleGrid>
      <Stack component="section" aria-labelledby="explanation-heading" gap="sm">
        <Title order={2} size="h4" id="explanation-heading">Understand the coverage</Title>
        <Text size="sm" c="dimmed">The longest possible prefix gives the smallest single covering range. That range can include addresses outside your original entries. Overlapping entries are counted once, and CIDRs with host bits are normalized.</Text>
        <Text size="sm" c="dimmed">Counts include every address in a range, including network and broadcast addresses. Review additional coverage before using a result in an allowlist or blocklist.</Text>
      </Stack>
    </Stack>
  );
}
