import { PublicApplicationError } from "@mission-atos/domain";

export type CellsManagementErrorCode =
  | "CELL_ACCESS_DENIED"
  | "CELL_NOT_FOUND"
  | "CELL_LEADERSHIP_CANDIDATE_NOT_FOUND"
  | "CELL_LEADER_NOT_ELIGIBLE"
  | "CELL_TRAINEE_NOT_ELIGIBLE"
  | "CELL_SUPERVISOR_NOT_FOUND"
  | "CELL_SUPERVISOR_CONFLICT"
  | "CELL_CODE_CONFLICT"
  | "CELL_LEADERSHIP_CONFLICT"
  | "CELL_STATUS_TRANSITION_INVALID"
  | "IDEMPOTENCY_KEY_CONFLICT";

export class CellsManagementError extends PublicApplicationError<CellsManagementErrorCode> {
  constructor(code: CellsManagementErrorCode, message: string) {
    super(code, message);
    this.name = "CellsManagementError";
  }
}
