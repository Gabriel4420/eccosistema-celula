import { OpaqueRefreshTokenService } from "./opaque-refresh-token.service";

describe("OpaqueRefreshTokenService", () => {
  const service = new OpaqueRefreshTokenService({
    NODE_ENV: "test",
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
    REFRESH_TOKEN_TTL_SECONDS: 3600,
    AUTH_COOKIE_SECURE: false,
    CORS_ORIGINS: "http://localhost:3000"
  });

  it("generates unpredictable-looking tokens and deterministic hashes", () => {
    const first = service.generate();
    const second = service.generate();
    expect(first).not.toBe(second);
    expect(service.hash(first)).toHaveLength(64);
    expect(service.hash(first)).toBe(service.hash(first));
    expect(service.hash(first)).not.toContain(first);
  });
});
