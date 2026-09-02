import {
  attendanceDetailEnvelopeSchema,
  attendanceSummaryEnvelopeSchema,
  meetingsReportEnvelopeSchema,
  pendingReportsEnvelopeSchema,
  visitorsEnvelopeSchema
} from "@mission-atos/contracts";
import type {
  AttendanceDetailEnvelope,
  AttendanceSummaryEnvelope,
  MeetingsReportEnvelope,
  PendingReportsEnvelope,
  VisitorsEnvelope
} from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

export interface PendingReportsParams {
  readonly from?: string;
  readonly to?: string;
  readonly status?: string;
  readonly cellId?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export async function getPendingReports(api: ApiClient, params: PendingReportsParams): Promise<PendingReportsEnvelope> {
  return api.request({
    method: "GET",
    path: "/reports/pending",
    query: periodQuery(params, ["status", "cellId"]),
    bearer: true,
    allowRetry: true,
    schema: pendingReportsEnvelopeSchema
  });
}

export interface AttendanceSummaryParams {
  readonly from?: string;
  readonly to?: string;
  readonly cellId?: string;
  readonly status?: string;
  readonly health?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export async function getAttendanceSummary(api: ApiClient, params: AttendanceSummaryParams): Promise<AttendanceSummaryEnvelope> {
  return api.request({
    method: "GET",
    path: "/reports/attendance/summary",
    query: periodQuery(params, ["cellId", "status", "health"]),
    bearer: true,
    allowRetry: true,
    schema: attendanceSummaryEnvelopeSchema
  });
}

export interface AttendanceDetailParams {
  readonly cellId: string;
  readonly from?: string;
  readonly to?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export async function getAttendanceDetail(api: ApiClient, params: AttendanceDetailParams): Promise<AttendanceDetailEnvelope> {
  return api.request({
    method: "GET",
    path: "/reports/attendance/detail",
    query: { cellId: params.cellId, ...periodQuery(params, []) },
    bearer: true,
    allowRetry: true,
    schema: attendanceDetailEnvelopeSchema
  });
}

export interface VisitorReportParams {
  readonly from?: string;
  readonly to?: string;
  readonly cellId?: string;
  readonly contactPending?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
}

export async function getVisitorReport(api: ApiClient, params: VisitorReportParams): Promise<VisitorsEnvelope> {
  return api.request({
    method: "GET",
    path: "/reports/visitors",
    query: {
      ...periodQuery(params, ["cellId"]),
      ...(params.contactPending ? { contactPending: "true" } : {})
    },
    bearer: true,
    allowRetry: true,
    schema: visitorsEnvelopeSchema
  });
}

export interface MeetingsReportParams {
  readonly from?: string;
  readonly to?: string;
  readonly cellId?: string;
  readonly status?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export async function getMeetingsReport(api: ApiClient, params: MeetingsReportParams): Promise<MeetingsReportEnvelope> {
  return api.request({
    method: "GET",
    path: "/reports/meetings",
    query: periodQuery(params, ["cellId", "status"]),
    bearer: true,
    allowRetry: true,
    schema: meetingsReportEnvelopeSchema
  });
}

export type ExportFormat = "csv" | "xlsx" | "pdf";

export async function exportReport(api: ApiClient, reportType: string, format: ExportFormat, params: Record<string, string> = {}): Promise<Blob> {
  return api.downloadFile({
    method: "GET",
    path: `/reports/export/${reportType}`,
    query: { format, ...params },
    bearer: true
  });
}

function periodQuery(
  params: { from?: string; to?: string; page?: number; pageSize?: number },
  extraKeys: string[]
): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  if (params.page !== undefined) query.page = String(params.page);
  if (params.pageSize !== undefined) query.pageSize = String(params.pageSize);
  const extra = params as Record<string, unknown>;
  for (const key of extraKeys) {
    const value = extra[key];
    if (typeof value === "string" && value) query[key] = value;
  }
  return query;
}
