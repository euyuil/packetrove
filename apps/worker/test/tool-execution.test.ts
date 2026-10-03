import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { toolCatalog, type PublicIpResult, type RangeToCidrsResult } from '@packetrove/contracts';
import { ToolError } from '@packetrove/core';
import { createToolExecutor, executeTool, toolHandlers, type ToolHandlers } from '../src/tools';
import { createToolExecutionContext, ToolExecutionCancelledError } from '../src/tool-context';

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Value>((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}
const request = (address = '203.0.113.1', signal?: AbortSignal) => new Request('http://localhost/v1/public-ip', {
  headers: { 'cf-connecting-ip': address, authorization: 'test-only-private-header' }, ...(signal ? { signal } : {}),
});

describe('shared awaited tool execution', () => {
  it('infers the result from the selected catalog schema and keeps local computation independent of connection metadata', async () => {
    const result = await executeTool('range', { start: '::', end: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff' },
      createToolExecutionContext(undefined));
    expectTypeOf(result).toEqualTypeOf<RangeToCidrsResult>();
    expect(result.addressCount).toBe('340282366920938463463374607431768211456');
    expect(result.cidrs).toEqual(['::/0']);
    expectTypeOf<ToolHandlers['ip']>().returns.toEqualTypeOf<PublicIpResult | Promise<PublicIpResult>>();
  });

  it('waits for an asynchronous handler and supplies only an immutable metadata snapshot', async () => {
    const result = deferred<PublicIpResult>();
    const handler = vi.fn<ToolHandlers['ip']>((_input, context) => {
      expect(context.connection).toEqual({ address: '203.0.113.1', originalIpv6Address: null });
      expect(Object.keys(context)).toEqual(['connection', 'signal']);
      expect(Object.isFrozen(context)).toBe(true);
      expect(Object.isFrozen(context.connection)).toBe(true);
      return result.promise;
    });
    const execute = createToolExecutor({ ...toolHandlers, ip: handler });
    const original = request();
    const context = createToolExecutionContext(original);
    original.headers.set('cf-connecting-ip', '203.0.113.2');
    let settled = false;
    const pending = execute('ip', {}, context).then(value => { settled = true; return value; });
    await Promise.resolve();
    expect(settled).toBe(false);
    result.resolve(toolCatalog.ip.example.result);
    expect(await pending).toEqual(toolCatalog.ip.example.result);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('keeps delayed concurrent contexts separate, including calls completing in reverse order', async () => {
    const first = deferred<PublicIpResult>();
    const second = deferred<PublicIpResult>();
    const contexts: Array<ReturnType<typeof createToolExecutionContext>> = [];
    const execute = createToolExecutor({ ...toolHandlers, ip: async (_input, context) => {
      contexts.push(context);
      return context.connection.address === '203.0.113.1' ? first.promise : second.promise;
    } });
    const one = execute('ip', {}, createToolExecutionContext(request('203.0.113.1')));
    const two = execute('ip', {}, createToolExecutionContext(request('2001:db8::2')));
    second.resolve({ family: 'ipv6', ip: '2001:db8::2' });
    expect(await two).toEqual({ family: 'ipv6', ip: '2001:db8::2' });
    first.resolve({ family: 'ipv4', ip: '203.0.113.1' });
    expect(await one).toEqual({ family: 'ipv4', ip: '203.0.113.1' });
    expect(contexts[0]).not.toBe(contexts[1]);
    expect(contexts[0]!.signal).not.toBe(contexts[1]!.signal);
  });

  it('preserves structured domain errors from rejected asynchronous handlers', async () => {
    const error = new ToolError('INVALID_INPUT', 'Controlled invalid input.', [{ path: ['nested', 2], message: 'Invalid entry.' }]);
    const execute = createToolExecutor({ ...toolHandlers, ip: async () => { throw error; } });
    await expect(execute('ip', {}, createToolExecutionContext(request()))).rejects.toBe(error);
  });

  it('does not start work that was already cancelled and never exposes an arbitrary abort reason', async () => {
    const controller = new AbortController();
    controller.abort('caller-controlled-private-reason');
    const handler = vi.fn(toolHandlers.ip);
    const execute = createToolExecutor({ ...toolHandlers, ip: handler });
    const error = await execute('ip', {}, createToolExecutionContext(request(undefined, controller.signal))).catch(error => error);
    expect(error).toBeInstanceOf(ToolExecutionCancelledError);
    expect(error.message).toBe('The tool call was cancelled.');
    expect(handler).not.toHaveBeenCalled();
  });

  it.each(['resolve', 'reject'] as const)('discards a late %s after cancellation and waits for handler cleanup', async completion => {
    const controller = new AbortController();
    const result = deferred<PublicIpResult>();
    const cleanup = vi.fn();
    const execute = createToolExecutor({ ...toolHandlers, ip: async () => {
      try { return await result.promise; } finally { cleanup(); }
    } });
    const pending = execute('ip', {}, createToolExecutionContext(request(undefined, controller.signal)));
    const failure = expect(pending).rejects.toMatchObject({ name: 'AbortError', message: 'The tool call was cancelled.' });
    controller.abort({ private: 'untrusted reason' });
    if (completion === 'resolve') result.resolve(toolCatalog.ip.example.result);
    else result.reject(new Error('private late upstream failure'));
    await failure;
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it.each(['http', 'call'] as const)('combines cancellation while keeping separate call signals: $0', source => {
    const http = new AbortController();
    const firstCall = new AbortController();
    const secondCall = new AbortController();
    const httpRequest = request(undefined, http.signal);
    const first = createToolExecutionContext(httpRequest, firstCall.signal);
    const second = createToolExecutionContext(httpRequest, secondCall.signal);
    if (source === 'http') http.abort();
    else firstCall.abort();
    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(source === 'http');
  });
});
