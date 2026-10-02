import { PUBLIC_IP_PATH } from '@packetrove/contracts';

export const fetchApiReference: typeof fetch = (input, init) => {
  const request = new Request(input, init);
  return fetch(request, {
    credentials: 'omit',
    cache: new URL(request.url).pathname === PUBLIC_IP_PATH ? 'no-store' : request.cache,
  });
};
