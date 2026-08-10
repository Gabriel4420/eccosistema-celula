import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { ManagedUser } from "./user-management.types";
import { UserManagementError } from "./user-management.error";
import type { UserManagementRepository } from "./user-management.port";
import type { ManageUserPolicy } from "../domain/user-management.policy";

export class UserManagementAuthorization {
  constructor(
    private readonly users: UserManagementRepository,
    private readonly policy: ManageUserPolicy
  ) {}

  async assertAdministrator(principal: AuthenticatedPrincipal): Promise<void> {
    if (
      !principal.roles.includes("ADMIN") ||
      !(await this.users.isActiveAdministrator(principal.churchId, principal.userId))
    ) {
      this.forbidden();
    }
  }

  assertManager(principal: AuthenticatedPrincipal): void {
    if (
      !principal.roles.includes("ADMIN") &&
      !principal.roles.includes("PASTOR")
    ) {
      this.forbidden();
    }
  }

  assertCurrentAdministrator(
    principal: AuthenticatedPrincipal,
    isActiveAdministrator: boolean
  ): void {
    if (!principal.roles.includes("ADMIN") || !isActiveAdministrator) {
      this.forbidden();
    }
  }

  assertResource(
    principal: AuthenticatedPrincipal,
    resource: ManagedUser
  ): void {
    if (!this.policy.evaluate(principal, resource)) {
      this.forbidden();
    }
  }

  private forbidden(): never {
    throw new UserManagementError("AUTH_FORBIDDEN", "Access is not allowed");
  }
}
