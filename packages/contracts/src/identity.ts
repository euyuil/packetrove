// Shared service identity. Per-tool names, paths, and metadata belong to the tool catalog.
export const PUBLIC_WEBSITE_ORIGIN = 'https://packetrove.com';
export const SUPPORT_EMAIL = 'hello@packetrove.com';
export const SUPPORT_PATH = '/support';
export const SUPPORT_URL = new URL(SUPPORT_PATH, PUBLIC_WEBSITE_ORIGIN).href;
export const TERMS_OF_SERVICE_PATH = '/terms';
export const TERMS_OF_SERVICE_URL = new URL(TERMS_OF_SERVICE_PATH, PUBLIC_WEBSITE_ORIGIN).href;
export const PRIVACY_POLICY_PATH = '/privacy';
export const PRIVACY_POLICY_URL = new URL(PRIVACY_POLICY_PATH, PUBLIC_WEBSITE_ORIGIN).href;

const name = 'Packetrove';

export const PACKETROVE_IDENTITY = {
  name,
  title: name,
  description: 'Open-source IP address and CIDR tools for network calculations and public IP lookup.',
  websiteUrl: PUBLIC_WEBSITE_ORIGIN,
  icons: [{
    src: new URL('/packetrove-logo-32x32.png', PUBLIC_WEBSITE_ORIGIN).href,
    mimeType: 'image/png',
    sizes: ['32x32'],
  }],
};

export function publicOrigin(value: string): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
    || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('A public HTTP or HTTPS origin without credentials, a path, query, or fragment is required.');
  }
  return url.origin;
}

// Dynamic responses must use the configured service origin, not request headers.
export function getNonProductionCrawlerPolicy(origin?: string) {
  if (!origin || !/^(?:api\.)?(?:dev|staging)\.packetrove\.com$/.test(new URL(publicOrigin(origin)).hostname)) {
    return undefined;
  }
  return { robotsText: 'User-agent: *\nDisallow: /\n', robotsTag: 'noindex' } as const;
}

export function getServiceIdentity(websiteOrigin = PUBLIC_WEBSITE_ORIGIN) {
  const origin = publicOrigin(websiteOrigin);
  return { ...PACKETROVE_IDENTITY, websiteUrl: origin,
    icons: PACKETROVE_IDENTITY.icons.map(icon => ({ ...icon, src: new URL(new URL(icon.src).pathname, origin).href })),
  };
}
