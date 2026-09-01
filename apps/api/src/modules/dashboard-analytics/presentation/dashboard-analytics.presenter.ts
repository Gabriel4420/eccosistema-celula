import type {
  CellSummaryItem,
  CellsSummaryResponse,
  OverviewResponse,
  SeriesPoint
} from "@mission-atos/contracts";
import type {
  CellsSummaryResult,
  OverviewResult,
  SeriesResult
} from "../application/dashboard-analytics.types";

export function presentOverview(result: OverviewResult): OverviewResponse {
  return {
    period: { ...result.period },
    totals: { ...result.totals },
    meetings: { ...result.meetings },
    attendance: { ...result.attendance },
    visitors: { ...result.visitors },
    ...(result.delta ? { delta: { ...result.delta } } : {})
  };
}

export function presentSeries(points: SeriesResult[]): SeriesPoint[] {
  return points.map((point) => ({
    month: point.month,
    meetings: point.meetings,
    completed: point.completed,
    presentMembers: point.presentMembers,
    visitors: point.visitors
  }));
}

export function presentCellsSummary(result: CellsSummaryResult): CellsSummaryResponse {
  const cells: CellSummaryItem[] = result.cells.map((cell) => ({
    id: cell.id,
    code: cell.code,
    name: cell.name,
    status: cell.status,
    lastCompletedAt: cell.lastCompletedAt,
    membersCount: cell.membersCount
  }));
  return {
    cells,
    withoutRecentMeeting: result.withoutRecentMeeting,
    recentMeetingWindowDays: result.recentMeetingWindowDays
  };
}
