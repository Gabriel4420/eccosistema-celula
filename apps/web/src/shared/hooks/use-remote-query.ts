"use client";

import { useQuery } from "@tanstack/react-query";
import { isRetryableError } from "@/src/shared/api/query-client";

interface UseRemoteQueryOptions<T> {
  readonly fetcher: () => Promise<T>;
  readonly cacheName: string;
  readonly cacheKey: string;
  readonly ttlMs?: number;
  readonly enabled?: boolean;
}

interface UseRemoteQueryState<T> {
  readonly data: T | undefined;
  readonly loading: boolean;
  readonly error: Error | null;
  readonly reload: () => Promise<void>;
}

/**
 * TanStack Query-backed data hook. Keeps the historic (cacheName, cacheKey)
 * surface so all callers stay untouched while gaining stale-while-revalidate,
 * request deduplication and background refetch from React Query.
 */
export function useRemoteQuery<T>({
  fetcher,
  cacheName,
  cacheKey,
  ttlMs = 30_000,
  enabled = true
}: UseRemoteQueryOptions<T>): UseRemoteQueryState<T> {
  const result = useQuery<T, Error>({
    queryKey: [cacheName, cacheKey],
    queryFn: fetcher,
    staleTime: ttlMs,
    retry: (failureCount, error) =>
      failureCount < 1 && isRetryableError(error),
    enabled
  });

  return {
    data: result.data,
    loading: result.isPending,
    error: result.error ?? null,
    reload: async () => {
      await result.refetch();
    }
  };
}