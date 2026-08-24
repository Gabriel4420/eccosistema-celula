import type { AttendanceStatus, MeetingStatus } from "./enums";

export type AttendanceDisplayStatus = AttendanceStatus | "UNMARKED";
export interface AttendanceSummary {
  eligibleCount: number;
  presentParticipants: number;
  absentParticipants: number;
  excusedParticipants: number;
  unmarkedParticipants: number;
  visitorCount: number;
  totalPresent: number;
  markingProgress: number | null;
  attendancePercentage: number | null;
  isOperational: boolean;
}
export function canEditAttendance(status: MeetingStatus): boolean {
  return status === "SCHEDULED" || status === "COMPLETED";
}
export function calculateAttendanceSummary(statuses: readonly AttendanceDisplayStatus[], visitorCount: number, meetingStatus: MeetingStatus): AttendanceSummary {
  const presentParticipants = statuses.filter((status) => status === "PRESENT").length;
  const absentParticipants = statuses.filter((status) => status === "ABSENT").length;
  const excusedParticipants = statuses.filter((status) => status === "EXCUSED").length;
  const eligibleCount = statuses.length;
  const marked = presentParticipants + absentParticipants + excusedParticipants;
  return { eligibleCount, presentParticipants, absentParticipants, excusedParticipants, unmarkedParticipants: eligibleCount - marked, visitorCount, totalPresent: presentParticipants + visitorCount, markingProgress: eligibleCount === 0 ? null : roundPercentage(marked / eligibleCount), attendancePercentage: eligibleCount === 0 ? null : roundPercentage(presentParticipants / eligibleCount), isOperational: meetingStatus !== "CANCELED" };
}
function roundPercentage(ratio: number): number { return Math.round(ratio * 10_000) / 100; }
