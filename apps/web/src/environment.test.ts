import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { prepareLocale } from './i18n/locale-resources';
import { getPageMetadata } from './i18n/page-metadata';
import { renderPageMetadata, renderRobotsText, renderSitemap, websitePages } from './seo';
import { getMcpGuide, getMcpToolContent } from './mcp-guide';
import { getApiUrl } from './api';
import { resources } from './i18n/resources';

afterEach(() => { vi.unstubAllEnvs(); });
beforeAll(() => prepareLocale('zh-Hans'));

it.each(['dev', 'staging'])('keeps %s page metadata, API requests, and MCP examples in the same environment', name => {
  const website = `https://${name}.packetrove.com`;
  const api = `https://api.${name}.packetrove.com`;
  vi.stubEnv('VITE_WEBSITE_ORIGIN', website);
  vi.stubEnv('VITE_API_ORIGIN', api);
  const metadata = getPageMetadata('zh-Hans', 'cidr', '/cidr-cover');
  expect(metadata.links.every(link => new URL(link.href).origin === website)).toBe(true);
  expect(renderPageMetadata('/cidr-cover')).toContain(`href="${website}/cidr-cover"`);
  expect(renderSitemap()).toBeUndefined();
  expect(renderRobotsText()).toBe('User-agent: *\nDisallow: /\n');
  expect(getApiUrl('/v1/public-ip')).toBe(`${api}/v1/public-ip`);
  const guide = getMcpGuide('en', getApiUrl('/mcp'));
  expect(guide.identity.metadata.websiteUrl).toBe(website);
  expect(guide.identity.metadata.icons[0]!.src).toBe(`${website}/packetrove-logo-32x32.png`);
  expect(getMcpToolContent('cidr', 'en').resourceLink.uri).toBe(`${website}/cidr-cover`);
  const prefix = name === 'dev' ? '[DEV] ' : '[STAGING] ';
  for (const page of websitePages) {
    const copy = resources[page.locale].translation;
    const expectedTitle = prefix + copy.meta[page.page].title;
    const document = new DOMParser().parseFromString(renderPageMetadata(page.pathname), 'text/html');
    expect(document.title).toBe(expectedTitle);
    expect(document.querySelectorAll('title')).toHaveLength(1);
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(expectedTitle);
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe(expectedTitle);
  }
});
