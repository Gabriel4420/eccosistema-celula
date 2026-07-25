import {
  changePasswordRequestSchema,
  loginRequestSchema
} from "./auth";

describe("authentication contracts", () => {
  it("normalizes a login email", () => {
    expect(
      loginRequestSchema.parse({
        email: " USER@EXAMPLE.COM ",
        password: "not-validated-at-login"
      }).email
    ).toBe("user@example.com");
  });

  it("rejects equal passwords", () => {
    expect(() =>
      changePasswordRequestSchema.parse({
        currentPassword: "same-password",
        newPassword: "same-password"
      })
    ).toThrow();
  });
});
