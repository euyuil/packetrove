import type { ComponentType, MouseEventHandler } from 'react';
import { isToolPage } from '@packetrove/contracts';
import { isToolPagePrepared, prepareToolPage } from './ToolPageView';
import { isLocalePrepared, prepareLocale } from './i18n/locale-resources';
import { resolveRoute } from './i18n/routes';
import { createResourceCache } from './resource-cache';

type PageProps = {
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
  documentationUrl: string;
  sourceUrl: string;
};
const otherPages = createResourceCache<'home' | 'api' | 'mcp' | 'privacy', ComponentType<PageProps>>({
  home: () => import('./HomePage').then(module => module.HomePage),
  api: () => import('./ApiDocumentation').then(module => module.default),
  mcp: () => import('./McpDocumentation').then(module => module.McpDocumentation),
  privacy: () => import('./PrivacyPolicy').then(module => module.PrivacyPolicy),
});

export const getPreparedPage = (page: 'home' | 'api' | 'mcp' | 'privacy') => otherPages.get(page);

export function isRoutePrepared(pathname: string) {
  const { locale, page } = resolveRoute(pathname);
  return isLocalePrepared(locale) && (isToolPage(page) ? isToolPagePrepared(page)
    : page === 'notFound' || otherPages.has(page));
}

export async function prepareRoute(pathname: string) {
  const { locale, page } = resolveRoute(pathname);
  await Promise.all([prepareLocale(locale), isToolPage(page) ? prepareToolPage(page)
    : page === 'notFound' ? Promise.resolve() : otherPages.load(page)]);
}
