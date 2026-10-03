export type ConnectionMetadata = Readonly<{
  address: string | null;
  originalIpv6Address: string | null;
}>;

export type ToolExecutionContext = Readonly<{
  connection: ConnectionMetadata;
  signal: AbortSignal;
}>;

/** Snapshot only edge connection metadata; never forward arbitrary request headers. */
export function createToolExecutionContext(request: Request | undefined, callSignal?: AbortSignal): ToolExecutionContext {
  const requestSignal = request?.signal;
  const signal = requestSignal && callSignal && requestSignal !== callSignal
    ? AbortSignal.any([requestSignal, callSignal]) : callSignal ?? requestSignal ?? new AbortController().signal;
  return Object.freeze({
    connection: Object.freeze({
      address: request?.headers.get('cf-connecting-ip') ?? null,
      originalIpv6Address: request?.headers.get('cf-connecting-ipv6') ?? null,
    }),
    signal,
  });
}

export class ToolExecutionCancelledError extends Error {
  constructor() {
    // AbortSignal.reason can contain caller-controlled strings or private data.
    super('The tool call was cancelled.');
    this.name = 'AbortError';
  }
}

export function assertToolExecutionActive(context: ToolExecutionContext) {
  if (context.signal.aborted) throw new ToolExecutionCancelledError();
}
