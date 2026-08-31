import { presentUser } from "./user.presenter";

describe("user presenter", () => {
  it("uses an allowlist that excludes security fields", () => {
    const result = presentUser({
      id: "user",
      churchId: "church",
      firstName: "Ana",
      lastName: "Silva",
      email: "ana@example.com",
      status: "ACTIVE",
      hasProfilePhoto: false,
      profilePhotoUpdatedAt: null,
      roles: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z")
    });
    expect(result).not.toHaveProperty("churchId");
    expect(result).not.toHaveProperty("passwordHash");
  });
});
