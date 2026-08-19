import { createHash } from "node:crypto";
import {
  canTransitionMeetingStatus,
  isMeetingEditable,
  normalizeMeetingDate,
  normalizeCancellationReason,
  normalizeObservations
} from "@mission-atos/domain";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { MeetingsManagementAuthorization } from "./meetings-management.authorization";
import { MeetingsManagementError } from "./meetings-management.error";
import type {
  MeetingsManagementTransaction,
  MeetingsManagementUnitOfWork
} from "./meetings-management.port";
import type {
  MeetingCreateInput,
  MeetingUpdateInput,
  ManagedMeeting,
  ManagedMeetingReport
} from "./meetings-management.types";

const CREATE_OPERATION = "meeting:create";
const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

export class MeetingsManagementCommands {
  constructor(
    private readonly unitOfWork: MeetingsManagementUnitOfWork,
    private readonly authorization: MeetingsManagementAuthorization
  ) {}

  create(
    principal: AuthenticatedPrincipal,
    cellId: string,
    idempotencyKey: string,
    input: MeetingCreateInput
  ): Promise<ManagedMeeting> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertManage(transaction, principal);
      const meetingDate = normalizeMeetingDate(input.meetingDate);
      await this.assertCellExists(transaction, cellId);
      await assertNoDateConflict(transaction, cellId, meetingDate);
      const meeting = await transaction.createMeeting(principal.churchId, cellId, meetingDate);
      const requestHash = canonicalHash({ cellId, meetingDate });
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: meeting.id,
        action: "MEETING_CREATED",
        after: { meetingDate, cellId, status: meeting.status }
      });
      await transaction.createIdempotencyRequest({
        actorId: principal.userId,
        key: idempotencyKey,
        operation: CREATE_OPERATION,
        requestHash,
        resourceId: meeting.id,
        result: { meetingId: meeting.id },
        ttlSeconds: IDEMPOTENCY_TTL_SECONDS
      });
      return meeting;
    });
  }

  updateDate(
    principal: AuthenticatedPrincipal,
    cellId: string,
    meetingId: string,
    input: MeetingUpdateInput
  ): Promise<ManagedMeeting> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const current = await this.requireMeeting(transaction, meetingId);
      this.authorization.assertCanEdit(principal, current);
      if (!isMeetingEditable(current.status)) {
        throw new MeetingsManagementError(
          "MEETING_NOT_EDITABLE",
          "Meeting date cannot be changed after completion or cancellation"
        );
      }
      const meetingDate = normalizeMeetingDate(input.meetingDate);
      if (current.meetingDate === meetingDate) return current;
      await assertNoDateConflict(transaction, cellId, meetingDate, meetingId);
      const updated = await transaction.updateMeetingDate(meetingId, meetingDate);
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: meetingId,
        action: "MEETING_DATE_CHANGED",
        before: { meetingDate: current.meetingDate },
        after: { meetingDate }
      });
      return updated;
    });
  }

  updateStatus(
    principal: AuthenticatedPrincipal,
    cellId: string,
    meetingId: string,
    status: "COMPLETED" | "CANCELED",
    cancellationReason?: string
  ): Promise<ManagedMeeting> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const current = await this.requireMeeting(transaction, meetingId);
      this.authorization.assertCanEdit(principal, current);
      if (current.status === status) return current;
      if (!canTransitionMeetingStatus(current.status, status)) {
        throw new MeetingsManagementError(
          "MEETING_STATUS_TRANSITION_INVALID",
          "Status transition is not allowed"
        );
      }
      const reason = status === "CANCELED"
        ? normalizeCancellationReason(cancellationReason ?? "")
        : undefined;
      const updated = await transaction.updateMeetingStatus(meetingId, status, reason);
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: meetingId,
        action: status === "COMPLETED" ? "MEETING_COMPLETED" : "MEETING_CANCELED",
        before: { status: current.status },
        after: { status, ...(reason ? { cancellationReason: reason } : {}) }
      });
      return updated;
    });
  }

  getReport(
    principal: AuthenticatedPrincipal,
    cellId: string,
    meetingId: string
  ): Promise<ManagedMeetingReport | null> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const meeting = await this.requireMeeting(transaction, meetingId);
      this.authorization.assertView(principal, meeting);
      return transaction.findReport(principal.churchId, meetingId);
    });
  }

  upsertReport(
    principal: AuthenticatedPrincipal,
    cellId: string,
    meetingId: string,
    observations: string | null
  ): Promise<ManagedMeetingReport> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const meeting = await this.requireMeeting(transaction, meetingId);
      this.authorization.assertCanEdit(principal, meeting);
      if (meeting.status === "CANCELED") {
        throw new MeetingsManagementError(
          "MEETING_REPORT_NOT_EDITABLE",
          "Cannot edit report for a canceled meeting"
        );
      }
      const normalized = observations !== null ? normalizeObservations(observations) : null;
      const report = await transaction.upsertReport(principal.churchId, meetingId, normalized);
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: meetingId,
        action: report.createdAt.getTime() === report.updatedAt.getTime()
          ? "MEETING_REPORT_CREATED"
          : "MEETING_REPORT_UPDATED",
        after: { meetingId, observations: normalized }
      });
      return report;
    });
  }

  private async assertManage(
    _transaction: MeetingsManagementTransaction,
    principal: AuthenticatedPrincipal
  ): Promise<void> {
    const isManager =
      principal.roles.includes("ADMIN") || principal.roles.includes("PASTOR");
    if (!isManager) {
      throw new MeetingsManagementError(
        "MEETING_ACCESS_DENIED",
        "ADMIN or PASTOR role required"
      );
    }
  }

  private async assertCellExists(
    transaction: MeetingsManagementTransaction,
    cellId: string
  ): Promise<void> {
    const cell = await transaction.findCell(cellId);
    if (!cell) {
      throw new MeetingsManagementError("MEETING_CELL_NOT_FOUND", "Cell not found");
    }
  }

  private async requireMeeting(
    transaction: MeetingsManagementTransaction,
    meetingId: string
  ): Promise<ManagedMeeting> {
    const meeting = await transaction.findMeeting(meetingId);
    if (!meeting) {
      throw new MeetingsManagementError("MEETING_NOT_FOUND", "Meeting not found");
    }
    return meeting;
  }
}

async function assertNoDateConflict(
  transaction: MeetingsManagementTransaction,
  cellId: string,
  meetingDate: string,
  excludeId?: string
): Promise<void> {
  const hasConflict = await transaction.checkDateConflict(cellId, meetingDate, excludeId);
  if (hasConflict) {
    throw new MeetingsManagementError(
      "MEETING_DATE_CONFLICT",
      "A meeting already exists for this cell on this date"
    );
  }
}

function canonicalHash(value: unknown): string {
  const json = JSON.stringify(value, Object.keys(value as object).sort());
  return createHash("sha256").update(json).digest("hex");
}
