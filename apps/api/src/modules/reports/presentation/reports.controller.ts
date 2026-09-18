import { Controller, Get, Inject, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import type { ExportLocale } from "@mission-atos/contracts";
import {
  attendanceDetailQuerySchema,
  attendanceSummaryQuerySchema,
  exportAttendanceQuerySchema,
  exportCellsQuerySchema,
  exportLocales,
  exportMeetingsQuerySchema,
  exportPeopleQuerySchema,
  meetingsReportQuerySchema,
  pendingReportsQuerySchema,
  visitorsQuerySchema
} from "@mission-atos/contracts";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CurrentPrincipal } from "../../permissions/presentation/decorators/current-principal.decorator";
import { Roles } from "../../permissions/presentation/decorators/roles.decorator";
import { ReportsQueries } from "../application/reports.queries";
import type { ExportRow } from "../application/reports.types";
import { ReportsError } from "../application/reports.error";
import { csvBuffer } from "../infrastructure/exports/csv.generator";
import { generateExcel } from "../infrastructure/exports/excel.generator";
import { generatePdf } from "../infrastructure/exports/pdf.generator";
import { exportColumns, exportFilenameBase, exportTitle, type ExportColumn, type ExportReportType } from "../infrastructure/exports/export.i18n";
import { presentAttendanceDetail, presentAttendanceSummary, presentMeetingsReport, presentPendingReports, presentVisitors } from "./reports.presenter";

const MAX_EXPORT_ROWS = 10_000;

@ApiTags("reports") @ApiBearerAuth() @Controller("reports")
export class ReportsController {
  constructor(
    @Inject(ReportsQueries) private readonly queries: ReportsQueries
  ) {}

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("pending")
  @ApiOperation({ summary: "Pending meeting reports" })
  @ApiResponse({ status: 200, description: "Pending reports list" })
  @ApiResponse({ status: 400, description: "Invalid query" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Role is not allowed" })
  async pending(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown) {
    const input = pendingReportsQuerySchema.parse(query);
    const result = await this.queries.pendingReports(principal, input, input.page, input.pageSize);
    return presentPendingReports(result, input.page, input.pageSize);
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("attendance/summary")
  @ApiOperation({ summary: "Attendance summary per cell" })
  @ApiResponse({ status: 200, description: "Attendance summary" })
  @ApiResponse({ status: 400, description: "Invalid query" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Role is not allowed" })
  async attendanceSummary(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown) {
    const input = attendanceSummaryQuerySchema.parse(query);
    const result = await this.queries.attendanceSummary(principal, input, input.page, input.pageSize);
    return presentAttendanceSummary(result, input.page, input.pageSize);
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("attendance/detail")
  @ApiOperation({ summary: "Attendance detail per person (drill-down)" })
  @ApiResponse({ status: 200, description: "Attendance detail" })
  @ApiResponse({ status: 400, description: "Invalid query" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Role is not allowed" })
  @ApiResponse({ status: 404, description: "Cell not found or not in scope" })
  async attendanceDetail(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown) {
    const input = attendanceDetailQuerySchema.parse(query);
    const result = await this.queries.attendanceDetail(principal, input, input.page, input.pageSize);
    return presentAttendanceDetail(result, input.page, input.pageSize);
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("visitors")
  @ApiOperation({ summary: "Visitor report by period" })
  @ApiResponse({ status: 200, description: "Visitor report" })
  @ApiResponse({ status: 400, description: "Invalid query" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Role is not allowed" })
  async visitors(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown) {
    const input = visitorsQuerySchema.parse(query);
    const result = await this.queries.visitors(principal, input, input.page, input.pageSize);
    return presentVisitors(result.items, result.totalItems, result.metrics, input.page, input.pageSize);
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("meetings")
  @ApiOperation({ summary: "Meetings report by period" })
  @ApiResponse({ status: 200, description: "Meetings report" })
  @ApiResponse({ status: 400, description: "Invalid query" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Role is not allowed" })
  async meetingsReport(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown) {
    const input = meetingsReportQuerySchema.parse(query);
    const result = await this.queries.meetingsReport(principal, input, input.page, input.pageSize);
    return presentMeetingsReport(result, input.page, input.pageSize);
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("export/cells")
  @ApiOperation({ summary: "Export cells as CSV, Excel or PDF" })
  @ApiQuery({ name: "format", enum: ["csv", "xlsx", "pdf"] })
  @ApiQuery({ name: "locale", enum: exportLocales, required: false })
  @ApiResponse({ status: 200, description: "File download" })
  @ApiResponse({ status: 400, description: "Invalid format" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Role is not allowed" })
  async exportCells(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown, @Res() res: Response) {
    const input = exportCellsQuerySchema.parse(query);
    const rows = (await this.queries.exportCells(principal)).slice(0, MAX_EXPORT_ROWS);
    const columns = exportColumns("cells", input.locale);
    await this.queries.recordExport({ churchId: principal.churchId, exportedBy: principal.userId, reportType: "cells", format: input.format, scope: {}, rowCount: rows.length });
    this.sendFile(res, rows, columns, "cells", input.format, input.locale, principal.churchId);
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("export/people")
  @ApiOperation({ summary: "Export people as CSV, Excel or PDF" })
  @ApiQuery({ name: "format", enum: ["csv", "xlsx", "pdf"] })
  @ApiQuery({ name: "locale", enum: exportLocales, required: false })
  @ApiQuery({ name: "status", enum: ["ACTIVE", "INACTIVE"], required: false })
  @ApiResponse({ status: 200, description: "File download" })
  @ApiResponse({ status: 400, description: "Invalid format" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Role is not allowed" })
  async exportPeople(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown, @Res() res: Response) {
    const input = exportPeopleQuerySchema.parse(query);
    const rows = (await this.queries.exportPeople(principal, input.status)).slice(0, MAX_EXPORT_ROWS);
    const columns = exportColumns("people", input.locale);
    await this.queries.recordExport({ churchId: principal.churchId, exportedBy: principal.userId, reportType: "people", format: input.format, scope: { status: input.status }, rowCount: rows.length });
    this.sendFile(res, rows, columns, "people", input.format, input.locale, principal.churchId);
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("export/attendance")
  @ApiOperation({ summary: "Export attendance as CSV, Excel or PDF" })
  @ApiQuery({ name: "format", enum: ["csv", "xlsx", "pdf"] })
  @ApiQuery({ name: "locale", enum: exportLocales, required: false })
  @ApiQuery({ name: "from", required: false, type: String })
  @ApiQuery({ name: "to", required: false, type: String })
  @ApiQuery({ name: "cellId", required: false, type: String })
  @ApiResponse({ status: 200, description: "File download" })
  @ApiResponse({ status: 400, description: "Invalid query" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Role is not allowed" })
  async exportAttendance(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown, @Res() res: Response) {
    const input = exportAttendanceQuerySchema.parse(query);
    const rows = (await this.queries.exportAttendance(principal, input)).slice(0, MAX_EXPORT_ROWS);
    const columns = exportColumns("attendance", input.locale);
    await this.queries.recordExport({ churchId: principal.churchId, exportedBy: principal.userId, reportType: "attendance", format: input.format, scope: { from: input.from, to: input.to, cellId: input.cellId }, rowCount: rows.length });
    this.sendFile(res, rows, columns, "attendance", input.format, input.locale, principal.churchId);
  }

  @Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER") @Get("export/meetings")
  @ApiOperation({ summary: "Export meetings as CSV, Excel or PDF" })
  @ApiQuery({ name: "format", enum: ["csv", "xlsx", "pdf"] })
  @ApiQuery({ name: "locale", enum: exportLocales, required: false })
  @ApiQuery({ name: "from", required: false, type: String })
  @ApiQuery({ name: "to", required: false, type: String })
  @ApiQuery({ name: "cellId", required: false, type: String })
  @ApiResponse({ status: 200, description: "File download" })
  @ApiResponse({ status: 400, description: "Invalid query" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Role is not allowed" })
  async exportMeetings(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Query() query: unknown, @Res() res: Response) {
    const input = exportMeetingsQuerySchema.parse(query);
    const rows = (await this.queries.exportMeetings(principal, input)).slice(0, MAX_EXPORT_ROWS);
    const columns = exportColumns("meetings", input.locale);
    await this.queries.recordExport({ churchId: principal.churchId, exportedBy: principal.userId, reportType: "meetings", format: input.format, scope: { from: input.from, to: input.to, cellId: input.cellId }, rowCount: rows.length });
    this.sendFile(res, rows, columns, "meetings", input.format, input.locale, principal.churchId);
  }

  private async sendFile(res: Response, rows: ExportRow[], columns: ExportColumn[], reportType: ExportReportType, format: string, locale: ExportLocale, churchId?: string) {
    const title = exportTitle(reportType, locale);
    const filename = `${exportFilenameBase(reportType)}_${new Date().toISOString().slice(0, 10)}`;
    try {
      if (format === "csv") {
        const buffer = csvBuffer(rows, columns);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
        res.send(buffer);
      } else if (format === "xlsx") {
        const buffer = await generateExcel(rows, columns, title);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
        res.send(buffer);
      } else {
        const churchName = churchId ? await this.queries.getChurchName(churchId) : "Igreja";
        const buffer = await generatePdf(rows, columns, title, churchName, locale);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
        res.send(buffer);
      }
    } catch (error) {
      if (error instanceof ReportsError) throw error;
      throw new ReportsError("REPORT_EXPORT_FAILED", "Failed to generate the exported file");
    }
  }
}
