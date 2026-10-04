// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { BundleInputError, type BundleResult } from './checker';
import { useBundleCheck } from './useBundleCheck';

afterEach(cleanup);
const sample: BundleResult = { evaluatedAt: '2026-10-04T06:00:00Z', certificates: [], relationships: [],
  leafIndexes: [], selectedLeafIndex: null, hostname: null, findings: [] };

it('discards an in-flight result after the input changes', async () => {
  let finish!: (result: BundleResult) => void;
  const pending = new Promise<BundleResult>(resolve => { finish = resolve; });
  const checker = () => pending;
  const { result } = renderHook(() => useBundleCheck({ pem: 'old input' }, checker));
  let checking!: Promise<void>;
  act(() => { checking = result.current.inspect({ pem: 'old input' }); });
  act(() => { result.current.replaceInput({ pem: 'new input' }); });
  await act(async () => { finish(sample); await checking; });
  expect(result.current.input.pem).toBe('new input');
  expect(result.current.result).toBeNull();
  expect(result.current.checking).toBe(false);
});

it('discards an older failure when a newer check succeeds', async () => {
  let reject!: (error: Error) => void;
  const checker = ({ pem }: { pem: string }) => pem === 'old' ? new Promise<BundleResult>((_resolve, fail) => { reject = fail; }) : Promise.resolve(sample);
  const { result } = renderHook(() => useBundleCheck({ pem: 'old' }, checker));
  let oldCheck!: Promise<void>;
  act(() => { oldCheck = result.current.inspect({ pem: 'old' }); });
  await act(async () => { await result.current.inspect({ pem: 'new' }); });
  await act(async () => { reject(new BundleInputError('INVALID_PEM', 'Invalid old input.')); await oldCheck; });
  expect(result.current.result).toEqual(sample);
  expect(result.current.error).toBeNull();
  act(() => { result.current.replaceInput({ pem: 'changed' }); });
  expect(result.current.result).toBeNull();
});
