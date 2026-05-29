type Listener = () => void;

const listeners = new Set<Listener>();

export function onUnauthorized(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitUnauthorized() {
  listeners.forEach((fn) => fn());
}
