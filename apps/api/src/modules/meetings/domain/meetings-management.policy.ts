import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { MeetingListScope, ManagedMeeting } from "../application/meetings-management.types";

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
  evaluate(principal: AuthenticatedPrincipal, meeting: ManagedMeeting): boolean {
    void meeting;
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
}

export type MeetingEditLevel = "none" | "all";

export class MeetingEditPolicy {
  evaluate(
    principal: AuthenticatedPrincipal,
    meeting: ManagedMeeting
  ): MeetingEditLevel {
    void meeting;
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return "all";
    }
    if (principal.roles.includes("SUPERVISOR")) {
      return "all";
    }
    if (principal.roles.includes("LEADER")) {
      return "all";
    }
    return "none";
  }
}
