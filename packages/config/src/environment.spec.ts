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
      REFRESH_TOKEN_TTL_SECONDS: 2_592_000,
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
});
