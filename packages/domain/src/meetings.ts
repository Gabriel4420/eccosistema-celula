import type { MeetingStatus } from "./enums";

export const cancellationReasonMaxLength = 1000;
export const observationsMaxLength = 5000;
const meetingDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isValidMeetingDate(value: string): boolean {
  if (!meetingDatePattern.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function normalizeMeetingDate(value: string): string {
  return value.trim();
}

export function canTransitionMeetingStatus(
  from: MeetingStatus,
  to: MeetingStatus
): boolean {
  if (from === to) return true;
  if (from === "SCHEDULED") return to === "COMPLETED" || to === "CANCELED";
  return false;
}

export function isMeetingEditable(status: MeetingStatus): boolean {
  return status === "SCHEDULED";
}

export function isTerminalStatus(status: MeetingStatus): boolean {
  return status === "COMPLETED" || status === "CANCELED";
}

export function isValidCancellationReason(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= cancellationReasonMaxLength;
}

export function normalizeCancellationReason(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeObservations(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
