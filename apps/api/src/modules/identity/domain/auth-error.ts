import { PublicApplicationError } from "@mission-atos/domain";

export type AuthErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_REFRESH_INVALID"
  | "AUTH_UNAUTHENTICATED"
  | "AUTH_FORBIDDEN"
  | "AUTH_RATE_LIMITED"
  | "VALIDATION_ERROR";

export class AuthError extends PublicApplicationError<AuthErrorCode> {
  constructor(
    code: AuthErrorCode,
    message: string
  ) {
    super(code, message);
    this.name = "AuthError";
  }
}
