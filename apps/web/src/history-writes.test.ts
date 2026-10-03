import { afterEach, expect, it, vi } from 'vitest';
import { subscribeHistoryWrites } from './history-writes';

const originalPush = window.history.pushState;
const originalReplace = window.history.replaceState;
const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const stop of cleanups.splice(0)) stop();
  window.history.pushState = originalPush;
  window.history.replaceState = originalReplace;
  window.history.replaceState(null, '', '/');
});

it('shares a wrapper between subscribers and restores it only after the last unsubscription', () => {
  const first = vi.fn();
  const second = vi.fn();
  const stopFirst = subscribeHistoryWrites(first);
  const wrapper = window.history.pushState;
  const stopSecond = subscribeHistoryWrites(second);
  cleanups.push(stopFirst, stopSecond);
  expect(window.history.pushState).toBe(wrapper);
  window.history.pushState(null, '', '/?one');
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  stopFirst();
  expect(window.history.pushState).toBe(wrapper);
  window.history.replaceState(null, '', '/?two');
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(2);
  stopSecond();
  expect(window.history.pushState).toBe(originalPush);
  expect(window.history.replaceState).toBe(originalReplace);
});

it('preserves a later external wrapper and does not notify twice after subscribing again', () => {
  const old = vi.fn();
  const stop = subscribeHistoryWrites(old);
  cleanups.push(stop);
  const nested = window.history.pushState;
  const external = vi.fn(function (this: History, ...args: Parameters<History['pushState']>) {
    return Reflect.apply(nested, this, args);
  });
  window.history.pushState = external;
  stop();
  expect(window.history.pushState).toBe(external);
  const current = vi.fn();
  cleanups.push(subscribeHistoryWrites(current));
  window.history.pushState(null, '', '/?new');
  expect(external).toHaveBeenCalledTimes(1);
  expect(current).toHaveBeenCalledTimes(1);
  expect(old).not.toHaveBeenCalled();
});

it('preserves the receiver, arguments, result, and original exceptions', () => {
  const calls = vi.fn(function (this: History, ...args: Parameters<History['pushState']>) {
    Reflect.apply(originalPush, this, args);
    return 'original result';
  });
  window.history.pushState = calls;
  const listener = vi.fn();
  cleanups.push(subscribeHistoryWrites(listener));
  expect(window.history.pushState({ retained: true }, '', '/?valid')).toBe('original result');
  expect(calls.mock.contexts[0]).toBe(window.history);
  expect(calls).toHaveBeenCalledWith({ retained: true }, '', '/?valid');
  expect(() => window.history.pushState.call({} as History, null, '', '/?invalid')).toThrow();
  expect(listener).toHaveBeenCalledTimes(1);
});

it('does not let an observer exception change a successful History write', () => {
  cleanups.push(subscribeHistoryWrites(() => { throw new Error('Observer failed'); }));
  expect(() => window.history.replaceState(null, '', '/?saved')).not.toThrow();
  expect(window.location.search).toBe('?saved');
});
