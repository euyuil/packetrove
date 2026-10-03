// Cache immutable modules only. Application drafts belong to ToolDraftProvider.
export function createResourceCache<Key extends string, Value>(loaders: Record<Key, () => Promise<Value>>) {
  const ready = new Map<Key, Value>();
  const pending = new Map<Key, Promise<Value>>();
  return {
    has: (key: Key) => ready.has(key),
    get(key: Key): Value {
      if (!ready.has(key)) throw new Error('Resource must be prepared before rendering: ' + key);
      return ready.get(key)!;
    },
    load(key: Key): Promise<Value> {
      if (ready.has(key)) return Promise.resolve(ready.get(key)!);
      const existing = pending.get(key);
      if (existing) return existing;
      const promise = Promise.resolve().then(loaders[key]).then(value => {
        ready.set(key, value);
        return value;
      }).finally(() => { pending.delete(key); });
      pending.set(key, promise);
      return promise;
    },
  };
}
