import { PublicApplicationError } from "@mission-atos/domain";

export type MeetingsManagementErrorCode =
  | "MEETING_ACCESS_DENIED"
  | "MEETING_NOT_FOUND"
  | "MEETING_CELL_NOT_FOUND"
  | "MEETING_CELL_STATUS_INVALID"
  | "MEETING_DATE_CONFLICT"
  | "MEETING_STATUS_TRANSITION_INVALID"
  | "MEETING_NOT_EDITABLE"
  | "MEETING_REPORT_NOT_EDITABLE"
  | "IDEMPOTENCY_KEY_CONFLICT"
  | "MEETING_TRANSACTION_RETRY_EXHAUSTED";

export class MeetingsManagementError extends PublicApplicationError<MeetingsManagementErrorCode> {
  constructor(code: MeetingsManagementErrorCode, message: string) {
    super(code, message);
    this.name = "MeetingsManagementError";
  }
}
