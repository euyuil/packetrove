import { Accordion, List, ScrollArea, Text } from '@mantine/core';

export function NormalizedInputs({ label, entries, emptyMessage }: {
  label: string; entries: readonly string[]; emptyMessage?: string;
}) {
  return <Accordion variant="contained">
    <Accordion.Item value="normalized-inputs">
      <Accordion.Control>{label}</Accordion.Control>
      <Accordion.Panel>
        {entries.length ? <ScrollArea.Autosize mah={200} type="auto">
          <List type="ordered" size="sm">{entries.map((entry, index) => <List.Item key={index}>
            <Text component="code" className="network-value" size="sm">{entry}</Text>
          </List.Item>)}</List>
        </ScrollArea.Autosize> : <Text size="sm" c="dimmed">{emptyMessage}</Text>}
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion>;
}
