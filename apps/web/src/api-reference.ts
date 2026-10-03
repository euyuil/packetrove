import { tools } from '@packetrove/contracts';

const noStorePaths = new Set<string>(tools.filter(tool => tool.api.response.headers?.['Cache-Control']?.value === 'no-store')
  .map(tool => tool.api.path));

export const fetchApiReference: typeof fetch = (input, init) => {
  const request = new Request(input, init);
  return fetch(request, {
    credentials: 'omit',
    cache: noStorePaths.has(new URL(request.url).pathname) ? 'no-store' : request.cache,
  });
};
