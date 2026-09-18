import type { Response } from "express";
import type { AuthEnvironment } from "../../identity.tokens";
import { RefreshCookieService } from "./refresh-cookie.service";

describe("RefreshCookieService", () => {
  it("keeps a name-prefixed secure cookie scoped to the same-site production proxy", () => {
    const response = { cookie: jest.fn() } as unknown as Response;
    new RefreshCookieService(environment(true)).write(response, "token");

    expect(response.cookie).toHaveBeenCalledWith(
      "__Secure-mission_atos_refresh",
      "token",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        partitioned: true,
        path: "/api/auth",
        maxAge: 259200000
      })
    );
  });

  it("clears the cookie without preserving its lifetime", () => {
    const response = { clearCookie: jest.fn() } as unknown as Response;
    new RefreshCookieService(environment(true)).clear(response);
    expect(response.clearCookie).toHaveBeenCalledWith("__Secure-mission_atos_refresh", expect.objectContaining({ path: "/api/auth", httpOnly: true, secure: true }));
    expect(response.clearCookie).toHaveBeenCalledWith(expect.any(String), expect.not.objectContaining({ maxAge: expect.any(Number) }));
  });

  it("keeps the plain cookie and direct auth path for local development", () => {
    const response = { cookie: jest.fn() } as unknown as Response;
    new RefreshCookieService(environment(false)).write(response, "token");

    expect(response.cookie).toHaveBeenCalledWith(
      "mission_atos_refresh",
      "token",
      expect.objectContaining({
        secure: false,
        sameSite: "lax",
        partitioned: false,
        path: "/auth",
        maxAge: 259200000
      })
    );
  });
});

function environment(secure: boolean): AuthEnvironment {
  return {
    NODE_ENV: secure ? "production" : "test",
    PORT: 3001,
    DATABASE_URL: "postgresql://localhost/test",
    AUTH_CHURCH_ID: "00000000-0000-4000-8000-000000000001",
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_ISSUER: "issuer",
    JWT_AUDIENCE: "audience",
    JWT_ACCESS_TTL_SECONDS: 600,
    AUTH_LOGIN_IP_LIMIT: 10,
    AUTH_LOGIN_ACCOUNT_LIMIT: 5,
    REFRESH_TOKEN_PEPPER: "b".repeat(32),
    REFRESH_TOKEN_TTL_SECONDS: 259200,
    AUTH_COOKIE_SECURE: secure,
    CORS_ORIGINS: "https://eccosistema-celula.vercel.app"
  };
}
