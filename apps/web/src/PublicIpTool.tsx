import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { PUBLIC_IP_PATH, type PublicIpResult } from '@packetrove/contracts';
import { lookupPublicIp, ToolError } from '@packetrove/core';
import { getApiUrl } from './api';
import { ClipboardCopyButton } from './ClipboardCopyButton';
import { useClipboardFeedback } from './useClipboardFeedback';
import { errorMessage } from './i18n/errors';

export function PublicIpTool() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === 'zh-Hans' ? 'zh-Hans' : 'en';
  const [result, setResult] = useState<PublicIpResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ToolError | null>(null);
  const { copyFeedback, clearCopyFeedback, copyText } = useClipboardFeedback();
  const activeRequest = useRef<AbortController | null>(null);

  const lookup = useCallback(async () => {
    activeRequest.current?.abort();
    const request = new AbortController();
    activeRequest.current = request;
    setLoading(true);
    setResult(null);
    setError(null);
    clearCopyFeedback();
    try {
      const current = await lookupPublicIp(getApiUrl(PUBLIC_IP_PATH), request.signal);
      if (!request.signal.aborted) setResult(current);
    } catch (failure) {
      if (!request.signal.aborted) {
        setError(failure instanceof ToolError ? failure : new ToolError('INTERNAL_ERROR', 'Unable to check your IP. Please try again.'));
      }
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, [clearCopyFeedback]);

  useEffect(() => {
    void lookup();
    return () => activeRequest.current?.abort();
  }, [lookup]);

  function copyIp() {
    if (!result) return;
    void copyText(result.ip);
  }

  return <Stack gap="xl">
    <Stack component="section" aria-labelledby="tool-title" gap="sm">
      <Text size="xs" c="var(--mantine-primary-color-filled)" fw={700}>{t($ => $.common.tools)}</Text>
      <Title order={1} id="tool-title">{t($ => $.ip.title)}</Title>
      <Text c="dimmed">{t($ => $.ip.description)}</Text>
      <Text size="sm" c="var(--mantine-primary-color-filled)">{t($ => $.ip.online)}</Text>
    </Stack>
    <Paper component="section" withBorder p={{ base: 'md', sm: 'xl' }} maw={780}
      aria-labelledby="ip-result-heading" aria-busy={loading}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2} size="h3" id="ip-result-heading">{t($ => $.ip.connection)}</Title>
          {result && <Badge variant="light">{result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</Badge>}
        </Group>
        <Stack gap="sm" aria-live="polite" mih={100}>
          {loading && <Group c="dimmed">
            <Loader size="sm" aria-hidden="true" />
            <Text size="sm">{t($ => $.ip.checking)}</Text>
          </Group>}
          {error && <Alert color="red" role="alert">{errorMessage(error, t, locale)}</Alert>}
          {result && <>
            <Text size="xs" c="dimmed">{t($ => $.ip.resultLabel)}</Text>
            <Group justify="space-between">
              <Text component="code" className="network-value" size="xl" fw={600} c="var(--mantine-primary-color-filled)">{result.ip}</Text>
              <ClipboardCopyButton label={t($ => $.ip.copy)} feedback={copyFeedback}
                successMessage={t($ => $.ip.copySuccess)} failureMessage={t($ => $.ip.copyFailure)}
                onCopy={copyIp} onDismiss={clearCopyFeedback} />
            </Group>
          </>}
        </Stack>
        <Button type="button" fullWidth loading={loading} disabled={loading} onClick={() => void lookup()}>
          {loading ? t($ => $.ip.checkingButton) : error ? t($ => $.ip.retry) : t($ => $.ip.refresh)}
        </Button>
      </Stack>
    </Paper>
    <Stack component="section" aria-labelledby="explanation-heading" gap="sm">
      <Title order={2} size="h4" id="explanation-heading">{t($ => $.ip.explanationTitle)}</Title>
      <Text size="sm" c="dimmed">{t($ => $.ip.explanation)}</Text>
      <Text size="sm" c="dimmed">{t($ => $.ip.familyExplanation)}</Text>
    </Stack>
  </Stack>;
}
