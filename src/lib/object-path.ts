/** Lodash-style `get` for dotted paths (e.g. `a.b.c`). */
export function get(obj: unknown, path: string, defaultValue?: unknown): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const k of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[k];
  }
  if (current === undefined) return defaultValue;
  return current;
}

/** Returns true if every segment of `path` exists on nested plain objects. */
export function has(obj: unknown, path: string): boolean {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const k of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }
    if (!Object.prototype.hasOwnProperty.call(current, k)) return false;
    current = (current as Record<string, unknown>)[k];
  }
  return true;
}
