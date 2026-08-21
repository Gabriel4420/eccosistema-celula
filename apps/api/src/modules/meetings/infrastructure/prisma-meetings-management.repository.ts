import { Inject, Injectable, Logger } from "@nestjs/common";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import type { ReportStatus } from "@mission-atos/domain";
import { DATABASE_CLIENT } from "../../identity/identity.tokens";
import { MeetingsManagementError } from "../application/meetings-management.error";
import type {
  IdempotencyRecord,
  MeetingsManagementRepository,
  MeetingsManagementTransaction,
  MeetingsManagementUnitOfWork
} from "../application/meetings-management.port";
import type {
  ListMeetingsInput,
  ManagedMeeting,
  ManagedMeetingReport,
  MeetingPage
} from "../application/meetings-management.types";

const meetingSelect = {
  id: true,
  churchId: true,
  cellId: true,
  meetingDate: true,
  status: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
  cell: { select: { id: true, code: true, name: true } }
} as const;

const reportSelect = {
  id: true,
  meetingId: true,
  observations: true,
  status: true,
  submittedBy: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true
} as const;

@Injectable()
export class PrismaMeetingsManagementRepository
  implements MeetingsManagementRepository, MeetingsManagementUnitOfWork
{
  private readonly logger = new Logger(PrismaMeetingsManagementRepository.name);

  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: RuntimeDatabaseClient
  ) {}

  async list(
    churchId: string,
    cellId: string,
    input: ListMeetingsInput
  ): Promise<MeetingPage> {
    const startedAt = Date.now();
    const where = {
      churchId,
      cellId,
      deletedAt: null,
      ...(input.from || input.to
        ? {
            meetingDate: {
              ...(input.from ? { gte: new Date(input.from) } : {}),
              ...(input.to ? { lte: new Date(input.to) } : {})
            }
          }
        : {}),
      ...(input.status ? { status: input.status } : {})
    };
    const [items, totalItems] = await this.database.$transaction([
      this.database.meeting.findMany({
        where,
        select: meetingSelect,
        orderBy: [
          { meetingDate: input.sortOrder },
          { id: "asc" }
        ],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      }),
      this.database.meeting.count({ where })
    ], { isolationLevel: "RepeatableRead" });
    const meetings = items.map(mapMeeting);
    this.logger.log(JSON.stringify({ operation: "meetings.list", result: "success", durationMs: Date.now() - startedAt, itemCount: meetings.length }));
    return { items: meetings, totalItems };
  }

  async find(churchId: string, meetingId: string): Promise<ManagedMeeting | null> {
    const meeting = await this.database.meeting.findFirst({
      where: { id: meetingId, churchId, deletedAt: null },
      select: meetingSelect
    });
    if (!meeting) return null;
    return mapMeeting(meeting);
  }

  async findReport(churchId: string, meetingId: string): Promise<ManagedMeetingReport | null> {
    const report = await this.database.meetingReport.findFirst({
      where: { meetingId, churchId, deletedAt: null },
      select: reportSelect
    });
    if (!report) return null;
    return mapReport(report);
  }

  async execute<T>(
    churchId: string,
    work: (transaction: MeetingsManagementTransaction) => Promise<T>
  ): Promise<T> {
    const startedAt = Date.now();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const result = await this.database.$transaction(
          async (databaseTransaction) => {
            await databaseTransaction.$queryRaw`
              SELECT "id"
              FROM "churches"
              WHERE "id" = ${churchId}::uuid AND "deleted_at" IS NULL
              FOR UPDATE
            `;
            return work(new PrismaMeetingsManagementTransaction(databaseTransaction, churchId));
          },
          { isolationLevel: "Serializable" }
        );
        this.logger.log(JSON.stringify({ operation: "meetings.transaction", result: "success", durationMs: Date.now() - startedAt, attempt }));
        return result;
      } catch (error) {
        const errorName = error instanceof Error ? error.name : "Unknown";
        const errorCode = (typeof error === "object" && error !== null && "code" in error) ? String((error as { code: unknown }).code) : undefined;
        if (!isPrismaCode(error, "P2034") || attempt === 3) {
          this.logger.error(JSON.stringify({
            operation: "meetings.transaction",
            result: "rollback",
            durationMs: Date.now() - startedAt,
            attempt,
            errorName,
            errorCode,
            errorMessage: error instanceof Error ? error.message : String(error)
          }));
          if (attempt === 3 && isPrismaCode(error, "P2034")) {
            throw new MeetingsManagementError(
              "MEETING_TRANSACTION_RETRY_EXHAUSTED",
              "Serializable transaction retry exhausted"
            );
          }
          if (error instanceof MeetingsManagementError) {
            throw error;
          }
          throw new MeetingsManagementError(
            "MEETING_TRANSACTION_RETRY_EXHAUSTED",
            "Transaction failed: " + (error instanceof Error ? error.message : "unknown error")
          );
        }
        this.logger.warn(JSON.stringify({ operation: "meetings.transaction", result: "retry", attempt }));
      }
    }
    throw new MeetingsManagementError(
      "MEETING_TRANSACTION_RETRY_EXHAUSTED",
      "Serializable transaction retry exhausted"
    );
  }
}

type TransactionClient = Parameters<Parameters<RuntimeDatabaseClient["$transaction"]>[0]>[0];

type MeetingRow = {
  id: string;
  churchId: string;
  cellId: string;
  meetingDate: Date;
  status: ManagedMeeting["status"];
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  cell: { id: string; code: string; name: string };
};

type ReportRow = {
  id: string;
  meetingId: string;
  observations: string | null;
  status: ReportStatus;
  submittedBy: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaMeetingsManagementTransaction implements MeetingsManagementTransaction {
  constructor(
    private readonly transaction: TransactionClient,
    private readonly churchId: string
  ) {}

  async findCell(cellId: string): Promise<{ id: string; churchId: string; code: string; name: string; status: string } | null> {
    return this.transaction.cell.findFirst({
      where: { id: cellId, churchId: this.churchId, deletedAt: null },
      select: { id: true, churchId: true, code: true, name: true, status: true }
    });
  }

  async findMeeting(meetingId: string): Promise<ManagedMeeting | null> {
    const meeting = await this.transaction.meeting.findFirst({
      where: { id: meetingId, churchId: this.churchId, deletedAt: null },
      select: meetingSelect
    });
    if (!meeting) return null;
    return mapMeeting(meeting);
  }

  async findMeetingScope(cellId: string): Promise<{ leaderId: string | null; traineeLeaderId: string | null; supervisorId: string | null } | null> {
    const cell = await this.transaction.cell.findFirst({
      where: { id: cellId, churchId: this.churchId, deletedAt: null },
      select: { leaderId: true, traineeLeaderId: true }
    });
    if (!cell) return null;
    let supervisorId: string | null = null;
    if (cell.leaderId) {
      const assignment = await this.transaction.supervisorAssignment.findFirst({
        where: {
          churchId: this.churchId,
          leaderId: cell.leaderId,
          deletedAt: null
        },
        select: { supervisorId: true }
      });
      supervisorId = assignment?.supervisorId ?? null;
    }
    return {
      leaderId: cell.leaderId,
      traineeLeaderId: cell.traineeLeaderId,
      supervisorId
    };
  }

  async createMeeting(churchId: string, cellId: string, meetingDate: string): Promise<ManagedMeeting> {
    const meeting = await this.transaction.meeting.create({
      data: {
        churchId,
        cellId,
        meetingDate: new Date(meetingDate),
        status: "SCHEDULED"
      },
      select: meetingSelect
    });
    return mapMeeting(meeting);
  }

  async updateMeetingDate(meetingId: string, meetingDate: string): Promise<ManagedMeeting> {
    const meeting = await this.transaction.meeting.update({
      where: { id_churchId: { id: meetingId, churchId: this.churchId } },
      data: { meetingDate: new Date(meetingDate) },
      select: meetingSelect
    });
    return mapMeeting(meeting);
  }

  async updateMeetingStatus(
    meetingId: string,
    status: "COMPLETED" | "CANCELED",
    cancellationReason?: string
  ): Promise<ManagedMeeting> {
    const meeting = await this.transaction.meeting.update({
      where: { id_churchId: { id: meetingId, churchId: this.churchId } },
      data: {
        status,
        ...(cancellationReason !== undefined ? { cancellationReason } : {})
      },
      select: meetingSelect
    });
    return mapMeeting(meeting);
  }

  async checkDateConflict(
    cellId: string,
    meetingDate: string,
    excludeId?: string
  ): Promise<boolean> {
    const count = await this.transaction.meeting.count({
      where: {
        churchId: this.churchId,
        cellId,
        meetingDate: new Date(meetingDate),
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });
    return count > 0;
  }

  async findReport(churchId: string, meetingId: string): Promise<ManagedMeetingReport | null> {
    const report = await this.transaction.meetingReport.findFirst({
      where: { meetingId, churchId, deletedAt: null },
      select: reportSelect
    });
    if (!report) return null;
    return mapReport(report);
  }

  async upsertReport(
    churchId: string,
    meetingId: string,
    observations: string | null
  ): Promise<ManagedMeetingReport> {
    const existing = await this.transaction.meetingReport.findFirst({
      where: { meetingId, churchId, deletedAt: null },
      select: { id: true }
    });
    if (existing) {
      const report = await this.transaction.meetingReport.update({
        where: { id: existing.id },
        data: { observations },
        select: reportSelect
      });
      return mapReport(report);
    }
    const report = await this.transaction.meetingReport.create({
      data: {
        churchId,
        meetingId,
        observations,
        status: "DRAFT"
      },
      select: reportSelect
    });
    return mapReport(report);
  }

  async findIdempotencyRequest(actorId: string, key: string): Promise<IdempotencyRecord | null> {
    const record = await this.transaction.idempotencyRequest.findFirst({
      where: { churchId: this.churchId, actorId, operation: "meeting:create", key },
      select: { key: true, requestHash: true, resourceId: true, result: true }
    });
    return record;
  }

  async createIdempotencyRequest(input: {
    actorId: string;
    key: string;
    operation: string;
    requestHash: string;
    resourceId: string;
    result: unknown;
    ttlSeconds: number;
  }): Promise<void> {
    await this.transaction.idempotencyRequest.create({
      data: {
        churchId: this.churchId,
        actorId: input.actorId,
        operation: input.operation,
        key: input.key,
        requestHash: input.requestHash,
        resourceId: input.resourceId,
        result: input.result as never,
        expiresAt: new Date(Date.now() + input.ttlSeconds * 1000)
      }
    });
  }

  async recordAudit(input: {
    actorId: string;
    entityId: string;
    action: string;
    before?: Record<string, string | string[] | null>;
    after?: Record<string, string | string[] | null>;
  }): Promise<void> {
    await this.transaction.auditLog.create({
      data: {
        churchId: this.churchId,
        userId: input.actorId,
        entity: "Meeting",
        entityId: input.entityId,
        action: input.action,
        ...(input.before ? { before: input.before } : {}),
        ...(input.after ? { after: input.after } : {})
      }
    });
  }
}

function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function mapMeeting(meeting: MeetingRow): ManagedMeeting {
  return {
    id: meeting.id,
    churchId: meeting.churchId,
    cellId: meeting.cellId,
    cell: meeting.cell,
    meetingDate: formatDateOnly(meeting.meetingDate),
    status: meeting.status,
    cancellationReason: meeting.cancellationReason,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt
  };
}

function mapReport(report: ReportRow): ManagedMeetingReport {
  return {
    id: report.id,
    meetingId: report.meetingId,
    observations: report.observations,
    status: "DRAFT" as const,
    submittedBy: null,
    submittedAt: null,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  };
}

function isPrismaCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
