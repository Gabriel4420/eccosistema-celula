import { JwtService } from "@nestjs/jwt";
import { JwtAccessTokenService } from "./jwt-access-token.service";

describe("JwtAccessTokenService", () => {
  const environment = {
    NODE_ENV: "test" as const,
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
  };

  it("issues and validates the minimal claims", async () => {
    const service = new JwtAccessTokenService(new JwtService(), environment);
    const issued = await service.issue({
      userId: "user",
      churchId: "church",
      sessionId: "session",
      roles: ["ROLE"]
    });
    const claims = await service.verify(issued.token);
    expect(claims).toEqual(
      expect.objectContaining({
        userId: "user",
        churchId: "church",
        sessionId: "session",
        roles: ["ROLE"]
      })
    );
    expect(issued.expiresIn).toBe(600);
  });

  it("rejects another audience", async () => {
    const service = new JwtAccessTokenService(new JwtService(), environment);
    const token = await new JwtService().signAsync(
      {
        sub: "user",
        churchId: "church",
        sid: "session",
        roles: [],
        jti: "jti"
      },
      {
        secret: environment.JWT_ACCESS_SECRET,
        issuer: environment.JWT_ISSUER,
        audience: "other",
        expiresIn: 600
      }
    );
    await expect(service.verify(token)).rejects.toBeDefined();
  });
});
