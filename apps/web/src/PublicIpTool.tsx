import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { PUBLIC_IP_PATH, type PublicIpResult } from '@packetrove/contracts';
import { lookupPublicIp, ToolError } from '@packetrove/core';
import { getApiUrl } from './api';
import { useClipboardFeedback } from './useClipboardFeedback';

export function PublicIpTool() {
  const [result, setResult] = useState<PublicIpResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { copyMessage, clearCopyMessage, copyText } = useClipboardFeedback();
  const activeRequest = useRef<AbortController | null>(null);

  const lookup = useCallback(async () => {
    activeRequest.current?.abort();
    const request = new AbortController();
    activeRequest.current = request;
    setLoading(true);
    setResult(null);
    setError('');
    clearCopyMessage();
    try {
      const current = await lookupPublicIp(getApiUrl(PUBLIC_IP_PATH), request.signal);
      if (!request.signal.aborted) setResult(current);
    } catch (failure) {
      if (!request.signal.aborted) {
        setError(failure instanceof ToolError ? failure.message : 'Unable to check your IP. Please try again.');
      }
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, [clearCopyMessage]);

  useEffect(() => {
    void lookup();
    return () => activeRequest.current?.abort();
  }, [lookup]);

  function copyIp() {
    if (!result) return;
    void copyText(result.ip, 'IP address copied.', 'Copy is unavailable. Select and copy the IP address above.');
  }

  return <Stack gap="xl">
    <Stack component="section" aria-labelledby="tool-title" gap="sm">
      <Text size="xs" c="var(--mantine-primary-color-filled)" fw={700}>IP ADDRESS TOOLS</Text>
      <Title order={1} id="tool-title">My Public IP</Title>
      <Text c="dimmed">See the public IP address used by your current connection to Packetrove.</Text>
      <Text size="sm" c="var(--mantine-primary-color-filled)">Checked online · Not stored by the application</Text>
    </Stack>
    <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} maw={780}
      aria-labelledby="ip-result-heading" aria-busy={loading}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2} size="h3" id="ip-result-heading">Your current connection</Title>
          {result && <Badge variant="light">{result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</Badge>}
        </Group>
        <Stack gap="sm" aria-live="polite" mih={100}>
          {loading && <Group c="dimmed">
            <Loader size="sm" aria-hidden="true" />
            <Text size="sm">Checking your public IP…</Text>
          </Group>}
          {error && <Alert color="red" role="alert">{error}</Alert>}
          {result && <>
            <Text size="xs" c="dimmed">PUBLIC IP ADDRESS</Text>
            <Group justify="space-between">
              <Text component="code" className="network-value" size="xl" fw={600} c="var(--mantine-primary-color-filled)">{result.ip}</Text>
              <Button type="button" variant="default" size="xs" onClick={copyIp}>Copy IP</Button>
            </Group>
          </>}
        </Stack>
        <Text size="xs" c="dimmed" role="status">{copyMessage}</Text>
        <Button type="button" fullWidth loading={loading} disabled={loading} onClick={() => void lookup()}>
          {loading ? 'Checking…' : error ? 'Try again' : 'Refresh IP'}
        </Button>
      </Stack>
    </Paper>
    <Stack component="section" aria-labelledby="explanation-heading" gap="sm">
      <Title order={2} size="h4" id="explanation-heading">What this address tells you</Title>
      <Text size="sm" c="dimmed">This is the address seen by Packetrove for this request. If you use a VPN or proxy, it is the exit address. Your browser and command-line tools can use different network paths.</Text>
      <Text size="sm" c="dimmed">A connection uses either IPv4 or IPv6. This check shows that address; it does not discover both families or your private local address. Refresh after changing networks or proxy settings.</Text>
    </Stack>
  </Stack>;
}
