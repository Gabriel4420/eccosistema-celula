import {
  createUserRequestSchema,
  listUsersQuerySchema,
  managedRoleNames,
  managedRoleSchema,
  managedRolesEnvelopeSchema,
  profilePhotoRequestSchema,
  profilePhotoEnvelopeSchema,
  replaceUserRolesRequestSchema,
  resetUserPasswordRequestSchema,
  updateUserRequestSchema,
  updateOwnProfileRequestSchema,
  userItemEnvelopeSchema,
  userPageEnvelopeSchema,
  userResponseSchema
} from "./users";

const baseUser = {
  id: "00000000-0000-4000-8000-000000000001",
  firstName: "Ana",
  lastName: "Silva",
  email: "ana@example.com",
  status: "ACTIVE",
  hasProfilePhoto: false,
  profilePhotoUpdatedAt: null,
  roles: [{ id: "00000000-0000-4000-8000-000000000002", name: "LEADER" }],
  createdAt: "2026-08-03T12:00:00.000Z",
  updatedAt: "2026-08-03T12:00:00.000Z"
};

describe("user contracts", () => {
  it("normalizes email and supplies pagination defaults", () => {
    expect(listUsersQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
    expect(
      createUserRequestSchema.parse({
        firstName: " Ana ",
        lastName: " Silva ",
        email: " ANA@EXAMPLE.COM ",
        initialPassword: "Safe-password-123!",
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

  it("requires a strong initial password for a new user", () => {
    const input = {
      firstName: "Ana",
      lastName: "Silva",
      email: "ana@example.com",
      roleIds: []
    };
    expect(() => createUserRequestSchema.parse({ ...input, initialPassword: "long-password-123" })).toThrow();
    expect(createUserRequestSchema.parse({ ...input, initialPassword: "Strong-password-123!" }).initialPassword).toBe("Strong-password-123!");
  });

  it("parses a single user response with presenter parity", () => {
    expect(userResponseSchema.parse(baseUser)).toEqual(baseUser);
    expect(
      userItemEnvelopeSchema.parse({
        data: baseUser,
        meta: {}
      }).data
    ).toEqual(baseUser);
  });

  it("parses a user page envelope with pagination metadata", () => {
    const page = userPageEnvelopeSchema.parse({
      data: [baseUser],
      meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    });
    expect(page.meta.totalPages).toBe(1);
    expect(() =>
      userPageEnvelopeSchema.parse({
        data: [baseUser],
        meta: { page: 1, pageSize: 20, totalItems: 1 }
      })
    ).toThrow();
  });

  it("rejects unknown fields and invalid statuses in user responses", () => {
    expect(() =>
      userResponseSchema.parse({ ...baseUser, churchId: crypto.randomUUID() })
    ).toThrow();
    expect(() =>
      userResponseSchema.parse({ ...baseUser, status: "DELETED" })
    ).toThrow();
  });

  it("restricts managed roles to canonical names", () => {
    const role = {
      id: "00000000-0000-4000-8000-000000000003",
      name: "ADMIN"
    };
    expect(managedRoleSchema.parse(role)).toEqual(role);
    expect(managedRoleNames).toContain("LEADER");
    expect(() => managedRoleSchema.parse({ ...role, name: "OWNER" })).toThrow();
    expect(
      managedRolesEnvelopeSchema.parse({ data: [role], meta: {} }).data
    ).toEqual([role]);
  });

  it("accepts supported profile photos and rejects oversized payloads", () => {
    expect(profilePhotoRequestSchema.parse({ contentType: "image/jpeg", base64: "/9j/AA==" })).toEqual({
      contentType: "image/jpeg", base64: "/9j/AA=="
    });
    expect(() => profilePhotoRequestSchema.parse({ contentType: "image/svg+xml", base64: "PHN2Zz4=" })).toThrow();
    expect(profilePhotoEnvelopeSchema.parse({ data: null, meta: {} }).data).toBeNull();
  });
});
