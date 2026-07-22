import { parseWebPublicEnvironment } from "./public";
import { parseServerEnvironment } from "./server";

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
});
