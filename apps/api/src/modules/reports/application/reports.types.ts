import type { CellStatus } from "@mission-atos/domain";

export type ReportsScope =
  | { kind: "church" }
  | { kind: "supervisor"; userId: string }
  | { kind: "leader"; userId: string };

export interface PeriodInput {
  from?: string;
  to?: string;
}

export interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface PendingReportRow {
  cell: { id: string; code: string; name: string };
  leader: { firstName: string; lastName: string } | null;
  meetingDate: string;
  daysSinceMeeting: number;
  reportStatus: "NOT_STARTED" | "DRAFT" | "SUBMITTED" | "RETURNED";
  lastReturnedAt: string | null;
}

export interface AttendanceSummaryRow {
  cell: { id: string; code: string; name: string };
  leader: { firstName: string; lastName: string } | null;
  totalMeetings: number;
  attendanceRate: number | null;
  averagePresent: number;
  totalVisitors: number;
  healthBand: "healthy" | "attention" | "critical" | null;
}

export interface AttendanceDetailRow {
  person: { id: string; fullName: string };
  attendanceByMeeting: { meetingId: string; meetingDate: string; status: "PRESENT" | "ABSENT" | "EXCUSED" | "UNMARKED" }[];
  totalPresent: number;
  totalAbsent: number;
  totalExcused: number;
  attendanceRate: number | null;
}

export interface VisitorReportRow {
  person: { id: string; fullName: string; phone: string | null };
  cell: { id: string; code: string; name: string };
  meetingDate: string;
  invitedBy: { fullName: string } | null;
  observation: string | null;
  contactPending: boolean;
}

export interface VisitorMetrics {
  total: number;
  contactPendingCount: number;
  topCell: { id: string; code: string; name: string; count: number } | null;
}

export interface MeetingsReportRow {
  cell: { id: string; code: string; name: string };
  meetingDate: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELED";
  cancellationReason: string | null;
  presentCount: number;
  absentCount: number;
  visitorCount: number;
  attendanceRate: number | null;
  reportStatus: "NOT_STARTED" | "DRAFT" | "SUBMITTED" | "RETURNED" | "CANCELED" | null;
}

export interface ExportRow {
  [key: string]: string | number | boolean | null;
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
}

export interface CellScopeInput {
  cellId?: string;
  status?: CellStatus;
}

export interface HealthScopeInput extends CellScopeInput {
  health?: "healthy" | "attention" | "critical";
}
