import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { ChurchManagementError } from "./church-management.error";
import type { ManagedChurch } from "./church-management.types";
import type {
  ManageChurchPolicy,
  ViewChurchPolicy
} from "../domain/church-management.policy";

export class ChurchManagementAuthorization {
  constructor(
    private readonly viewPolicy: ViewChurchPolicy,
    private readonly managePolicy: ManageChurchPolicy
  ) {}

  assertView(
    principal: AuthenticatedPrincipal,
    church: ManagedChurch
  ): void {
    if (!this.viewPolicy.evaluate(principal, { churchId: church.id })) {
      this.forbidden();
    }
  }

  assertRole(principal: AuthenticatedPrincipal): void {
    if (!principal.roles.includes("ADMIN")) {
      this.forbidden();
    }
  }

  assertCurrentAdministrator(
    principal: AuthenticatedPrincipal,
    isActiveAdministrator: boolean
  ): void {
    if (!this.managePolicy.evaluate(principal, isActiveAdministrator)) {
      this.forbidden();
    }
  }

  private forbidden(): never {
    throw new ChurchManagementError("AUTH_FORBIDDEN", "Access is not allowed");
  }
}

