export type SyncStatus = "PENDING" | "SYNCED" | "ERROR";

export type SyncOutboxRow = {
  operationId: string;
  entity: string;
  entityId: string;
  operation: string;
  payload: string;
  status: SyncStatus;
  errorMessage: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DocumentRow = {
  id: string;
  name: string;
  kind: "image" | "pdf";
  mimeType: string | null;
  fileUri: string;
  size: number;
  createdAt: string;
  syncStatus: SyncStatus;
};

export type CellRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  leaderId: string | null;
  meetingDay: string;
  meetingTime: string;
  address: string;
  updatedAt: string;
};

export type MeetingRow = {
  id: string;
  cellId: string;
  meetingDate: string;
  status: string;
  cancellationReason: string | null;
  attendanceRevision: number;
  reportStatus: string;
  observations: string | null;
  updatedAt: string;
};

export type AttendanceEntryRow = {
  meetingId: string;
  personId: string;
  fullName: string;
  status: string;
  updatedAt: string;
};