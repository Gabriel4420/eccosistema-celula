import type { MeetingStatus } from "@mission-atos/domain";

export interface ManagedRelatedCell {
  id: string;
  code: string;
  name: string;
}

export interface ManagedMeeting {
  id: string;
  churchId: string;
  cellId: string;
  cell: ManagedRelatedCell;
  meetingDate: string;
  status: MeetingStatus;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type MeetingSortField = "meetingDate" | "createdAt";
export type SortOrder = "asc" | "desc";

export interface ListMeetingsInput {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
  status?: MeetingStatus;
  sortOrder: SortOrder;
}

export interface MeetingPage {
  items: ManagedMeeting[];
  totalItems: number;
}

export type MeetingListScope =
  | { kind: "church" }
  | { kind: "supervisor"; userId: string }
  | { kind: "leader"; userId: string };

export interface MeetingCreateInput {
  meetingDate: string;
}

export interface MeetingUpdateInput {
  meetingDate: string;
}

export interface MeetingStatusUpdateInput {
  status: "COMPLETED" | "CANCELED";
  cancellationReason?: string;
}

export interface ManagedMeetingReport {
  id: string;
  meetingId: string;
  observations: string | null;
  status: "DRAFT";
  submittedBy: null;
  submittedAt: null;
  createdAt: Date;
  updatedAt: Date;
}
