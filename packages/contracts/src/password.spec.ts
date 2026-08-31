import { evaluatePasswordStrength } from "./password";

describe("password strength", () => {
  it("increases the score as requirements are met", () => {
    expect(evaluatePasswordStrength("").score).toBe(0);
    expect(evaluatePasswordStrength("lowercase").score).toBe(1);
    expect(evaluatePasswordStrength("Lowercase").score).toBe(2);
    expect(evaluatePasswordStrength("Lowercase1").score).toBe(3);
    expect(evaluatePasswordStrength("Lowercase1!").score).toBe(4);
    expect(evaluatePasswordStrength("StrongPass1!").score).toBe(5);
  });

  it("only accepts passwords satisfying every requirement", () => {
    expect(evaluatePasswordStrength("StrongPass1!").isValid).toBe(true);
    expect(evaluatePasswordStrength("long-password-1").isValid).toBe(false);
  });
});
