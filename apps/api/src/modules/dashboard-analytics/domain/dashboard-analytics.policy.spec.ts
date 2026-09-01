import { DashboardAnalyticsScopePolicy } from "./dashboard-analytics.policy";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";

function principal(roles: string[], userId = "user-1"): AuthenticatedPrincipal {
  return { userId, churchId: "church-1", sessionId: "session-1", roles };
}

const policy = new DashboardAnalyticsScopePolicy();

describe("DashboardAnalyticsScopePolicy", () => {
  it("assigns the church scope to ADMIN and PASTOR", () => {
    expect(policy.evaluate(principal(["ADMIN"]))).toEqual({ kind: "church" });
    expect(policy.evaluate(principal(["PASTOR"]))).toEqual({ kind: "church" });
  });

  it("assigns the supervisor scope to SUPERVISOR", () => {
    expect(policy.evaluate(principal(["SUPERVISOR"], "sup-1"))).toEqual({ kind: "supervisor", userId: "sup-1" });
  });

  it("assigns the leader scope to LEADER", () => {
    expect(policy.evaluate(principal(["LEADER"], "lead-1"))).toEqual({ kind: "leader", userId: "lead-1" });
  });

  it("denies roles outside the hierarchy", () => {
    expect(policy.evaluate(principal(["MEMBER"]))).toBeNull();
  });
});
