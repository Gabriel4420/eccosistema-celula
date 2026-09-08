export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;

  constructor({
    code,
    message,
    status,
    details
  }: {
    code: string;
    message: string;
    status: number;
    details: Record<string, unknown>;
  }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message = "Sem conexão com o servidor.") {
    super(message);
    this.name = "NetworkError";
  }
}

type TokenProvider = () => string | null;
type OnUnauthorized = () => void;

let _tokenProvider: TokenProvider = () => null;
let _onUnauthorized: OnUnauthorized = () => {};

export function configureApiClient(opts: {
  tokenProvider: TokenProvider;
  onUnauthorized: OnUnauthorized;
}): void {
  _tokenProvider = opts.tokenProvider;
  _onUnauthorized = opts.onUnauthorized;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
};

export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const token = _tokenProvider();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(opts.headers ?? {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (opts.idempotencyKey) {
    headers["Idempotency-Key"] = opts.idempotencyKey;
  }

  let response: Response;

  try {
    response = await fetch(`${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
    });
  } catch {
    throw new NetworkError();
  }

  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      _onUnauthorized();
      throw new ApiError({
        code: "AUTH_UNAUTHENTICATED",
        message: "Sessão expirada. Faça login novamente.",
        status: 401,
        details: {}
      });
    }

    const errorBody = json as Record<string, unknown> | null;
    const errorData = errorBody?.error as Record<string, unknown> | undefined;

    throw new ApiError({
      code: (errorData?.code as string) ?? "UNKNOWN_ERROR",
      message:
        (errorData?.message as string) ?? "Ocorreu um erro inesperado.",
      status: response.status,
      details: (errorData?.details as Record<string, unknown>) ?? {}
    });
  }

  return json as T;
}