export interface ApiErrorShape {
  readonly status: number | null;
  readonly code: string;
  readonly message: string;
  readonly details: unknown;
  readonly retryable: boolean;
}

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number | null;
  readonly code: string;
  readonly details: unknown;
  readonly retryable: boolean;

  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = "ApiError";
    this.status = shape.status;
    this.code = shape.code;
    this.details = shape.details;
    this.retryable = shape.retryable;
  }
}

const UNKNOWN_MESSAGE = "Não foi possível concluir a operação. Tente novamente.";

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError({
      status: null,
      code: "TIMEOUT",
      message: "A requisição demorou demais. Tente novamente.",
      details: {},
      retryable: true
    });
  }
  if (error instanceof TypeError) {
    return new ApiError({
      status: null,
      code: "NETWORK_ERROR",
      message: "Falha de conexão com o servidor.",
      details: {},
      retryable: true
    });
  }
  return new ApiError({
    status: null,
    code: "UNKNOWN_ERROR",
    message: UNKNOWN_MESSAGE,
    details: {},
    retryable: false
  });
}

export function normalizeHttpError(status: number, body: unknown): ApiError {
  const envelope = extractErrorEnvelope(body);
  if (envelope) {
    return new ApiError({
      status,
      code: envelope.code,
      message: envelope.message,
      details: envelope.details,
      retryable: status >= 500
    });
  }
  return new ApiError({
    status,
    code: defaultCodeForStatus(status),
    message: messageForStatus(status),
    details: {},
    retryable: status >= 500
  });
}

function extractErrorEnvelope(
  body: unknown
): { code: string; message: string; details: unknown } | null {
  if (
    typeof body !== "object" ||
    body === null ||
    !("error" in body) ||
    typeof body.error !== "object" ||
    body.error === null
  ) {
    return null;
  }
  const error = body.error as Record<string, unknown>;
  return {
    code: typeof error.code === "string" ? error.code : "UNKNOWN_ERROR",
    message: typeof error.message === "string" ? error.message : UNKNOWN_MESSAGE,
    details: "details" in error ? error.details : {}
  };
}

function defaultCodeForStatus(status: number): string {
  if (status === 401) return "AUTH_UNAUTHENTICATED";
  if (status === 403) return "AUTH_FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "AUTH_RATE_LIMITED";
  return "HTTP_ERROR";
}

function messageForStatus(status: number): string {
  if (status === 401) return "Sua sessão expirou. Entre novamente.";
  if (status === 403) return "Você não tem permissão para realizar esta ação.";
  if (status === 404) return "O recurso solicitado não foi encontrado.";
  if (status === 409) return "Conflito com os dados atuais.";
  if (status === 429) return "Muitas tentativas. Aguarde um momento.";
  return UNKNOWN_MESSAGE;
}
