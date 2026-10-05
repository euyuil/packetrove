import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { getWebsiteOrigin } from './i18n/page-metadata';
import { getWebsiteEnvironment } from './website-environment';

export function EnvironmentBadge() {
  const { t } = useTranslation();
  const environment = getWebsiteEnvironment(getWebsiteOrigin());
  if (!environment) return null;
  const label = t($ => $.common.environment[environment.name].label);
  const description = t($ => $.common.environment[environment.name].description);
  return <Badge component="span" role="note" data-environment={environment.name}
    aria-label={label + ': ' + description} title={description}
    color={environment.color} variant="filled" autoContrast size="lg" radius="sm" tt="none"
    style={{ flexShrink: 0 }}>
    {label}
  </Badge>;
}
