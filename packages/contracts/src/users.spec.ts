import {
  createUserRequestSchema,
  listUsersQuerySchema,
  replaceUserRolesRequestSchema,
  resetUserPasswordRequestSchema,
  updateUserRequestSchema,
  updateOwnProfileRequestSchema
} from "./users";

describe("user contracts", () => {
  it("normalizes email and supplies pagination defaults", () => {
    expect(listUsersQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
    expect(
      createUserRequestSchema.parse({
        firstName: " Ana ",
        lastName: " Silva ",
        email: " ANA@EXAMPLE.COM ",
        initialPassword: "safe-password-123",
        roleIds: []
      }).email
    ).toBe("ana@example.com");
  });

  it("rejects tenant and security fields in own profile", () => {
    expect(() =>
      updateOwnProfileRequestSchema.parse({
        firstName: "Ana",
        churchId: "00000000-0000-4000-8000-000000000001"
      })
    ).toThrow();
  });

  it("rejects duplicate roles, invalid pagination and empty updates", () => {
    const roleId = "00000000-0000-4000-8000-000000000001";
    expect(() =>
      replaceUserRolesRequestSchema.parse({ roleIds: [roleId, roleId] })
    ).toThrow();
    expect(() => listUsersQuerySchema.parse({ pageSize: 101 })).toThrow();
    expect(() => updateUserRequestSchema.parse({})).toThrow();
  });

  it("enforces the password contract and rejects extra fields", () => {
    expect(() =>
      resetUserPasswordRequestSchema.parse({ newPassword: "short" })
    ).toThrow();
    expect(() =>
      resetUserPasswordRequestSchema.parse({
        newPassword: "valid-password-123",
        churchId: "00000000-0000-4000-8000-000000000001"
      })
    ).toThrow();
  });
});
