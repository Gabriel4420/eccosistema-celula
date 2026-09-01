import type {
  AttendanceAggregate,
  CellSummaryRow,
  CellsSummaryQueryInput,
  DashboardListScope,
  MeetingCounts,
  MonthlyPoint,
  TotalsCounts
} from "./dashboard-analytics.types";

export const DASHBOARD_ANALYTICS_REPOSITORY = Symbol("DASHBOARD_ANALYTICS_REPOSITORY");
export const DASHBOARD_ANALYTICS_NOW = Symbol("DASHBOARD_ANALYTICS_NOW");

export interface DashboardAnalyticsRepository {
  getChurchTimezone(churchId: string): Promise<string>;
  totals(churchId: string, scope: DashboardListScope): Promise<TotalsCounts>;
  meetingCounts(churchId: string, scope: DashboardListScope, from: string, to: string): Promise<MeetingCounts>;
  attendance(churchId: string, scope: DashboardListScope, from: string, to: string): Promise<AttendanceAggregate>;
  monthlySeries(churchId: string, scope: DashboardListScope, from: string, to: string): Promise<MonthlyPoint[]>;
  cellSummaries(churchId: string, scope: DashboardListScope, input: CellsSummaryQueryInput): Promise<CellSummaryRow[]>;
}
