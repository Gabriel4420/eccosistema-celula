interface CacheEntry {
  readonly value: unknown;
  readonly expiresAt: number;
}

export interface CacheStore {
  get<T>(key: string): T | undefined;
  set(key: string, value: unknown, ttlMs: number): void;
  delete(key: string): void;
  invalidatePrefix(prefix: string): void;
  clear(): void;
}

const stores = new Map<string, Map<string, CacheEntry>>();

export function cacheStore(name: string): CacheStore {
  const existing = stores.get(name);
  if (existing) return wrap(name, existing);
  const inner = new Map<string, CacheEntry>();
  stores.set(name, inner);
  return wrap(name, inner);
}

function wrap(name: string, inner: Map<string, CacheEntry>): CacheStore {
  const isExpired = (entry: CacheEntry) => entry.expiresAt <= Date.now();
  return {
    get<T>(key: string): T | undefined {
      const entry = inner.get(key);
      if (!entry) return undefined;
      if (isExpired(entry)) {
        inner.delete(key);
        return undefined;
      }
      return entry.value as T;
    },
    set(key: string, value: unknown, ttlMs: number): void {
      inner.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    delete(key: string): void {
      inner.delete(key);
    },
    invalidatePrefix(prefix: string): void {
      for (const key of inner.keys()) {
        if (key.startsWith(prefix)) inner.delete(key);
      }
    },
    clear(): void {
      inner.clear();
    }
  };
}

export function clearAllCaches(): void {
  stores.clear();
}
