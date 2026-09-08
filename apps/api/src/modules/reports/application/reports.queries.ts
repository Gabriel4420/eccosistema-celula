import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { ReportsAuthorization } from "./reports.authorization";
import type {
  AttendanceDetailRow,
  AttendanceSummaryRow,
  ExportRow,
  HealthScopeInput,
  MeetingsReportRow,
  PaginatedResult,
  PendingReportRow,
  VisitorMetrics,
  VisitorReportRow
} from "./reports.types";
import type { ReportsRepository } from "./reports.port";
import { isReportOverdue } from "./reports.deadline";

function civilDateOf(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function addCivilDays(civil: string, delta: number): string {
  const [yearPart, monthPart, dayPart] = civil.split("-");
  const date = new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1, Number(dayPart) + delta));
  return date.toISOString().slice(0, 10);
}

const DEFAULT_PERIOD_DAYS = 30;

export class ReportsQueries {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly authorization: ReportsAuthorization,
    private readonly now: () => Date
  ) {}

  private async resolvePeriodTz(churchId: string, input: { from?: string; to?: string }, timezoneOverride?: string): Promise<{ from: string; to: string }> {
    if (input.from && input.to) return { from: input.from, to: input.to };
    const timezone = timezoneOverride ?? await this.repository.getChurchTimezone(churchId);
    const to = civilDateOf(this.now(), timezone);
    const from = addCivilDays(to, -(DEFAULT_PERIOD_DAYS - 1));
    return { from, to };
  }

  async pendingReports(principal: AuthenticatedPrincipal, input: { from?: string; to?: string; status?: string; cellId?: string }, page: number, pageSize: number): Promise<PaginatedResult<PendingReportRow>> {
    const scope = this.authorization.resolveListScope(principal);
    const settings = await this.repository.getChurchDeadlineSettings(principal.churchId);
    const period = await this.resolvePeriodTz(principal.churchId, input, settings.timezone);
    const result = await this.repository.findPendingReports(principal.churchId, scope, { ...period, status: input.status, cellId: input.cellId }, page, pageSize);
    const now = this.now();
    return {
      items: result.items.map((item) => ({
        ...item,
        overdue: isReportOverdue(item.meetingDate, settings.timezone, settings.reportDeadlineHours, now)
      })),
      totalItems: result.totalItems
    };
  }

  async attendanceSummary(principal: AuthenticatedPrincipal, input: { from?: string; to?: string; cellId?: string; status?: string; health?: string }, page: number, pageSize: number): Promise<PaginatedResult<AttendanceSummaryRow>> {
    const scope = this.authorization.resolveListScope(principal);
    const period = await this.resolvePeriodTz(principal.churchId, input);
    const result = await this.repository.findAttendanceSummary(principal.churchId, scope, {
      from: period.from,
      to: period.to,
      cellId: input.cellId,
      status: input.status as HealthScopeInput["status"],
      health: input.health as HealthScopeInput["health"]
    }, page, pageSize);
    if (input.health) {
      result.items = result.items.filter((item) => item.healthBand === input.health);
    }
    return result;
  }

  async attendanceDetail(principal: AuthenticatedPrincipal, input: { cellId: string; from?: string; to?: string }, page: number, pageSize: number): Promise<PaginatedResult<AttendanceDetailRow>> {
    const scope = this.authorization.resolveListScope(principal);
    await this.repository.assertCellInScope(principal.churchId, scope, input.cellId);
    return this.repository.findAttendanceDetail(principal.churchId, scope, input, page, pageSize);
  }

  async visitors(principal: AuthenticatedPrincipal, input: { from?: string; to?: string; cellId?: string; contactPending?: boolean }, page: number, pageSize: number): Promise<{ items: VisitorReportRow[]; totalItems: number; metrics: VisitorMetrics }> {
    const scope = this.authorization.resolveListScope(principal);
    const period = await this.resolvePeriodTz(principal.churchId, input);
    return this.repository.findVisitors(principal.churchId, scope, { ...period, cellId: input.cellId, contactPending: input.contactPending }, page, pageSize);
  }

  async meetingsReport(principal: AuthenticatedPrincipal, input: { from?: string; to?: string; cellId?: string; status?: string }, page: number, pageSize: number): Promise<PaginatedResult<MeetingsReportRow>> {
    const scope = this.authorization.resolveListScope(principal);
    const period = await this.resolvePeriodTz(principal.churchId, input);
    return this.repository.findMeetingsReport(principal.churchId, scope, { ...period, cellId: input.cellId, status: input.status }, page, pageSize);
  }

  async exportCells(principal: AuthenticatedPrincipal): Promise<ExportRow[]> {
    const scope = this.authorization.resolveListScope(principal);
    return this.repository.exportCells(principal.churchId, scope);
  }

  async exportPeople(principal: AuthenticatedPrincipal, status: string): Promise<ExportRow[]> {
    const scope = this.authorization.resolveListScope(principal);
    return this.repository.exportPeople(principal.churchId, scope, status);
  }

  async exportAttendance(principal: AuthenticatedPrincipal, input: { from?: string; to?: string; cellId?: string }): Promise<ExportRow[]> {
    const scope = this.authorization.resolveListScope(principal);
    const period = await this.resolvePeriodTz(principal.churchId, input);
    return this.repository.exportAttendance(principal.churchId, scope, { ...period, cellId: input.cellId });
  }

  async exportMeetings(principal: AuthenticatedPrincipal, input: { from?: string; to?: string; cellId?: string }): Promise<ExportRow[]> {
    const scope = this.authorization.resolveListScope(principal);
    const period = await this.resolvePeriodTz(principal.churchId, input);
    return this.repository.exportMeetings(principal.churchId, scope, { ...period, cellId: input.cellId });
  }

  async recordExport(input: { churchId: string; exportedBy: string; reportType: string; format: string; scope: Record<string, unknown>; rowCount: number }): Promise<void> {
    await this.repository.recordExport(input);
  }

  async getChurchName(churchId: string): Promise<string> {
    return this.repository.getChurchName(churchId);
  }
}
