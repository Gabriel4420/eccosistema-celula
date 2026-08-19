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

  async create(
    principal: AuthenticatedPrincipal,
    cellId: string,
    idempotencyKey: string,
    input: MeetingCreateInput
  ): Promise<ManagedMeeting> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const requestHash = canonicalHash({ cellId, meetingDate: normalizeMeetingDate(input.meetingDate) });
      const existing = await transaction.findIdempotencyRequest(principal.userId, idempotencyKey);
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new MeetingsManagementError(
            "IDEMPOTENCY_KEY_CONFLICT",
            "Idempotency key reused with a different payload"
          );
        }
        if (existing.resourceId) {
          const meeting = await transaction.findMeeting(existing.resourceId);
          if (meeting) return meeting;
        }
      }

      this.authorization.assertCanEdit(principal);
      await this.assertEditScope(transaction, principal, cellId);
      const meetingDate = normalizeMeetingDate(input.meetingDate);
      await this.assertCellActive(transaction, cellId);
      await assertNoDateConflict(transaction, cellId, meetingDate);
      const meeting = await transaction.createMeeting(principal.churchId, cellId, meetingDate);
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
      this.assertCellMatch(current, cellId);
      this.authorization.assertCanEdit(principal);
      await this.assertEditScope(transaction, principal, cellId);
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
      this.assertCellMatch(current, cellId);
      this.authorization.assertCanEdit(principal);
      await this.assertEditScope(transaction, principal, cellId);
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
        after: { status, ...(reason ? { hasCancellationReason: "true" } : {}) }
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
      this.assertCellMatch(meeting, cellId);
      this.authorization.assertView(principal);
      await this.assertViewScope(transaction, principal, cellId);
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
      this.assertCellMatch(meeting, cellId);
      this.authorization.assertCanEdit(principal);
      await this.assertEditScope(transaction, principal, cellId);
      if (meeting.status === "CANCELED") {
        throw new MeetingsManagementError(
          "MEETING_REPORT_NOT_EDITABLE",
          "Cannot edit report for a canceled meeting"
        );
      }
      const normalized = observations !== null ? normalizeObservations(observations) : null;
      const report = await transaction.upsertReport(principal.churchId, meetingId, normalized);
      const isNew = report.createdAt.getTime() === report.updatedAt.getTime();
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: meetingId,
        action: isNew ? "MEETING_REPORT_DRAFT_CREATED" : "MEETING_REPORT_OBSERVATIONS_CHANGED",
        after: { meetingId, observationsChanged: "true" }
      });
      return report;
    });
  }

  private assertCellMatch(meeting: ManagedMeeting, cellId: string): void {
    if (meeting.cellId !== cellId) {
      throw new MeetingsManagementError("MEETING_NOT_FOUND", "Meeting not found");
    }
  }

  private async assertEditScope(
    transaction: MeetingsManagementTransaction,
    principal: AuthenticatedPrincipal,
    cellId: string
  ): Promise<void> {
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return;
    }
    const scope = await transaction.findMeetingScope(cellId);
    if (scope) {
      this.authorization.assertEditScope(principal, scope);
    }
  }

  private async assertViewScope(
    transaction: MeetingsManagementTransaction,
    principal: AuthenticatedPrincipal,
    cellId: string
  ): Promise<void> {
    if (
      principal.roles.includes("ADMIN") ||
      principal.roles.includes("PASTOR")
    ) {
      return;
    }
    const scope = await transaction.findMeetingScope(cellId);
    if (scope) {
      this.authorization.assertViewScope(principal, scope);
    }
  }

  private async assertCellActive(
    transaction: MeetingsManagementTransaction,
    cellId: string
  ): Promise<void> {
    const cell = await transaction.findCell(cellId);
    if (!cell) {
      throw new MeetingsManagementError("MEETING_CELL_NOT_FOUND", "Cell not found");
    }
    if (cell.status !== "ACTIVE") {
      throw new MeetingsManagementError(
        "MEETING_CELL_STATUS_INVALID",
        "Cell must be ACTIVE to schedule meetings"
      );
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
