import { PublicApplicationError } from "@mission-atos/domain";

export type ReportsErrorCode = "AUTH_FORBIDDEN" | "REPORT_CELL_NOT_FOUND" | "REPORT_EXPORT_FAILED";

export class ReportsError extends PublicApplicationError<ReportsErrorCode> {
  constructor(code: ReportsErrorCode, message: string) {
    super(code, message);
    this.name = "ReportsError";
  }
}
