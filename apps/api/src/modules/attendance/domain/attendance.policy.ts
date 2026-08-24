import type { AuthenticatedPrincipal } from "@mission-atos/domain";

export interface AttendanceScope { leaderId: string | null; traineeLeaderId: string | null; supervisorIds: readonly string[]; }

export class AttendancePolicy {
  canView(principal: AuthenticatedPrincipal, scope: AttendanceScope): boolean {
    if (principal.roles.includes("ADMIN") || principal.roles.includes("PASTOR")) return true;
    if (principal.roles.includes("SUPERVISOR")) return scope.supervisorIds.includes(principal.userId);
    if (principal.roles.includes("LEADER")) return scope.leaderId === principal.userId || scope.traineeLeaderId === principal.userId;
    return false;
  }
  canEdit(principal: AuthenticatedPrincipal, scope: AttendanceScope): boolean {
    if (principal.roles.includes("ADMIN") || principal.roles.includes("PASTOR")) return true;
    return principal.roles.includes("LEADER") && scope.leaderId === principal.userId;
  }
}
