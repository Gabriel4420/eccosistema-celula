import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { CellsManagementAuthorization } from "./cells-management.authorization";
import { CellsManagementError } from "./cells-management.error";
import type { CellsManagementRepository } from "./cells-management.port";
import type { CellMemberPage, CellPage, ListCellMembersInput, ListCellsInput, ManagedCell } from "./cells-management.types";

export class CellsManagementQueries {
  constructor(
    private readonly cells: CellsManagementRepository,
    private readonly authorization: CellsManagementAuthorization
  ) {}

  list(principal: AuthenticatedPrincipal, input: ListCellsInput): Promise<CellPage> {
    const scope = this.authorization.resolveListScope(principal);
    return this.cells.list(principal.churchId, scope, input);
  }

  async get(principal: AuthenticatedPrincipal, cellId: string): Promise<ManagedCell> {
    const cell = await this.cells.find(principal.churchId, cellId);
    if (!cell) {
      throw new CellsManagementError("CELL_NOT_FOUND", "Cell not found");
    }
    this.authorization.assertView(principal, cell);
    return cell;
  }

  async listMembers(
    principal: AuthenticatedPrincipal,
    cellId: string,
    input: ListCellMembersInput
  ): Promise<CellMemberPage> {
    const cell = await this.cells.find(principal.churchId, cellId);
    if (!cell) {
      throw new CellsManagementError("CELL_NOT_FOUND", "Cell not found");
    }
    this.authorization.assertView(principal, cell);
    return this.cells.listMembers(principal.churchId, cellId, input);
  }
}
