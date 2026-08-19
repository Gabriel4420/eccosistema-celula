import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { MeetingsManagementError } from "./meetings-management.error";
import type { MeetingListScope } from "./meetings-management.types";
import type {
  MeetingEditLevel,
  MeetingEditPolicy,
  MeetingListScopePolicy,
  MeetingScopeInfo,
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

  assertView(principal: AuthenticatedPrincipal): void {
    if (!this.viewPolicy.evaluate(principal)) this.forbidden();
  }

  assertViewScope(principal: AuthenticatedPrincipal, scope: MeetingScopeInfo): void {
    try {
      this.viewPolicy.assertScope(principal, scope);
    } catch {
      this.forbidden();
    }
  }

  assertCanEdit(
    principal: AuthenticatedPrincipal
  ): MeetingEditLevel {
    const level = this.editPolicy.evaluate(principal);
    if (level === "none") this.forbidden();
    return level;
  }

  assertEditScope(principal: AuthenticatedPrincipal, scope: MeetingScopeInfo): void {
    try {
      this.editPolicy.assertScope(principal, scope);
    } catch {
      this.forbidden();
    }
  }

  private forbidden(): never {
    throw new MeetingsManagementError(
      "MEETING_ACCESS_DENIED",
      "Access is not allowed",
    );
  }
}
