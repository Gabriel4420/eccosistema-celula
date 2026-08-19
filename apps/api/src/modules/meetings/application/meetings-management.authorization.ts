import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { MeetingsManagementError } from "./meetings-management.error";
import type { ManagedMeeting, MeetingListScope } from "./meetings-management.types";
import type {
  MeetingEditLevel,
  MeetingEditPolicy,
  MeetingListScopePolicy,
  MeetingViewPolicy,
} from "../domain/meetings-management.policy";

export class MeetingsManagementAuthorization {
  constructor(
    private readonly listScopePolicy: MeetingListScopePolicy,
    private readonly viewPolicy: MeetingViewPolicy,
    private readonly editPolicy: MeetingEditPolicy,
  ) {}

  resolveListScope(principal: AuthenticatedPrincipal): MeetingListScope {
    const scope = this.listScopePolicy.evaluate(principal);
    if (!scope) this.forbidden();
    return scope;
  }

  assertView(principal: AuthenticatedPrincipal, meeting: ManagedMeeting): void {
    if (!this.viewPolicy.evaluate(principal, meeting)) this.forbidden();
  }

  assertCanEdit(
    principal: AuthenticatedPrincipal,
    meeting: ManagedMeeting
  ): MeetingEditLevel {
    const level = this.editPolicy.evaluate(principal, meeting);
    if (level === "none") this.forbidden();
    return level;
  }

  assertManage(principal: AuthenticatedPrincipal, currentRole: boolean): void {
    const isManager =
      currentRole &&
      (principal.roles.includes("ADMIN") || principal.roles.includes("PASTOR"));
    if (!isManager) this.forbidden();
  }

  private forbidden(): never {
    throw new MeetingsManagementError(
      "MEETING_ACCESS_DENIED",
      "Access is not allowed",
    );
  }
}
