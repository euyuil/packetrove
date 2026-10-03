import { useCallback, useEffect, useRef, useState, type MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { PUBLIC_IP_PATH, type PublicIpResult } from '@packetrove/contracts';
import { lookupPublicIp, ToolError } from '@packetrove/core';
import { getApiUrl } from './api';
import { ClipboardCopyButton } from './ClipboardCopyButton';
import { useClipboardFeedback } from './useClipboardFeedback';
import { errorMessage } from './i18n/errors';
import { resolveLocale } from './i18n/locales';
import { ToolQuestions } from './ToolQuestions';
import { ToolMcpSection } from './ToolMcpSection';
import { ToolPageHeader } from './ToolPageHeader';
import { ToolPanel } from './ToolPanel';
import { NetworkValue } from './NetworkValue';

export function PublicIpTool({ onNavigate }: { onNavigate?: MouseEventHandler<HTMLAnchorElement> } = {}) {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage);
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
    <ToolPageHeader tool="ip" notice={t($ => $.ip.online)} />
    <ToolPanel headingId="ip-result-heading" title={t($ => $.ip.connection)} maw={780} aria-busy={loading}
      headerAside={result && <Badge variant="light">{result.family === 'ipv4' ? 'IPv4' : 'IPv6'}</Badge>}>
      <Stack gap="sm" aria-live="polite" mih={{ base: 136, sm: 112 }} justify="center">
        {loading && <Group c="dimmed">
          <Loader size="sm" aria-hidden="true" />
          <Text size="sm">{t($ => $.ip.checking)}</Text>
        </Group>}
        {error && <Alert color="red" role="alert">{errorMessage(error, t, locale)}</Alert>}
        {result && <>
          <Text size="sm" c="dimmed">{t($ => $.ip.resultLabel)}</Text>
          <Text component="code" className="network-value" fz={{ base: 22, sm: 28 }} fw={600} c="var(--mantine-primary-color-filled)">
            <NetworkValue value={result.ip} />
          </Text>
        </>}
      </Stack>
      <Group gap="sm">
        <ClipboardCopyButton label={t($ => $.ip.copy)} feedback={copyFeedback} variant="filled" disabled={!result || loading}
          successMessage={t($ => $.ip.copySuccess)} failureMessage={t($ => $.ip.copyFailure)}
          onCopy={copyIp} onDismiss={clearCopyFeedback} />
        <Button type="button" variant="default" aria-disabled={loading} {...(loading ? { 'data-disabled': true } : {})}
          leftSection={loading ? <Loader size={16} aria-hidden="true" /> : undefined}
          onClick={() => { if (!loading) void lookup(); }}>
          {loading ? t($ => $.ip.checkingButton) : error ? t($ => $.ip.retry) : t($ => $.ip.refresh)}
        </Button>
      </Group>
    </ToolPanel>
    <Stack component="section" aria-labelledby="explanation-heading" gap="sm">
      <Title order={2} size="h4" id="explanation-heading">{t($ => $.ip.explanationTitle)}</Title>
      <Text size="sm" c="dimmed">{t($ => $.ip.explanation)}</Text>
      <Text size="sm" c="dimmed">{t($ => $.ip.familyExplanation)}</Text>
    </Stack>
    <ToolQuestions tool="ip" />
    <ToolMcpSection tool="ip" onNavigate={onNavigate} />
  </Stack>;
}
