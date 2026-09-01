import type { CellStatus } from "@mission-atos/domain";

export type DashboardListScope =
  | { kind: "church" }
  | { kind: "supervisor"; userId: string }
  | { kind: "leader"; userId: string };

export interface OverviewQueryInput {
  from: string;
  to: string;
}

export interface SeriesQueryInput {
  from: string;
  to: string;
  granularity: "monthly";
}

export interface CellsSummaryQueryInput {
  windowDays: number;
  status?: CellStatus;
}

export interface PeriodBounds {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
}

export interface TotalsCounts {
  people: number;
  activeCells: number;
  formingCells: number;
  members: number;
}

export interface MeetingCounts {
  total: number;
  completed: number;
}

export interface AttendanceAggregate {
  presentSum: number;
  eligibleSum: number;
  totalPresentSum: number;
  completedCount: number;
  visitorCount: number;
}

export interface MonthlyPoint {
  month: string;
  meetings: number;
  completed: number;
  presentMembers: number;
  visitors: number;
}

export interface CellSummaryRow {
  id: string;
  code: string;
  name: string;
  status: CellStatus;
  lastCompletedAt: string | null;
  membersCount: number;
}

export interface OverviewResult {
  period: PeriodBounds;
  totals: TotalsCounts;
  meetings: MeetingCounts & { completionRate: number };
  attendance: { attendanceRate: number | null; averagePresent: number };
  visitors: { total: number };
  delta?: {
    people: number | null;
    activeCells: number | null;
    formingCells: number | null;
    members: number | null;
    meetings: number | null;
    completedMeetings: number | null;
    completionRate: number | null;
    attendanceRate: number | null;
    averagePresent: number | null;
    visitors: number | null;
  };
}

export interface SeriesResult {
  month: string;
  meetings: number;
  completed: number;
  presentMembers: number;
  visitors: number;
}

export interface CellsSummaryResult {
  cells: CellSummaryRow[];
  withoutRecentMeeting: number;
  recentMeetingWindowDays: number;
}
