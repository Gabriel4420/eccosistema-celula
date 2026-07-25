import { LoginRateLimiter } from "./login-rate-limiter";

describe("LoginRateLimiter", () => {
  it("limits a normalized account independently of IP", () => {
    const limiter = new LoginRateLimiter();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      limiter.assertAllowed(`192.0.2.${attempt}`, "user@example.com", 1);
    }
    expect(() =>
      limiter.assertAllowed("192.0.2.100", "user@example.com", 1)
    ).toThrow(expect.objectContaining({ code: "AUTH_RATE_LIMITED" }));
  });
});
