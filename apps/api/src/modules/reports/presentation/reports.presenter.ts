import type {
  AttendanceDetailEnvelope,
  AttendanceDetailItem,
  AttendanceSummaryEnvelope,
  AttendanceSummaryItem,
  MeetingsReportEnvelope,
  MeetingsReportItem,
  PendingReportsEnvelope,
  PendingReportItem,
  VisitorsEnvelope,
  VisitorReportItem
} from "@mission-atos/contracts";
import type {
  AttendanceDetailRow,
  AttendanceSummaryRow,
  MeetingsReportRow,
  PaginatedResult,
  PendingReportRow,
  VisitorMetrics,
  VisitorReportRow
} from "../application/reports.types";

function paginationMeta(totalItems: number, page: number, pageSize: number) {
  return { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
}

export function presentPendingReports(result: PaginatedResult<PendingReportRow>, page: number, pageSize: number): PendingReportsEnvelope {
  const data: PendingReportItem[] = result.items.map((item) => ({
    cell: { ...item.cell },
    leader: item.leader ? { firstName: item.leader.firstName, lastName: item.leader.lastName } : null,
    meetingDate: item.meetingDate,
    daysSinceMeeting: item.daysSinceMeeting,
    overdue: item.overdue,
    reportStatus: item.reportStatus,
    lastReturnedAt: item.lastReturnedAt
  }));
  return { data, meta: paginationMeta(result.totalItems, page, pageSize) };
}

export function presentAttendanceSummary(result: PaginatedResult<AttendanceSummaryRow>, page: number, pageSize: number): AttendanceSummaryEnvelope {
  const data: AttendanceSummaryItem[] = result.items.map((item) => ({
    cell: { ...item.cell },
    leader: item.leader ? { firstName: item.leader.firstName, lastName: item.leader.lastName } : null,
    totalMeetings: item.totalMeetings,
    attendanceRate: item.attendanceRate,
    averagePresent: item.averagePresent,
    totalVisitors: item.totalVisitors,
    healthBand: item.healthBand
  }));
  return { data, meta: paginationMeta(result.totalItems, page, pageSize) };
}

export function presentAttendanceDetail(result: PaginatedResult<AttendanceDetailRow>, page: number, pageSize: number): AttendanceDetailEnvelope {
  const data: AttendanceDetailItem[] = result.items.map((item) => ({
    person: { ...item.person },
    attendanceByMeeting: item.attendanceByMeeting.map((a) => ({ ...a })),
    totalPresent: item.totalPresent,
    totalAbsent: item.totalAbsent,
    totalExcused: item.totalExcused,
    attendanceRate: item.attendanceRate
  }));
  return { data, meta: paginationMeta(result.totalItems, page, pageSize) };
}

export function presentVisitors(items: VisitorReportRow[], totalItems: number, metrics: VisitorMetrics, page: number, pageSize: number): VisitorsEnvelope {
  const data: VisitorReportItem[] = items.map((item) => ({
    person: { ...item.person },
    cell: { ...item.cell },
    meetingDate: item.meetingDate,
    invitedBy: item.invitedBy ? { fullName: item.invitedBy.fullName } : null,
    observation: item.observation,
    contactPending: item.contactPending
  }));
  return {
    data,
    metrics: {
      total: metrics.total,
      contactPendingCount: metrics.contactPendingCount,
      topCell: metrics.topCell ? { ...metrics.topCell } : null
    },
    meta: paginationMeta(totalItems, page, pageSize)
  };
}

export function presentMeetingsReport(result: PaginatedResult<MeetingsReportRow>, page: number, pageSize: number): MeetingsReportEnvelope {
  const data: MeetingsReportItem[] = result.items.map((item) => ({
    cell: { ...item.cell },
    meetingDate: item.meetingDate,
    status: item.status,
    cancellationReason: item.cancellationReason,
    presentCount: item.presentCount,
    absentCount: item.absentCount,
    visitorCount: item.visitorCount,
    attendanceRate: item.attendanceRate,
    reportStatus: item.reportStatus
  }));
  return { data, meta: paginationMeta(result.totalItems, page, pageSize) };
}
