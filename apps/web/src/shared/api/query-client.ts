"use client";

import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-error";

const RETRY_TIMES = 1;
const DEFAULT_STALE_MS = 30_000;
const DEFAULT_GC_MS = 5 * 60_000;

function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) return error.retryable;
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return error instanceof TypeError;
}

function retryDelay(attempt: number): number {
  return Math.min(1_000 * 2 ** attempt, 10_000);
}

let queryClient: QueryClient | null = null;

/**
 * Lazy singleton shared by the provider, the legacy cache facade and session
 * teardown so invalidation always targets the same store.
 */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: DEFAULT_STALE_MS,
          gcTime: DEFAULT_GC_MS,
          retry: (failureCount, error) =>
            failureCount < RETRY_TIMES && isRetryableError(error),
          retryDelay,
          refetchOnWindowFocus: true,
          refetchOnReconnect: true
        }
      }
    });
  }
  return queryClient;
}

export { isRetryableError, DEFAULT_STALE_MS, DEFAULT_GC_MS };