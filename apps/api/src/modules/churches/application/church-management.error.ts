import { PublicApplicationError } from "@mission-atos/domain";

export type ChurchManagementErrorCode =
  | "CHURCH_NOT_FOUND"
  | "CHURCH_SLUG_CONFLICT"
  | "CHURCH_SLUG_RESERVED"
  | "AUTH_FORBIDDEN";

export class ChurchManagementError extends PublicApplicationError<ChurchManagementErrorCode> {
  constructor(code: ChurchManagementErrorCode, message: string) {
    super(code, message);
    this.name = "ChurchManagementError";
  }
}

