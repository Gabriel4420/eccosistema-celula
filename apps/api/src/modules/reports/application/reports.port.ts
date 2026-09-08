import type {
  AttendanceDetailRow,
  AttendanceSummaryRow,
  ExportRow,
  HealthScopeInput,
  MeetingsReportRow,
  PaginatedResult,
  PendingReportRowInput,
  ReportsScope,
  VisitorMetrics,
  VisitorReportRow
} from "./reports.types";

export const REPORTS_REPOSITORY = Symbol("REPORTS_REPOSITORY");
export const REPORTS_NOW = Symbol("REPORTS_NOW");

export interface ReportsRepository {
  getChurchTimezone(churchId: string): Promise<string>;
  getChurchName(churchId: string): Promise<string>;
  getChurchDeadlineSettings(churchId: string): Promise<{ timezone: string; reportDeadlineHours: number }>;

  findPendingReports(churchId: string, scope: ReportsScope, input: { from: string; to: string; status?: string; cellId?: string }, page: number, pageSize: number): Promise<PaginatedResult<PendingReportRowInput>>;

  findAttendanceSummary(churchId: string, scope: ReportsScope, input: { from: string; to: string } & HealthScopeInput, page: number, pageSize: number): Promise<PaginatedResult<AttendanceSummaryRow>>;

  findAttendanceDetail(churchId: string, scope: ReportsScope, input: { cellId: string; from?: string; to?: string }, page: number, pageSize: number): Promise<PaginatedResult<AttendanceDetailRow>>;

  findVisitors(churchId: string, scope: ReportsScope, input: { from: string; to: string; cellId?: string; contactPending?: boolean }, page: number, pageSize: number): Promise<{ items: VisitorReportRow[]; totalItems: number; metrics: VisitorMetrics }>;

  findMeetingsReport(churchId: string, scope: ReportsScope, input: { from: string; to: string; cellId?: string; status?: string }, page: number, pageSize: number): Promise<PaginatedResult<MeetingsReportRow>>;

  exportCells(churchId: string, scope: ReportsScope): Promise<ExportRow[]>;
  exportPeople(churchId: string, scope: ReportsScope, status: string): Promise<ExportRow[]>;
  exportAttendance(churchId: string, scope: ReportsScope, input: { from?: string; to?: string; cellId?: string }): Promise<ExportRow[]>;
  exportMeetings(churchId: string, scope: ReportsScope, input: { from?: string; to?: string; cellId?: string }): Promise<ExportRow[]>;

  recordExport(input: { churchId: string; exportedBy: string; reportType: string; format: string; scope: Record<string, unknown>; rowCount: number }): Promise<void>;

  assertCellInScope(churchId: string, scope: ReportsScope, cellId: string): Promise<{ id: string; code: string; name: string }>;
}
