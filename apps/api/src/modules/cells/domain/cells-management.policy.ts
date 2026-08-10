import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { CellListScope, ManagedCell } from "../application/cells-management.types";

export class CellListScopePolicy {
  evaluate(principal: AuthenticatedPrincipal): CellListScope | null {
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

export class CellViewPolicy {
  evaluate(principal: AuthenticatedPrincipal, cell: ManagedCell): boolean {
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return true;
    }
    if (principal.roles.includes("SUPERVISOR")) {
      return cell.supervisor?.id === principal.userId;
    }
    if (principal.roles.includes("LEADER")) {
      return (
        cell.leader?.id === principal.userId ||
        cell.traineeLeader?.id === principal.userId
      );
    }
    return false;
  }
}

export type CellEditLevel = "none" | "meeting" | "all";

export class CellEditPolicy {
  evaluate(
    principal: AuthenticatedPrincipal,
    cell: ManagedCell
  ): CellEditLevel {
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return "all";
    }
    if (principal.roles.includes("SUPERVISOR")) {
      return cell.supervisor?.id === principal.userId ? "meeting" : "none";
    }
    if (principal.roles.includes("LEADER")) {
      const own =
        cell.leader?.id === principal.userId ||
        cell.traineeLeader?.id === principal.userId;
      return own ? "meeting" : "none";
    }
    return "none";
  }
}
