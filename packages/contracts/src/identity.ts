// Shared service identity. Per-tool names, paths, and metadata belong to the tool catalog.
export const PUBLIC_WEBSITE_ORIGIN = 'https://packetrove.com';
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
