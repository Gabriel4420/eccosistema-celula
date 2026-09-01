import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { DashboardAnalyticsAuthorization } from "./dashboard-analytics.authorization";
import { aggregateAttendanceRate } from "./dashboard-analytics.rate";
import { addDays, civilDateOf, resolvePeriodBounds } from "./dashboard-analytics.time";
import type {
  CellsSummaryResult,
  CellsSummaryQueryInput,
  OverviewResult,
  SeriesResult
} from "./dashboard-analytics.types";
import type { DashboardAnalyticsRepository } from "./dashboard-analytics.port";

export class DashboardAnalyticsQueries {
  constructor(
    private readonly repository: DashboardAnalyticsRepository,
    private readonly authorization: DashboardAnalyticsAuthorization,
    private readonly now: () => Date
  ) {}

  async overview(principal: AuthenticatedPrincipal, input: { from?: string; to?: string }): Promise<OverviewResult> {
    const scope = this.authorization.resolveListScope(principal);
    const timezone = await this.repository.getChurchTimezone(principal.churchId);
    const bounds = resolvePeriodBounds(input, this.now(), timezone);
    const [current, previous] = await Promise.all([
      this.loadPeriod(principal.churchId, scope, bounds.from, bounds.to, timezone),
      this.loadPeriod(principal.churchId, scope, bounds.prevFrom, bounds.prevTo, timezone)
    ]);
    const completionRate = current.meetingCounts.total === 0 ? 0 : roundPercentage(current.meetingCounts.completed / current.meetingCounts.total);
    const prevCompletionRate = previous.meetingCounts.total === 0 ? 0 : roundPercentage(previous.meetingCounts.completed / previous.meetingCounts.total);
    const averagePresent = current.attendance.completedCount === 0 ? 0 : round(current.attendance.totalPresentSum / current.attendance.completedCount, 2);
    const prevAveragePresent = previous.attendance.completedCount === 0 ? 0 : round(previous.attendance.totalPresentSum / previous.attendance.completedCount, 2);
    const attendanceRate = aggregateAttendanceRate(current.attendance.presentSum, current.attendance.eligibleSum);
    const prevAttendanceRate = aggregateAttendanceRate(previous.attendance.presentSum, previous.attendance.eligibleSum);

    return {
      period: bounds,
      totals: current.totals,
      meetings: { total: current.meetingCounts.total, completed: current.meetingCounts.completed, completionRate },
      attendance: { attendanceRate, averagePresent },
      visitors: { total: current.attendance.visitorCount },
      delta: {
        people: null,
        activeCells: null,
        formingCells: null,
        members: null,
        meetings: current.meetingCounts.total - previous.meetingCounts.total,
        completedMeetings: current.meetingCounts.completed - previous.meetingCounts.completed,
        completionRate: round(completionRate - prevCompletionRate, 2),
        attendanceRate: attendanceRate === null || prevAttendanceRate === null ? null : round(attendanceRate - prevAttendanceRate, 2),
        averagePresent: round(averagePresent - prevAveragePresent, 2),
        visitors: current.attendance.visitorCount - previous.attendance.visitorCount
      }
    };
  }

  async series(principal: AuthenticatedPrincipal, input: { from?: string; to?: string }): Promise<SeriesResult[]> {
    const scope = this.authorization.resolveListScope(principal);
    const timezone = await this.repository.getChurchTimezone(principal.churchId);
    const bounds = resolvePeriodBounds(input, this.now(), timezone);
    const points = await this.repository.monthlySeries(principal.churchId, scope, bounds.from, bounds.to);
    return fillMonthlySeries(points, bounds.from, bounds.to);
  }

  async cellsSummary(principal: AuthenticatedPrincipal, input: CellsSummaryQueryInput): Promise<CellsSummaryResult> {
    const scope = this.authorization.resolveListScope(principal);
    const timezone = await this.repository.getChurchTimezone(principal.churchId);
    const cells = await this.repository.cellSummaries(principal.churchId, scope, input);
    const windowStart = addDays(civilDateOf(this.now(), timezone), -input.windowDays);
    const withoutRecentMeeting = cells.filter((cell) => !cell.lastCompletedAt || cell.lastCompletedAt < windowStart).length;
    return { cells, withoutRecentMeeting, recentMeetingWindowDays: input.windowDays };
  }

  private async loadPeriod(
    churchId: string,
    scope: Parameters<DashboardAnalyticsRepository["totals"]>[1],
    from: string,
    to: string,
    timezone: string
  ) {
    void timezone;
    const [totals, meetingCounts, attendance] = await Promise.all([
      this.repository.totals(churchId, scope),
      this.repository.meetingCounts(churchId, scope, from, to),
      this.repository.attendance(churchId, scope, from, to)
    ]);
    return { totals, meetingCounts, attendance };
  }
}

function roundPercentage(ratio: number): number {
  return Math.round(ratio * 10_000) / 100;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function fillMonthlySeries(
  points: SeriesResult[],
  from: string,
  to: string
): SeriesResult[] {
  const byMonth = new Map(points.map((point) => [point.month, point]));
  const months = enumerateMonths(from, to);
  return months.map((month) => byMonth.get(month) ?? {
    month, meetings: 0, completed: 0, presentMembers: 0, visitors: 0
  });
}

function enumerateMonths(from: string, to: string): string[] {
  const months: string[] = [];
  const [fromYear, fromMonth] = from.split("-");
  const [toYear, toMonth] = to.split("-");
  let year = Number(fromYear);
  let month = Number(fromMonth);
  const endYear = Number(toYear);
  const endMonth = Number(toMonth);
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return months;
}
