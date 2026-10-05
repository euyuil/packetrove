export function getWebsiteEnvironment(websiteOrigin: string) {
  switch (new URL(websiteOrigin).hostname) {
    case 'dev.packetrove.com':
      return { name: 'development', color: 'violet' } as const;
    case 'staging.packetrove.com':
      return { name: 'staging', color: 'yellow' } as const;
    default:
      return undefined;
  }
}
