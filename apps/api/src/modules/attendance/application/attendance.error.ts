import { PublicApplicationError } from "@mission-atos/domain";

export type AttendanceErrorCode =
  | "ATTENDANCE_ACCESS_DENIED"
  | "ATTENDANCE_MEETING_NOT_FOUND"
  | "ATTENDANCE_REVISION_CONFLICT"
  | "MEETING_ATTENDANCE_NOT_EDITABLE"
  | "PERSON_NOT_ELIGIBLE"
  | "VISITOR_ALREADY_ELIGIBLE"
  | "ATTENDANCE_PERSON_NOT_FOUND"
  | "IDEMPOTENCY_KEY_CONFLICT";

export class AttendanceError extends PublicApplicationError<AttendanceErrorCode> {
  constructor(code: AttendanceErrorCode, message: string) { super(code, message); this.name = "AttendanceError"; }
}
