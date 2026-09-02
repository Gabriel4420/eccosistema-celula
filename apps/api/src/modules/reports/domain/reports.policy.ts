import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { ReportsScope } from "../application/reports.types";

export class ReportsScopePolicy {
  evaluate(principal: AuthenticatedPrincipal): ReportsScope | null {
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return { kind: "church" };
    }
    if (principal.roles.includes("SUPERVISOR")) {
      return { kind: "supervisor", userId: principal.userId };
    }
    if (principal.roles.includes("LEADER")) {
      return { kind: "leader", userId: principal.userId };
    }
    return null;
  }
}
