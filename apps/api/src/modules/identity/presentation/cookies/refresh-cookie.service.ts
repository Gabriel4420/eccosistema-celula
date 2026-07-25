import { Inject, Injectable } from "@nestjs/common";
import type { CookieOptions, Request, Response } from "express";
import {
  AUTHENTICATION_ENVIRONMENT,
  type AuthEnvironment
} from "../../identity.tokens";
import { AuthError } from "../../domain/auth-error";

const COOKIE_NAME = "mission_atos_refresh";

@Injectable()
export class RefreshCookieService {
  constructor(
    @Inject(AUTHENTICATION_ENVIRONMENT)
    private readonly environment: AuthEnvironment
  ) {}

  read(request: Request): string | undefined {
    const cookies: unknown = request.cookies;
    if (!isStringRecord(cookies)) return undefined;
    const value = cookies[COOKIE_NAME];
    return typeof value === "string" ? value : undefined;
  }

  write(response: Response, token: string): void {
    response.cookie(COOKIE_NAME, token, this.options());
  }

  clear(response: Response): void {
    response.clearCookie(COOKIE_NAME, this.options());
  }

  assertAllowedOrigin(request: Request): void {
    const origin = request.header("origin");
    if (!origin) return;
    const allowed = this.environment.CORS_ORIGINS.split(",").map((value) =>
      value.trim()
    );
    if (!allowed.includes(origin)) {
      throw new AuthError("AUTH_FORBIDDEN", 403, "Origin is not allowed");
    }
  }

  private options(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.environment.AUTH_COOKIE_SECURE,
      sameSite: "strict",
      path: "/auth",
      maxAge: this.environment.REFRESH_TOKEN_TTL_SECONDS * 1000
    };
  }
}

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
