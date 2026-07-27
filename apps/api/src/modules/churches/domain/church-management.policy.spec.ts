import {
  ManageChurchPolicy,
  ViewChurchPolicy
} from "./church-management.policy";

const principal = {
  userId: crypto.randomUUID(),
  churchId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  roles: ["ADMIN"]
};

describe("church management policies", () => {
  it("allows viewing only the principal church", () => {
    const policy = new ViewChurchPolicy();
    expect(policy.evaluate(principal, { churchId: principal.churchId })).toBe(
      true
    );
    expect(
      policy.evaluate(principal, { churchId: crypto.randomUUID() })
    ).toBe(false);
  });

  it("requires both token role and current active administrator state", () => {
    const policy = new ManageChurchPolicy();
    expect(policy.evaluate(principal, true)).toBe(true);
    expect(policy.evaluate(principal, false)).toBe(false);
    expect(policy.evaluate({ ...principal, roles: ["PASTOR"] }, true)).toBe(
      false
    );
  });
});

