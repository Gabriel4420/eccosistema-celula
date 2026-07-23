import { parseWebPublicEnvironment } from "./public";
import {
  parseDatabaseEnvironment,
  parseServerEnvironment,
  parseTestDatabaseEnvironment
} from "./server";

describe("environment configuration", () => {
  it("provides safe local defaults", () => {
    expect(parseServerEnvironment({})).toEqual({
      NODE_ENV: "development",
      PORT: 3001
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
});
