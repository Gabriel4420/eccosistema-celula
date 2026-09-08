import { saveAttendance } from "../api/attendance";
import {
  createMeeting,
  updateMeetingReport,
  updateMeetingStatus
} from "../api/meetings";
import { NetworkError, ApiError } from "../api/client";
import {
  getPendingOperations,
  markOperationSynced,
  markOperationError
} from "./database";

type OutboxPayload = {
  cellId: string;
  meetingId: string;
  [key: string]: unknown;
};

export type SyncResult = {
  processed: number;
  synced: number;
  errors: number;
};

export async function runSync(): Promise<SyncResult> {
  const pending = getPendingOperations();
  let synced = 0;
  let errors = 0;

  for (const op of pending) {
    try {
      const payload = JSON.parse(op.payload) as OutboxPayload;

      switch (op.entity) {
        case "attendance":
          await saveAttendance(payload.cellId, payload.meetingId, {
            expectedRevision: payload.expectedRevision as number,
            attendance: payload.attendance as Array<{
              personId: string;
              status: "PRESENT" | "ABSENT" | "EXCUSED";
            }>
          });
          break;

        case "meeting":
          await createMeeting(
            payload.cellId,
            { meetingDate: payload.meetingDate as string },
            op.operationId
          );
          break;

        case "meeting-report":
          await updateMeetingReport(payload.cellId, payload.meetingId, {
            observations: (payload.observations as string) ?? null
          });
          break;

        case "meeting-status":
          if (payload.status === "COMPLETED") {
            await updateMeetingStatus(payload.cellId, payload.meetingId, {
              status: "COMPLETED"
            });
          } else if (payload.status === "CANCELED") {
            await updateMeetingStatus(payload.cellId, payload.meetingId, {
              status: "CANCELED",
              cancellationReason:
                (payload.cancellationReason as string) ?? ""
            });
          }
          break;

        default:
          break;
      }

      markOperationSynced(op.operationId);
      synced++;
    } catch (error) {
      if (error instanceof NetworkError) {
        // Keep PENDING for retry
        break;
      }

      const message =
        error instanceof ApiError
          ? `${error.code}: ${error.message}`
          : "Erro desconhecido";

      // Conflito de revisão (409) ou erro de validação → marcar como erro para revisão do usuário
      if (
        error instanceof ApiError &&
        (error.status === 409 || error.status === 400 || error.status === 422)
      ) {
        markOperationError(op.operationId, message);
        errors++;
      } else {
        break;
      }
    }
  }

  return { processed: pending.length, synced, errors };
}