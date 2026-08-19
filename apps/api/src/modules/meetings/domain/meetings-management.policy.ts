import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { MeetingListScope } from "../application/meetings-management.types";

export interface MeetingScopeInfo {
  leaderId: string | null;
  traineeLeaderId: string | null;
  supervisorId: string | null;
}

export class MeetingListScopePolicy {
  evaluate(principal: AuthenticatedPrincipal): MeetingListScope | null {
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

export class MeetingViewPolicy {
  evaluate(principal: AuthenticatedPrincipal): boolean {
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return true;
    }
    if (principal.roles.includes("SUPERVISOR")) {
      return true;
    }
    if (principal.roles.includes("LEADER")) {
      return true;
    }
    return false;
  }

  assertScope(
    principal: AuthenticatedPrincipal,
    scope: MeetingScopeInfo
  ): void {
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return;
    }
    if (principal.roles.includes("SUPERVISOR")) {
      if (scope.supervisorId === principal.userId) return;
      throw new Error("OUT_OF_SCOPE");
    }
    if (principal.roles.includes("LEADER")) {
      if (scope.leaderId === principal.userId) return;
      if (scope.traineeLeaderId === principal.userId) return;
      throw new Error("OUT_OF_SCOPE");
    }
    throw new Error("OUT_OF_SCOPE");
  }
}

export type MeetingEditLevel = "none" | "all";

export class MeetingEditPolicy {
  evaluate(
    principal: AuthenticatedPrincipal
  ): MeetingEditLevel {
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return "all";
    }
    if (principal.roles.includes("LEADER")) {
      return "all";
    }
    return "none";
  }

  assertScope(
    principal: AuthenticatedPrincipal,
    scope: MeetingScopeInfo
  ): void {
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return;
    }
    if (principal.roles.includes("LEADER")) {
      if (scope.leaderId === principal.userId) return;
      if (scope.traineeLeaderId === principal.userId) return;
      throw new Error("OUT_OF_SCOPE");
    }
    throw new Error("OUT_OF_SCOPE");
  }
}
