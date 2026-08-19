import { PublicApplicationError } from "@mission-atos/domain";

export type MeetingsManagementErrorCode =
  | "MEETING_ACCESS_DENIED"
  | "MEETING_NOT_FOUND"
  | "MEETING_CELL_NOT_FOUND"
  | "MEETING_DATE_CONFLICT"
  | "MEETING_STATUS_TRANSITION_INVALID"
  | "MEETING_NOT_EDITABLE"
  | "MEETING_REPORT_NOT_EDITABLE";

export class MeetingsManagementError extends PublicApplicationError<MeetingsManagementErrorCode> {
  constructor(code: MeetingsManagementErrorCode, message: string) {
    super(code, message);
    this.name = "MeetingsManagementError";
  }
}
