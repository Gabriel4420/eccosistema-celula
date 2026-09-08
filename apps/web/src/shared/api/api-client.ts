import type { z } from "zod";
import { ApiError, normalizeHttpError, toApiError } from "./api-error";
import { httpRequest } from "./http-client";
import type { HttpMethod } from "./http-client";
import { RefreshCoordinator } from "@/src/shared/auth/refresh-coordinator";
import type { RefreshResult } from "@/src/shared/auth/refresh-coordinator";

export interface RefreshTokenPayload {
  readonly accessToken: string;
  readonly expiresIn: number;
}

export interface ApiClientDependencies {
  readonly baseUrl: string;
  readonly onSessionEnded: () => void;
  readonly onError?: (error: ApiError) => void;
  readonly refreshRequest?: () => Promise<RefreshTokenPayload | null>;
  readonly timeoutMs?: number;
}

export interface RequestOptions<T> {
  readonly method: HttpMethod;
  readonly path: string;
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly body?: unknown;
  readonly formData?: FormData;
  readonly headers?: Readonly<Record<string, string>>;
  readonly schema?: z.ZodType<T>;
  readonly bearer?: boolean;
  readonly allowRetry?: boolean;
  readonly timeoutMs?: number;
}

export interface UploadFileOptions<T> {
  readonly file: File;
  readonly fieldName?: string;
  readonly path: string;
  readonly schema?: z.ZodType<T>;
  readonly bearer?: boolean;
  readonly headers?: Readonly<Record<string, string>>;
  readonly allowRetry?: boolean;
  readonly timeoutMs?: number;
}

interface SuccessEnvelope {
  readonly data: unknown;
}

/**
 * HTTP client that owns the access token and single-flight refresh
 * coordination. The token lives only in memory inside this instance; nothing
 * touches storage or logs. When a schema is provided it validates the full
 * response envelope (`{ data, meta }`) against the shared contract.
 */
export class ApiClient {
  private token: string | null = null;
  private coordinator: RefreshCoordinator | null = null;
  private sessionEndedHandler: () => void;
  private errorHandler: (error: ApiError) => void;

  constructor(private readonly deps: ApiClientDependencies) {
    this.sessionEndedHandler = deps.onSessionEnded;
    this.errorHandler = deps.onError ?? (() => undefined);
  }

  setSessionEndedHandler(handler: () => void): void {
    this.sessionEndedHandler = handler;
  }

  setErrorHandler(handler: (error: ApiError) => void): void {
    this.errorHandler = handler;
  }

  setAccessToken(accessToken: string, expiresIn: number): void {
    this.token = accessToken;
    const expiresAtMs = Date.now() + expiresIn * 1000;
    if (!this.coordinator) {
      this.coordinator = new RefreshCoordinator({
        refresh: () => this.runRefresh(),
        onRefreshed: (result) => {
          this.token = result.accessToken;
          this.coordinator?.reschedule();
        },
        onExpired: () => {
          this.sessionEndedHandler();
        }
      });
    }
    this.coordinator.install(expiresAtMs, expiresIn);
  }

  clearAccessToken(): void {
    this.coordinator?.dispose();
    this.coordinator = null;
    this.token = null;
  }

  getAccessToken(): string | null {
    return this.token;
  }

  refreshIfWithinMargin(): Promise<boolean> | null {
    return this.coordinator?.refreshIfWithinMargin() ?? null;
  }

  async request<T>(options: RequestOptions<T>): Promise<T> {
    let token: string | null = null;
    if (options.bearer) {
      token = this.getAccessToken();
      if (!token) {
        this.sessionEndedHandler();
        throw new ApiError({
          status: null,
          code: "AUTH_UNAUTHENTICATED",
          message: "Sua sessão foi encerrada.",
          details: {},
          retryable: false
        });
      }
    }

    let attempts = 0;
    for (;;) {
      try {
        const result = await this.send(options, token);
        if (result.status >= 200 && result.status < 300) {
          return this.parse(result.status, result.data, options);
        }
        throw normalizeHttpError(result.status, result.data);
      } catch (error) {
        const apiError = toApiError(error);
        if (attempts === 0 && options.bearer && apiError.status === 401) {
          attempts += 1;
          if (!this.coordinator) {
            this.sessionEndedHandler();
          } else {
            const refreshed = await this.coordinator.refresh();
            if (refreshed) {
              token = this.getAccessToken();
              continue;
            }
          }
        }
        if (attempts === 0 && options.allowRetry && apiError.retryable) {
          attempts += 1;
          continue;
        }
        if (!(options.bearer && apiError.status === 401)) {
          this.errorHandler(apiError);
        }
        throw apiError;
      }
    }
  }

  private async runRefresh(): Promise<RefreshResult | null> {
    if (!this.deps.refreshRequest) return null;
    const payload = await this.deps.refreshRequest();
    if (!payload) return null;
    return {
      accessToken: payload.accessToken,
      expiresAtMs: Date.now() + payload.expiresIn * 1000
    };
  }

  async downloadFile(options: Omit<RequestOptions<unknown>, "schema">): Promise<Blob> {
    const token = options.bearer ? this.getAccessToken() : null;
    if (options.bearer && !token) {
      this.sessionEndedHandler();
      throw new ApiError({
        status: null,
        code: "AUTH_UNAUTHENTICATED",
        message: "Sua sessão foi encerrada.",
        details: {},
        retryable: false
      });
    }
    const url = buildUrl(this.deps.baseUrl, options.path, options.query);
    const response = await fetch(url, {
      method: options.method,
      headers: {
        ...options.headers,
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      credentials: "include",
      cache: "no-store"
    });
    if (!response.ok) {
      const data = await readJsonSafe(response);
      throw normalizeHttpError(response.status, data);
    }
    return response.blob();
  }

  uploadFile<T>(options: UploadFileOptions<T>): Promise<T> {
    const formData = new FormData();
    formData.append(options.fieldName ?? "file", options.file, options.file.name);
    return this.request({
      method: "POST",
      path: options.path,
      formData,
      headers: options.headers,
      schema: options.schema,
      bearer: options.bearer,
      allowRetry: options.allowRetry,
      timeoutMs: options.timeoutMs
    });
  }

  private async send(
    options: RequestOptions<unknown>,
    token: string | null
  ): Promise<{ status: number; data: unknown }> {
    const url = buildUrl(this.deps.baseUrl, options.path, options.query);
    return httpRequest({
      method: options.method,
      url,
      headers: {
        ...options.headers,
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: options.body,
      formData: options.formData,
      timeoutMs: options.timeoutMs ?? this.deps.timeoutMs
    });
  }

  private parse<T>(
    status: number,
    data: unknown,
    options: RequestOptions<T>
  ): T {
    if (!options.schema) return data as T;
    if (status === 204) return data as T;
    const envelope = data as SuccessEnvelope;
    if (envelope && typeof envelope === "object" && "data" in envelope) {
      try {
        return options.schema.parse(data);
      } catch {
        throw new ApiError({
          status,
          code: "INVALID_RESPONSE",
          message: "A resposta do servidor não está no formato esperado.",
          details: {},
          retryable: false
        });
      }
    }
    throw new ApiError({
      status,
      code: "INVALID_RESPONSE",
      message: "A resposta do servidor não está no formato esperado.",
      details: {},
      retryable: false
    });
  }
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Readonly<Record<string, string | number | boolean | undefined>>
): string {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === "" || value === false) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function readJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
