import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { ManagePersonPolicy, ManagePersonStatusPolicy, ViewInactivePeoplePolicy, ViewPersonObservationsPolicy, ViewPersonPolicy } from "./people-management.policy";

const principal = (roles: string[], churchId = "church"): AuthenticatedPrincipal => ({
  userId: "user", churchId, sessionId: "session", roles
});

describe("people policies", () => {
  it("enforces tenant on reads", () => {
    const policy = new ViewPersonPolicy();
    expect(policy.evaluate(principal(["LEADER"]), { churchId: "church" })).toBe(true);
    expect(policy.evaluate(principal(["LEADER"]), { churchId: "other" })).toBe(false);
  });

  it("separates manage and status permissions", () => {
    expect(new ManagePersonPolicy().evaluate(principal(["PASTOR"]), true)).toBe(true);
    expect(new ManagePersonStatusPolicy().evaluate(principal(["PASTOR"]), true)).toBe(false);
    expect(new ManagePersonStatusPolicy().evaluate(principal(["ADMIN"]), true)).toBe(true);
    expect(new ManagePersonPolicy().evaluate(principal(["ADMIN"]), false)).toBe(false);
  });

  it.each([
    ["ADMIN", true, true], ["PASTOR", false, true], ["SUPERVISOR", false, false], ["LEADER", false, false]
  ])("applies inactive and observation policies to %s", (role, inactive, observations) => {
    expect(new ViewInactivePeoplePolicy().evaluate(principal([role]))).toBe(inactive);
    expect(new ViewPersonObservationsPolicy().evaluate(principal([role]))).toBe(observations);
  });
});
