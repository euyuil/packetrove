import { useRef, type MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Group, Menu } from '@mantine/core';
import { tools } from '@packetrove/contracts';
import { IconBook, IconChevronDown, IconHome } from '@tabler/icons-react';
import { localizedPath, pagePaths, type Locale, type Page } from './i18n/routes';
import { ToolIcon } from './ToolIcon';

export function ToolNavigation({ page, locale, onNavigate }: {
  page: Page; locale: Locale; onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { t } = useTranslation();
  const trigger = useRef<HTMLButtonElement>(null);
  const entries = [
    { page: 'home', path: pagePaths.home, label: t($ => $.common.home),
      icon: <IconHome size={18} stroke={1.75} aria-hidden="true" focusable="false" /> },
    ...tools.map(tool => ({ page: tool.page, path: tool.webPath, label: t($ => $[tool.page].title),
      icon: <ToolIcon tool={tool.page} size={18} /> })),
    { page: 'mcp', path: pagePaths.mcp, label: t($ => $.mcp.navigation),
      icon: <IconBook size={18} stroke={1.75} aria-hidden="true" focusable="false" /> },
  ];
  const current = entries.find(entry => entry.page === page);
  const label = current?.label ?? (page === 'api' ? t($ => $.api.title) : t($ => $.common.notFound));

  return <Box component="nav" aria-label={t($ => $.common.navigation)}>
    <Group gap="sm" visibleFrom="sm">
      {entries.map(entry => <Button key={entry.page} component="a" href={localizedPath(entry.path, locale)}
        onClick={onNavigate} leftSection={entry.icon} variant={page === entry.page ? 'light' : 'default'}
        aria-current={page === entry.page ? 'page' : undefined}>{entry.label}</Button>)}
    </Group>
    <Box hiddenFrom="sm">
      <Menu position="bottom-start" width="target" returnFocus={false} shadow="sm">
        <Menu.Target>
          <Button ref={trigger} variant="light" fullWidth h="auto" py="xs" aria-label={t($ => $.common.navigation) + ': ' + label}
            leftSection={current?.icon} rightSection={<IconChevronDown size={18} aria-hidden="true" />}
            styles={{ inner: { justifyContent: 'space-between' }, label: { whiteSpace: 'normal', height: 'auto', textAlign: 'left' } }}>
            {label}
          </Button>
        </Menu.Target>
        <Menu.Dropdown onKeyDown={event => { if (event.key === 'Escape') trigger.current?.focus(); }}>
          {entries.map(entry => <Menu.Item key={entry.page} component="a" href={localizedPath(entry.path, locale)}
            leftSection={entry.icon} aria-current={page === entry.page ? 'page' : undefined}
            styles={{ itemLabel: { whiteSpace: 'normal' } }} onClick={event => {
              if (entry.page === page || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
                trigger.current?.focus();
              }
              onNavigate(event);
            }}>{entry.label}</Menu.Item>)}
        </Menu.Dropdown>
      </Menu>
    </Box>
  </Box>;
}
