type Listener = () => void;
const methods = ['pushState', 'replaceState'] as const;
let subscription: { listeners: Set<Listener>; restore: () => void } | undefined;

// Some embedded views write query strings and fragments without browser events.
// Observe those writes without turning them into application navigation.
export function subscribeHistoryWrites(listener: Listener) {
  if (!subscription) {
    const listeners = new Set<Listener>();
    const history = window.history;
    const originals = { pushState: history.pushState, replaceState: history.replaceState };
    const wrappers = {} as typeof originals;
    for (const method of methods) {
      wrappers[method] = function (this: History, ...args: Parameters<History[typeof method]>) {
        const result = Reflect.apply(originals[method], this, args);
        for (const callback of listeners) {
          try { callback(); } catch { /* Observers cannot change History semantics. */ }
        }
        return result;
      };
      history[method] = wrappers[method];
    }
    subscription = { listeners, restore: () => {
      for (const method of methods) if (history[method] === wrappers[method]) history[method] = originals[method];
    } };
  }
  const current = subscription;
  current.listeners.add(listener);
  return () => {
    current.listeners.delete(listener);
    if (!current.listeners.size && subscription === current) {
      current.restore();
      subscription = undefined;
    }
  };
}
