import { getQueryClient } from "@/src/shared/api/query-client";

export interface CacheStore {
  get<T>(key: string): T | undefined;
  set(key: string, value: unknown, ttlMs?: number): void;
  delete(key: string): void;
  invalidatePrefix(prefix: string): void;
  clear(): void;
}

/**
 * Facade over the shared TanStack QueryClient. Preserves the historic
 * (name, key) cache API so mutation call sites stay unchanged while all
 * reads/writes land in the same store used by `useRemoteQuery`.
 */
export function cacheStore(name: string): CacheStore {
  const client = getQueryClient();

  const matchesName = (queryKey: unknown): queryKey is readonly unknown[] =>
    Array.isArray(queryKey) && queryKey[0] === name;

  return {
    get<T>(key: string): T | undefined {
      return client.getQueryData<T>([name, key]);
    },
    set(key: string, value: unknown): void {
      client.setQueryData([name, key], value);
    },
    delete(key: string): void {
      client.removeQueries({
        predicate: (query) =>
          matchesName(query.queryKey) && query.queryKey[1] === key
      });
    },
    invalidatePrefix(prefix: string): void {
      client.invalidateQueries({
        predicate: (query) =>
          matchesName(query.queryKey) &&
          typeof query.queryKey[1] === "string" &&
          query.queryKey[1].startsWith(prefix)
      });
    },
    clear(): void {
      client.removeQueries({ predicate: (query) => matchesName(query.queryKey) });
    }
  };
}

export function clearAllCaches(): void {
  getQueryClient().clear();
}