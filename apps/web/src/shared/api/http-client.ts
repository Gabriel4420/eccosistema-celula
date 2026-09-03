import type { ApiError } from "./api-error";
import { toApiError } from "./api-error";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface HttpRequestConfig {
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: unknown;
  readonly formData?: FormData;
  readonly timeoutMs?: number;
}

export interface HttpResult<T = unknown> {
  readonly status: number;
  readonly data: T | null;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function httpRequest<T>(config: HttpRequestConfig): Promise<HttpResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );

  let response: Response;
  try {
    const isMultipart = config.formData !== undefined;
    response = await fetch(config.url, {
      method: config.method,
      headers: {
        ...(config.body !== undefined && !isMultipart ? { "content-type": "application/json" } : {}),
        ...config.headers
      },
      body: isMultipart ? config.formData : config.body !== undefined ? JSON.stringify(config.body) : undefined,
      credentials: "include",
      cache: "no-store",
      signal: controller.signal
    });
  } catch (error) {
    throw toApiError(error);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) {
    return { status: 204, data: null };
  }

  const data = await readJson(response);
  return { status: response.status, data: data as T };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw toApiError(new Error("Invalid JSON response"));
  }
}

export type { ApiError };
