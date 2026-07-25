export type AuthErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_REFRESH_INVALID"
  | "AUTH_UNAUTHENTICATED"
  | "AUTH_FORBIDDEN"
  | "AUTH_RATE_LIMITED"
  | "VALIDATION_ERROR";

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}
