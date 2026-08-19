import type {
  ListMeetingsInput,
  ManagedMeeting,
  ManagedMeetingReport,
  MeetingPage
} from "./meetings-management.types";

export const MEETINGS_MANAGEMENT_REPOSITORY = Symbol("MEETINGS_MANAGEMENT_REPOSITORY");
export const MEETINGS_MANAGEMENT_UNIT_OF_WORK = Symbol("MEETINGS_MANAGEMENT_UNIT_OF_WORK");

export interface MeetingsManagementRepository {
  list(
    churchId: string,
    cellId: string,
    input: ListMeetingsInput
  ): Promise<MeetingPage>;
  find(churchId: string, meetingId: string): Promise<ManagedMeeting | null>;
  findReport(churchId: string, meetingId: string): Promise<ManagedMeetingReport | null>;
}

export interface IdempotencyRecord {
  key: string;
  requestHash: string;
  resourceId: string | null;
  result: unknown;
}

export interface MeetingsManagementTransaction {
  findCell(cellId: string): Promise<{ id: string; churchId: string; code: string; name: string; status: string } | null>;
  findMeeting(meetingId: string): Promise<ManagedMeeting | null>;
  findMeetingScope(cellId: string): Promise<{ leaderId: string | null; traineeLeaderId: string | null; supervisorId: string | null } | null>;
  createMeeting(churchId: string, cellId: string, meetingDate: string): Promise<ManagedMeeting>;
  updateMeetingDate(meetingId: string, meetingDate: string): Promise<ManagedMeeting>;
  updateMeetingStatus(
    meetingId: string,
    status: "COMPLETED" | "CANCELED",
    cancellationReason?: string
  ): Promise<ManagedMeeting>;
  checkDateConflict(cellId: string, meetingDate: string, excludeId?: string): Promise<boolean>;
  findReport(churchId: string, meetingId: string): Promise<ManagedMeetingReport | null>;
  upsertReport(
    churchId: string,
    meetingId: string,
    observations: string | null
  ): Promise<ManagedMeetingReport>;
  findIdempotencyRequest(actorId: string, key: string): Promise<IdempotencyRecord | null>;
  createIdempotencyRequest(input: {
    actorId: string;
    key: string;
    operation: string;
    requestHash: string;
    resourceId: string;
    result: unknown;
    ttlSeconds: number;
  }): Promise<void>;
  recordAudit(input: {
    actorId: string;
    entityId: string;
    action: string;
    before?: Record<string, string | string[] | null>;
    after?: Record<string, string | string[] | null>;
  }): Promise<void>;
}

export interface MeetingsManagementUnitOfWork {
  execute<T>(
    churchId: string,
    work: (transaction: MeetingsManagementTransaction) => Promise<T>
  ): Promise<T>;
}
