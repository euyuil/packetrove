import { resources } from './resources';
import { localizedPath, type Locale, type Page } from './routes';

export const WEBSITE_ORIGIN = 'https://packetrove.com';

export function getPageMetadata(locale: Locale, page: Page, path: string) {
  const translations = resources[locale].translation;
  const { title, description } = translations.meta[page];
  const image = WEBSITE_ORIGIN + '/packetrove-social-preview-1280x640.png';
  const meta: Array<{ attribute: 'name' | 'property'; key: string; content: string }> = [
    { attribute: 'name', key: 'description', content: description },
    { attribute: 'property', key: 'og:type', content: 'website' },
    { attribute: 'property', key: 'og:site_name', content: 'Packetrove' },
    { attribute: 'property', key: 'og:title', content: title },
    { attribute: 'property', key: 'og:description', content: description },
    { attribute: 'property', key: 'og:image', content: image },
    { attribute: 'property', key: 'og:image:type', content: 'image/png' },
    { attribute: 'property', key: 'og:image:width', content: '1280' },
    { attribute: 'property', key: 'og:image:height', content: '640' },
    { attribute: 'property', key: 'og:image:alt', content: translations.meta.imageAlt },
    { attribute: 'name', key: 'twitter:card', content: 'summary_large_image' },
    { attribute: 'name', key: 'twitter:title', content: title },
    { attribute: 'name', key: 'twitter:description', content: description },
    { attribute: 'name', key: 'twitter:image', content: image },
    { attribute: 'name', key: 'twitter:image:alt', content: translations.meta.imageAlt },
  ];
  const links: Array<{ rel: 'canonical' | 'alternate'; href: string; hreflang?: string }> = [];
  if (page !== 'notFound') {
    const url = WEBSITE_ORIGIN + localizedPath(path, locale);
    meta.push({ attribute: 'property', key: 'og:url', content: url });
    links.push({ rel: 'canonical', href: url });
    for (const language of ['en', 'zh-Hans', 'x-default'] as const) {
      links.push({ rel: 'alternate', hreflang: language,
        href: WEBSITE_ORIGIN + localizedPath(path, language === 'x-default' ? 'en' : language) });
    }
  }
  return { lang: locale, title, meta, links };
}
