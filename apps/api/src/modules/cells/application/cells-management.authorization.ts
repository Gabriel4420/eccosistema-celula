import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CellsManagementError } from "./cells-management.error";
import type { CellListScope, ManagedCell } from "./cells-management.types";
import type {
  CellEditPolicy,
  CellListScopePolicy,
  CellViewPolicy,
  CellEditLevel,
} from "../domain/cells-management.policy";

export class CellsManagementAuthorization {
  constructor(
    private readonly listScopePolicy: CellListScopePolicy,
    private readonly viewPolicy: CellViewPolicy,
    private readonly editPolicy: CellEditPolicy,
  ) {}

  resolveListScope(principal: AuthenticatedPrincipal): CellListScope {
    const scope = this.listScopePolicy.evaluate(principal);
    if (!scope) this.forbidden();
    return scope;
  }

  assertView(principal: AuthenticatedPrincipal, cell: ManagedCell): void {
    if (!this.viewPolicy.evaluate(principal, cell)) this.forbidden();
  }

  assertCanEdit(
    principal: AuthenticatedPrincipal,
    cell: ManagedCell,
  ): CellEditLevel {
    const level = this.editPolicy.evaluate(principal, cell);
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
    throw new CellsManagementError(
      "CELL_ACCESS_DENIED",
      "Access is not allowed",
    );
  }
}
