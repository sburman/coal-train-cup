/**
 * In-memory TTL cache for serverless. Per-instance; invalidate explicitly after writes.
 * In Next.js dev, hot reload re-runs modules and would clear the cache every time,
 * causing a burst of Sheets reads and 429s. Attach to globalThis so cache survives HMR.
 */
const CACHE_KEY = "__CTC_CACHE__";
function getStore(): Map<string, { value: unknown; expiresAt: number }> {
  if (typeof globalThis !== "undefined" && (globalThis as Record<string, unknown>)[CACHE_KEY]) {
    return (globalThis as Record<string, unknown>)[CACHE_KEY] as Map<string, { value: unknown; expiresAt: number }>;
  }
  const store = new Map<string, { value: unknown; expiresAt: number }>();
  if (typeof globalThis !== "undefined") (globalThis as Record<string, unknown>)[CACHE_KEY] = store;
  return store;
}
const store = getStore();

export function get<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function set<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function invalidate(key: string): void {
  store.delete(key);
}

export function invalidatePrefix(prefix: string): void {
  Array.from(store.keys()).forEach((k) => {
    if (k.startsWith(prefix)) store.delete(k);
  });
}

export function invalidateAll(): void {
  store.clear();
}
