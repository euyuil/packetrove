import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL, SUPPORT_URL, TERMS_OF_SERVICE_URL } from '@packetrove/contracts';
import { App } from './App';
import { render } from './test-utils';
import { supportedLocales } from './i18n/locales';
import { resources } from './i18n/resources';
import { localizedPath, pagePaths } from './i18n/routes';
import { websitePages } from './seo';

const sourceCommit = '0123456789abcdef0123456789abcdef01234567';

afterEach(() => {
  cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
  window.sessionStorage.clear();
});

it.each(supportedLocales.flatMap(locale => (['support', 'terms'] as const).map(page => ({ locale, page }))))(
  'opens $locale $page from the footer with working contact and policy links, without tool requests', ({ locale, page }) => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    vi.stubEnv('VITE_GITHUB_REPOSITORY', 'example-owner/packetrove');
    vi.stubEnv('VITE_GIT_COMMIT', sourceCommit);
    window.history.replaceState({}, '', localizedPath(pagePaths.home, locale));
    render(<App />);
    const text = resources[locale].translation;
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('link', { name: text[page].title }));
    expect(window.location.pathname).toBe(localizedPath(pagePaths[page], locale));
    const main = screen.getByRole('main', { name: text[page].title });
    expect(document.activeElement).toBe(main);
    expect(within(main).getByRole('heading', { level: 1, name: text[page].title })).toBeDefined();
    expect(main.querySelector(`a[href="mailto:${SUPPORT_EMAIL}"]`)).not.toBeNull();
    expect(within(main).getByRole('link', { name: text.privacy.title }).getAttribute('href'))
      .toBe(localizedPath(pagePaths.privacy, locale));
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: text[page].title }).getAttribute('aria-current'))
      .toBe('page');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://packetrove.com' + localizedPath(pagePaths[page], locale));
    if (page === 'support') {
      expect(within(main).getByRole('link', { name: text.common.reportBug }).getAttribute('href'))
        .toBe('https://github.com/example-owner/packetrove/issues/new?template=bug-report.yml');
      expect(within(main).getByRole('link', { name: text.common.requestFeature }).getAttribute('href'))
        .toBe('https://github.com/example-owner/packetrove/issues/new?template=feature-request.yml');
    } else {
      expect(within(main).getByRole('link', { name: text.support.title }).getAttribute('href'))
        .toBe(localizedPath(pagePaths.support, locale));
      expect(within(main).getByRole('link', { name: text.common.sourceLicense }).getAttribute('href'))
        .toBe(`https://github.com/example-owner/packetrove/blob/${sourceCommit}/LICENSE`);
    }
    fireEvent.click(within(main).getByRole('link', { name: text.privacy.title }));
    const privacy = screen.getByRole('main', { name: text.privacy.title });
    expect(privacy.textContent).toContain(text.privacy.sections.correspondence.body);
    fireEvent.click(within(privacy).getByRole('link', { name: text.support.title }));
    expect(window.location.pathname).toBe(localizedPath(pagePaths.support, locale));
    expect(fetch).not.toHaveBeenCalled();
  });

it.each(websitePages.filter(page => page.page === 'support' || page.page === 'terms'))(
  'prerenders the complete $pathname page with contact, metadata, and policy links', async page => {
    const html = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), '../dist', page.entry), 'utf8');
    const document = new DOMParser().parseFromString(html, 'text/html');
    const text = resources[page.locale].translation;
    const main = document.querySelector('main')!;
    const content = page.page === 'support' ? [text.support.introduction, text.support.contactBody,
      text.support.publicBody, text.support.detailsBody, text.support.guidesBody]
      : [text.terms.introduction, text.terms.updated, text.terms.contactBody, ...Object.values(text.terms.sections).flatMap(section => [section.title, section.body])];
    expect(main.querySelectorAll('h1')).toHaveLength(1);
    for (const value of content) expect(main.textContent).toContain(value);
    expect(main.querySelector(`a[href="mailto:${SUPPORT_EMAIL}"]`)).not.toBeNull();
    expect(main.querySelector(`a[href="${localizedPath(pagePaths.privacy, page.locale)}"]`)).not.toBeNull();
    expect(document.querySelector('link[rel="canonical"]')!.getAttribute('href'))
      .toBe('https://packetrove.com' + page.pathname);
    expect(document.querySelectorAll('link[rel="alternate"][hreflang]')).toHaveLength(supportedLocales.length + 1);
    expect(main.querySelector('form')).toBeNull();
    expect(html).not.toMatch(/\{\{[^{}]*\}\}/);
  });

it('keeps a calculator input and result when visiting support and terms', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  window.history.replaceState({}, '', pagePaths.cidr);
  render(<App />);
  const text = resources.en.translation;
  fireEvent.change(screen.getByRole('textbox', { name: text.cidr.inputLabel }), { target: { value: '203.0.113.1\n203.0.113.2' } });
  fireEvent.click(screen.getByRole('button', { name: text.cidr.calculate }));
  for (const page of ['support', 'terms'] as const) {
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('link', { name: text[page].title }));
    fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: text.cidr.title }));
    expect((screen.getByRole('textbox', { name: text.cidr.inputLabel }) as HTMLTextAreaElement).value)
      .toBe('203.0.113.1\n203.0.113.2');
    expect(screen.getByText('203.0.113.0/30')).toBeDefined();
  }
  expect(fetch).not.toHaveBeenCalled();
});

it('aligns plugin policy URLs with the registered English website pages while publisher names remain pending', async () => {
  const manifest = JSON.parse(await readFile(resolve(dirname(fileURLToPath(import.meta.url)), '../../../plugins/packetrove/plugin.json'), 'utf8'));
  const listing = manifest.extensions['com.openai'].interface;
  expect(listing).toMatchObject({ supportURL: SUPPORT_URL, privacyPolicyURL: PRIVACY_POLICY_URL, termsOfServiceURL: TERMS_OF_SERVICE_URL });
  for (const [page, url] of [['support', listing.supportURL], ['privacy', listing.privacyPolicyURL], ['terms', listing.termsOfServiceURL]]) {
    expect(websitePages.find(entry => entry.locale === 'en' && entry.page === page)?.pathname)
      .toBe(new URL(url).pathname);
  }
  expect(manifest.author.name).toBeUndefined();
  expect(listing.developerName).toBeUndefined();
});
