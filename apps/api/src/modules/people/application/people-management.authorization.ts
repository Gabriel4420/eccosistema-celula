import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type {
  ManagePersonPolicy,
  ManagePersonStatusPolicy,
  ViewInactivePeoplePolicy,
  ViewPersonObservationsPolicy,
  ViewPersonPolicy
} from "../domain/people-management.policy";
import { PeopleManagementError } from "./people-management.error";
import type { ManagedPerson } from "./people-management.types";

export class PeopleManagementAuthorization {
  constructor(
    private readonly viewPolicy: ViewPersonPolicy,
    private readonly managePolicy: ManagePersonPolicy,
    private readonly statusPolicy: ManagePersonStatusPolicy,
    private readonly inactivePolicy: ViewInactivePeoplePolicy,
    private readonly observationsPolicy: ViewPersonObservationsPolicy
  ) {}

  assertView(principal: AuthenticatedPrincipal, person: ManagedPerson): void {
    if (!this.viewPolicy.evaluate(principal, person)) this.forbidden();
  }

  assertList(principal: AuthenticatedPrincipal, status: "ACTIVE" | "INACTIVE"): void {
    if (status === "INACTIVE" && !this.inactivePolicy.evaluate(principal)) this.forbidden();
  }

  assertManage(principal: AuthenticatedPrincipal, currentRole: boolean): void {
    if (!this.managePolicy.evaluate(principal, currentRole)) this.forbidden();
  }

  assertStatus(principal: AuthenticatedPrincipal, currentRole: boolean): void {
    if (!this.statusPolicy.evaluate(principal, currentRole)) this.forbidden();
  }

  canViewObservations(principal: AuthenticatedPrincipal): boolean {
    return this.observationsPolicy.evaluate(principal);
  }

  private forbidden(): never {
    throw new PeopleManagementError("AUTH_FORBIDDEN", "Access is not allowed");
  }
}
