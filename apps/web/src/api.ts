import { PUBLIC_API_ORIGIN } from '@packetrove/contracts';

export function getApiUrl(path: string): string {
  return new URL(path, import.meta.env.VITE_API_ORIGIN || PUBLIC_API_ORIGIN).href;
}
