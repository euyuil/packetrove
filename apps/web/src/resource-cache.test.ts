import { expect, it, vi } from 'vitest';
import { createResourceCache } from './resource-cache';
import { deferred } from './test-utils';

it('loads only requested resources, shares pending requests, and retains stable values', async () => {
  const request = deferred<object>();
  const first = vi.fn(() => request.promise);
  const other = vi.fn(async () => ({}));
  const cache = createResourceCache({ first, other });
  expect(cache.has('first')).toBe(false);
  expect(() => cache.get('first')).toThrow('prepared');
  const loading = cache.load('first');
  expect(cache.load('first')).toBe(loading);
  const component = {};
  request.resolve(component);
  expect(await loading).toBe(component);
  expect(cache.get('first')).toBe(component);
  expect(await cache.load('first')).toBe(component);
  expect(first).toHaveBeenCalledTimes(1);
  expect(other).not.toHaveBeenCalled();
});

it('discards a rejected pending request so another attempt can succeed', async () => {
  const load = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValue('ready');
  const cache = createResourceCache({ page: load });
  await expect(cache.load('page')).rejects.toThrow('Unavailable');
  expect(cache.has('page')).toBe(false);
  expect(await cache.load('page')).toBe('ready');
  expect(cache.get('page')).toBe('ready');
  expect(load).toHaveBeenCalledTimes(2);
});
