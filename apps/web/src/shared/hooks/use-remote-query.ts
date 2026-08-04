"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cacheStore } from "@/src/shared/cache/cache";

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

export function useRemoteQuery<T>({
  fetcher,
  cacheName,
  cacheKey,
  ttlMs = 30_000,
  enabled = true
}: UseRemoteQueryOptions<T>): UseRemoteQueryState<T> {
  const store = cacheStore(cacheName);
  const initial = store.get<T>(cacheKey);
  const [data, setData] = useState<T | undefined>(initial);
  const [loading, setLoading] = useState<boolean>(initial === undefined);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const value = await fetcherRef.current();
      store.set(cacheKey, value, ttlMs);
      setData(value);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [store, cacheKey, ttlMs]);

  useEffect(() => {
    if (!enabled) return;
    if (store.get<T>(cacheKey) !== undefined) return;
    let cancelled = false;
    void (async () => {
      try {
        const value = await fetcherRef.current();
        if (cancelled) return;
        store.set(cacheKey, value, ttlMs);
        setData(value);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause : new Error("Unknown error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, store, cacheKey, ttlMs]);

  return { data, loading, error, reload: load };
}
