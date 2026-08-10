import type { CellStatus, DayOfWeek } from "@mission-atos/domain";

export interface ManagedRelatedUser {
  id: string;
  name: string;
}

export interface ManagedCell {
  id: string;
  churchId: string;
  code: string;
  name: string;
  status: CellStatus;
  leader: ManagedRelatedUser | null;
  supervisor: ManagedRelatedUser | null;
  traineeLeader: ManagedRelatedUser | null;
  meetingDay: DayOfWeek;
  meetingTime: Date;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type CellSortField = "name" | "code" | "meetingDay" | "createdAt";
export type SortOrder = "asc" | "desc";

export interface ListCellsInput {
  page: number;
  pageSize: number;
  search?: string;
  status?: CellStatus;
  leaderId?: string;
  meetingDay?: DayOfWeek;
  sortBy: CellSortField;
  sortOrder: SortOrder;
}

export interface CellPage {
  items: ManagedCell[];
  totalItems: number;
}

export type CellListScope =
  | { kind: "church" }
  | { kind: "supervisor"; userId: string }
  | { kind: "leader"; userId: string };

export interface CellCreateInput {
  code: string;
  name: string;
  status: CellStatus;
  leaderId: string | null;
  supervisorId: string | null;
  traineeLeaderId: string | null;
  meetingDay: DayOfWeek;
  meetingTime: string;
  address: string;
}

export interface CellUpdateInput {
  code?: string;
  name?: string;
  meetingDay?: DayOfWeek;
  meetingTime?: string;
  address?: string;
}
