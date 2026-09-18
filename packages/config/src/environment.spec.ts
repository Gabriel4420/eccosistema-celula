import { parseWebPublicEnvironment } from "./public";
import {
  parseAuthenticationEnvironment,
  parseDatabaseEnvironment,
  parseServerEnvironment,
  parseTestDatabaseEnvironment
} from "./server";

describe("environment configuration", () => {
  it("provides safe local defaults", () => {
    expect(parseServerEnvironment({})).toEqual({
      NODE_ENV: "development",
      PORT: 3001,
      JWT_ISSUER: "mission-atos-api",
      JWT_AUDIENCE: "mission-atos-clients",
      JWT_ACCESS_TTL_SECONDS: 600,
      AUTH_LOGIN_IP_LIMIT: 10,
      AUTH_LOGIN_ACCOUNT_LIMIT: 5,
      REFRESH_TOKEN_TTL_SECONDS: 259_200,
      AUTH_COOKIE_SECURE: false,
      CORS_ORIGINS: "http://localhost:3000"
    });
    expect(parseWebPublicEnvironment({})).toEqual({
      NEXT_PUBLIC_API_URL: "http://localhost:3001"
    });
  });

  it("rejects invalid values without exposing them", () => {
    expect(() => parseServerEnvironment({ PORT: "70000" })).toThrow();
    expect(() =>
      parseWebPublicEnvironment({ NEXT_PUBLIC_API_URL: "not-a-url" })
    ).toThrow();
  });

  it("validates database URLs only when database commands require them", () => {
    expect(
      parseDatabaseEnvironment({
        DATABASE_URL: "postgresql://user:password@localhost:5432/app"
      })
    ).toEqual({
      DATABASE_URL: "postgresql://user:password@localhost:5432/app"
    });
    expect(() => parseDatabaseEnvironment({})).toThrow();
    expect(() =>
      parseDatabaseEnvironment({ DATABASE_URL: "mysql://localhost/app" })
    ).toThrow();
  });

  it("rejects a test URL that does not identify a test database", () => {
    expect(
      parseTestDatabaseEnvironment({
        TEST_DATABASE_URL: "postgresql://user:password@localhost:5432/app_test"
      })
    ).toEqual({
      TEST_DATABASE_URL: "postgresql://user:password@localhost:5432/app_test"
    });
    expect(() =>
      parseTestDatabaseEnvironment({
        TEST_DATABASE_URL: "postgresql://user:password@localhost:5432/app"
      })
    ).toThrow();
  });

  it("requires distinct authentication secrets", () => {
    expect(() =>
      parseAuthenticationEnvironment({
        DATABASE_URL: "postgresql://localhost/example",
        AUTH_CHURCH_ID: "00000000-0000-4000-8000-000000000001",
        JWT_ACCESS_SECRET: "a".repeat(32),
        REFRESH_TOKEN_PEPPER: "a".repeat(32)
      })
    ).toThrow("Authentication secrets must be distinct");
  });

  it("rejects placeholder authentication secrets", () => {
    const valid = {
      DATABASE_URL: "postgresql://localhost/example",
      AUTH_CHURCH_ID: "00000000-0000-4000-8000-000000000001",
      JWT_ACCESS_SECRET: "a".repeat(32),
      REFRESH_TOKEN_PEPPER: "b".repeat(32)
    };
    expect(() =>
      parseAuthenticationEnvironment({
        ...valid,
        JWT_ACCESS_SECRET: "replace-with-some-secret-value-here"
      })
    ).toThrow("JWT_ACCESS_SECRET must not be a placeholder value");
    expect(() =>
      parseAuthenticationEnvironment({
        ...valid,
        REFRESH_TOKEN_PEPPER: "replace-with-a-different-secret-here"
      })
    ).toThrow("REFRESH_TOKEN_PEPPER must not be a placeholder value");
    expect(() =>
      parseAuthenticationEnvironment({
        ...valid,
        AUTH_CHURCH_ID: "replace-with-a-church-id-uuid"
      })
    ).toThrow("AUTH_CHURCH_ID must not be a placeholder value");
  });

  it("forces secure auth cookies in production", () => {
    const valid = {
      DATABASE_URL: "postgresql://localhost/example",
      AUTH_CHURCH_ID: "00000000-0000-4000-8000-000000000001",
      JWT_ACCESS_SECRET: "a".repeat(32),
      REFRESH_TOKEN_PEPPER: "b".repeat(32)
    };
    expect(() =>
      parseAuthenticationEnvironment({
        ...valid,
        NODE_ENV: "production",
        AUTH_COOKIE_SECURE: "false"
      })
    ).toThrow("AUTH_COOKIE_SECURE must be true in production");
    expect(
      parseAuthenticationEnvironment({
        ...valid,
        NODE_ENV: "production",
        AUTH_COOKIE_SECURE: "true"
      }).AUTH_COOKIE_SECURE
    ).toBe(true);
    expect(
      parseAuthenticationEnvironment({
        ...valid,
        NODE_ENV: "development",
        AUTH_COOKIE_SECURE: "false"
      }).AUTH_COOKIE_SECURE
    ).toBe(false);
  });
});
