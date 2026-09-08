import { endOfCivilDay } from "../../dashboard-analytics/application/dashboard-analytics.time";

const HOUR_MS = 3_600_000;

export function isReportOverdue(meetingCivil: string, timezone: string, deadlineHours: number, now: Date): boolean {
  const deadlineAt = endOfCivilDay(meetingCivil, timezone).getTime() + deadlineHours * HOUR_MS;
  return now.getTime() > deadlineAt;
}