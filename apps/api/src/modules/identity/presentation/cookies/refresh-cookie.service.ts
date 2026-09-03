import { Inject, Injectable } from "@nestjs/common";
import type { CookieOptions, Request, Response } from "express";
import {
  AUTHENTICATION_ENVIRONMENT,
  type AuthEnvironment
} from "../../identity.tokens";
import { AuthError } from "../../domain/auth-error";

const COOKIE_NAME_PREFIX = "__Secure-mission_atos_refresh";
const COOKIE_NAME_PLAIN = "mission_atos_refresh";

@Injectable()
export class RefreshCookieService {
  constructor(
    @Inject(AUTHENTICATION_ENVIRONMENT)
    private readonly environment: AuthEnvironment
  ) {}

  read(request: Request): string | undefined {
    const cookies: unknown = request.cookies;
    if (!isStringRecord(cookies)) return undefined;
    const value = cookies[this.cookieName];
    return typeof value === "string" ? value : undefined;
  }

  write(response: Response, token: string): void {
    response.cookie(this.cookieName, token, this.options());
  }

  clear(response: Response): void {
    response.clearCookie(this.cookieName, this.options());
  }

  assertAllowedOrigin(request: Request): void {
    const origin = request.header("origin");
    if (!origin) return;
    const allowed = this.environment.CORS_ORIGINS.split(",").map((value) =>
      value.trim()
    );
    if (!allowed.includes(origin)) {
      throw new AuthError("AUTH_FORBIDDEN", "Origin is not allowed");
    }
  }

  private get cookieName(): string {
    return this.environment.AUTH_COOKIE_SECURE
      ? COOKIE_NAME_PREFIX
      : COOKIE_NAME_PLAIN;
  }

  private options(): CookieOptions {
    const secure = this.environment.AUTH_COOKIE_SECURE;
    return {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: secure ? "/api/auth" : "/auth",
      // CHIPS partitioned cookies require Secure; without it browsers reject
      // the Set-Cookie, which would silently break refresh over plain HTTP.
      partitioned: secure,
      maxAge: this.environment.REFRESH_TOKEN_TTL_SECONDS * 1000
    };
  }
}

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
