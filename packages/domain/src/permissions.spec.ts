import { belongsToPrincipalChurch } from "./permissions";

describe("tenant authorization", () => {
  const principal = {
    userId: "user",
    churchId: "church-a",
    sessionId: "session",
    roles: ["LEADER"]
  };

  it("allows the same church", () => {
    expect(belongsToPrincipalChurch(principal, { churchId: "church-a" })).toBe(
      true
    );
  });

  it("denies another church", () => {
    expect(belongsToPrincipalChurch(principal, { churchId: "church-b" })).toBe(
      false
    );
  });
});
