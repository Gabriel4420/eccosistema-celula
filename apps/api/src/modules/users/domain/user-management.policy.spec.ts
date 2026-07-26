import {
  ManageRolePolicy,
  ManageUserPolicy,
  PreserveLastAdministratorPolicy
} from "./user-management.policy";

describe("ManageUserPolicy", () => {
  const policy = new ManageUserPolicy();
  const principal = {
    userId: "user",
    churchId: "church-a",
    sessionId: "session",
    roles: ["ADMIN"]
  };

  it("requires ADMIN in the same church", () => {
    expect(policy.evaluate(principal, { churchId: "church-a" })).toBe(true);
    expect(policy.evaluate(principal, { churchId: "church-b" })).toBe(false);
    expect(policy.evaluate({ ...principal, roles: ["PASTOR"] }, { churchId: "church-a" })).toBe(false);
    expect(policy.evaluate(principal, undefined)).toBe(false);
  });

  it("allows only the approved managed role catalogue", () => {
    const roles = new ManageRolePolicy([
      "ADMIN",
      "PASTOR",
      "SUPERVISOR",
      "LEADER"
    ]);
    expect(roles.evaluate(["ADMIN", "LEADER"])).toBe(true);
    expect(roles.evaluate(["SUPER_ADMIN"])).toBe(false);
  });

  it("preserves the last active administrator", () => {
    const policy = new PreserveLastAdministratorPolicy();
    expect(
      policy.canRemove({
        targetIsAdministrator: true,
        targetIsActive: true,
        activeAdministratorCount: 1
      })
    ).toBe(false);
    expect(
      policy.canRemove({
        targetIsAdministrator: true,
        targetIsActive: false,
        activeAdministratorCount: 1
      })
    ).toBe(true);
    expect(
      policy.canRemove({
        targetIsAdministrator: true,
        targetIsActive: true,
        activeAdministratorCount: 2
      })
    ).toBe(true);
  });
});
