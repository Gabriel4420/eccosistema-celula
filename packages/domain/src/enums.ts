export const userStatuses = ["ACTIVE", "BLOCKED"] as const;
export type UserStatus = (typeof userStatuses)[number];

export const cellStatuses = [
  "FORMING",
  "ACTIVE",
  "SUSPENDED",
  "CLOSED"
] as const;
export type CellStatus = (typeof cellStatuses)[number];

export const membershipStatuses = [
  "ACTIVE",
  "INACTIVE",
  "TRANSFERRED"
] as const;
export type MembershipStatus = (typeof membershipStatuses)[number];

export const meetingStatuses = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELED"
] as const;
export type MeetingStatus = (typeof meetingStatuses)[number];

export const attendanceStatuses = ["PRESENT", "ABSENT", "EXCUSED"] as const;
export type AttendanceStatus = (typeof attendanceStatuses)[number];

export const reportStatuses = [
  "NOT_STARTED",
  "DRAFT",
  "SUBMITTED",
  "RETURNED",
  "CANCELED"
] as const;
export type ReportStatus = (typeof reportStatuses)[number];

export const daysOfWeek = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
] as const;
export type DayOfWeek = (typeof daysOfWeek)[number];
