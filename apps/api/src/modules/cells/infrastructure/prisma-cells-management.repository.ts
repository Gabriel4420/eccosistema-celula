import { Inject, Injectable, Logger } from "@nestjs/common";
import type { RuntimeDatabaseClient } from "@mission-atos/database";
import { DATABASE_CLIENT } from "../../identity/identity.tokens";
import { CellsManagementError } from "../application/cells-management.error";
import type {
  CandidateUser,
  CellsManagementRepository,
  CellsManagementTransaction,
  CellsManagementUnitOfWork,
  CellUpdateData,
  IdempotencyRecord,
  SupervisorAssignment
} from "../application/cells-management.port";
import { parseTime } from "../application/cells-management.time";
import type {
  CellCreateInput,
  CellListScope,
  CellPage,
  ListCellsInput,
  ManagedCell
} from "../application/cells-management.types";

const cellSelect = {
  id: true,
  churchId: true,
  code: true,
  name: true,
  status: true,
  leaderId: true,
  traineeLeaderId: true,
  meetingDay: true,
  meetingTime: true,
  address: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  leader: { select: { id: true, firstName: true, lastName: true } },
  traineeLeader: { select: { id: true, firstName: true, lastName: true } }
} as const;

const supervisorSelect = {
  id: true,
  firstName: true,
  lastName: true
} as const;

const sortableFields: Record<string, "name" | "code" | "meetingDay" | "createdAt"> = {
  name: "name",
  code: "code",
  meetingDay: "meetingDay",
  createdAt: "createdAt"
};

@Injectable()
export class PrismaCellsManagementRepository
  implements CellsManagementRepository, CellsManagementUnitOfWork
{
  private readonly logger = new Logger(PrismaCellsManagementRepository.name);

  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: RuntimeDatabaseClient
  ) {}

  async list(
    churchId: string,
    scope: CellListScope,
    input: ListCellsInput
  ): Promise<CellPage> {
    const startedAt = Date.now();
    const terms = input.search?.split(/\s+/).filter(Boolean) ?? [];
    let leaderIds: string[] | null = null;
    if (scope.kind === "supervisor") {
      const assignments = await this.database.supervisorAssignment.findMany({
        where: { churchId, supervisorId: scope.userId, deletedAt: null },
        select: { leaderId: true }
      });
      leaderIds = assignments.map((assignment) => assignment.leaderId);
      if (!leaderIds.length) {
        this.logger.log(JSON.stringify({ operation: "cells.list", result: "success", durationMs: Date.now() - startedAt, itemCount: 0 }));
        return { items: [], totalItems: 0 };
      }
    }
    const where = {
      churchId,
      deletedAt: null,
      ...(input.status ? { status: input.status } : {}),
      ...(input.leaderId ? { leaderId: input.leaderId } : {}),
      ...(input.meetingDay ? { meetingDay: input.meetingDay } : {}),
      ...(scope.kind === "supervisor" && leaderIds ? { leaderId: { in: leaderIds } } : {}),
      ...(scope.kind === "leader"
        ? { OR: [{ leaderId: scope.userId }, { traineeLeaderId: scope.userId }] }
        : {}),
      ...(terms.length
        ? {
            AND: terms.map((term) => ({
              OR: [
                { name: { contains: term, mode: "insensitive" as const } },
                { code: { contains: term, mode: "insensitive" as const } }
              ]
            }))
          }
        : {})
    };
    const orderBy = (sortableFields[input.sortBy] ?? "name") as "name" | "code" | "meetingDay" | "createdAt";
    const [items, totalItems] = await this.database.$transaction([
      this.database.cell.findMany({
        where,
        select: cellSelect,
        orderBy: [{ [orderBy]: input.sortOrder }, { id: "asc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      }),
      this.database.cell.count({ where })
    ], { isolationLevel: "RepeatableRead" });
    const cells = await this.hydrateCells(items);
    this.logger.log(JSON.stringify({ operation: "cells.list", result: "success", durationMs: Date.now() - startedAt, itemCount: cells.length }));
    return { items: cells, totalItems };
  }

  async find(churchId: string, cellId: string): Promise<ManagedCell | null> {
    const cell = await this.database.cell.findFirst({
      where: { id: cellId, churchId, deletedAt: null },
      select: cellSelect
    });
    if (!cell) return null;
    const supervisor = await this.supervisorForLeader(churchId, cell.leaderId);
    return mapCell(cell, supervisor);
  }

  async execute<T>(
    churchId: string,
    work: (transaction: CellsManagementTransaction) => Promise<T>
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
            return work(new PrismaCellsManagementTransaction(databaseTransaction, churchId));
          },
          { isolationLevel: "Serializable" }
        );
        this.logger.log(JSON.stringify({ operation: "cells.transaction", result: "success", durationMs: Date.now() - startedAt, attempt }));
        return result;
      } catch (error) {
        if (!isPrismaCode(error, "P2034") || attempt === 3) {
          this.logger.error(JSON.stringify({ operation: "cells.transaction", result: "rollback", durationMs: Date.now() - startedAt, attempt }));
          throw error;
        }
        this.logger.warn(JSON.stringify({ operation: "cells.transaction", result: "retry", attempt }));
      }
    }
    throw new Error("Serializable transaction retry exhausted");
  }

  private async supervisorForLeader(
    churchId: string,
    leaderId: string | null
  ): Promise<{ id: string; firstName: string; lastName: string } | null> {
    if (!leaderId) return null;
    const assignment = await this.database.supervisorAssignment.findFirst({
      where: { churchId, leaderId, deletedAt: null },
      select: { supervisor: { select: supervisorSelect } }
    });
    return assignment?.supervisor ?? null;
  }

  private async hydrateCells(
    cells: Array<CellRow>
  ): Promise<ManagedCell[]> {
    if (!cells.length) return [];
    const leaderIds = [...new Set(cells.map((cell) => cell.leaderId).filter((id): id is string => id !== null))];
    const churchId = cells[0]!.churchId;
    const assignments = leaderIds.length
      ? await this.database.supervisorAssignment.findMany({
          where: { churchId, leaderId: { in: leaderIds }, deletedAt: null },
          select: { leaderId: true, supervisor: { select: supervisorSelect } }
        })
      : [];
    const supervisorByLeader = new Map(assignments.map((assignment) => [assignment.leaderId, assignment.supervisor]));
    return cells.map((cell) => mapCell(cell, cell.leaderId ? supervisorByLeader.get(cell.leaderId) ?? null : null));
  }
}

type TransactionClient = Parameters<Parameters<RuntimeDatabaseClient["$transaction"]>[0]>[0];
type CellRow = {
  id: string;
  churchId: string;
  code: string;
  name: string;
  status: ManagedCell["status"];
  leaderId: string | null;
  traineeLeaderId: string | null;
  meetingDay: ManagedCell["meetingDay"];
  meetingTime: Date;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  leader: { id: string; firstName: string; lastName: string } | null;
  traineeLeader: { id: string; firstName: string; lastName: string } | null;
};

class PrismaCellsManagementTransaction implements CellsManagementTransaction {
  constructor(
    private readonly transaction: TransactionClient,
    private readonly churchId: string
  ) {}

  async hasActiveRole(userId: string, roles: readonly string[]): Promise<boolean> {
    return (
      (await this.transaction.user.count({
        where: {
          id: userId,
          churchId: this.churchId,
          status: "ACTIVE",
          deletedAt: null,
          userRoles: {
            some: {
              churchId: this.churchId,
              deletedAt: null,
              role: { name: { in: [...roles] }, deletedAt: null }
            }
          }
        }
      })) === 1
    );
  }

  async findActiveRoleNames(userId: string): Promise<ReadonlyArray<string>> {
    const user = await this.transaction.user.findFirst({
      where: { id: userId, churchId: this.churchId, status: "ACTIVE", deletedAt: null },
      select: {
        userRoles: {
          where: { churchId: this.churchId, deletedAt: null, role: { deletedAt: null } },
          select: { role: { select: { name: true } } }
        }
      }
    });
    if (!user) return [];
    return user.userRoles.map(({ role }) => role.name);
  }

  async findCandidateUser(userId: string): Promise<CandidateUser | null> {
    const user = await this.transaction.user.findFirst({
      where: { id: userId, churchId: this.churchId, status: "ACTIVE", deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userRoles: {
          where: { churchId: this.churchId, deletedAt: null, role: { deletedAt: null } },
          select: { role: { select: { name: true } } }
        }
      }
    });
    if (!user) return null;
    const roleNames = user.userRoles.map(({ role }) => role.name);
    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      hasLeaderRole: roleNames.includes("LEADER"),
      hasSupervisorRole: roleNames.includes("SUPERVISOR")
    };
  }

  async findCell(cellId: string, includeDeleted = false): Promise<ManagedCell | null> {
    const cell = await this.transaction.cell.findFirst({
      where: {
        id: cellId,
        churchId: this.churchId,
        ...(!includeDeleted ? { deletedAt: null } : {})
      },
      select: cellSelect
    });
    if (!cell) return null;
    const supervisor = await this.findSupervisorForLeader(cell.leaderId);
    return mapCell(cell, supervisor);
  }

  async findCellByCode(code: string): Promise<ManagedCell | null> {
    const cell = await this.transaction.cell.findFirst({
      where: { code, churchId: this.churchId },
      select: cellSelect
    });
    if (!cell) return null;
    const supervisor = await this.findSupervisorForLeader(cell.leaderId);
    return mapCell(cell, supervisor);
  }

  async createCell(input: CellCreateInput): Promise<ManagedCell> {
    const cell = await this.transaction.cell.create({
      data: {
        churchId: this.churchId,
        code: input.code,
        name: input.name,
        status: input.status,
        leaderId: input.leaderId,
        traineeLeaderId: input.traineeLeaderId,
        meetingDay: input.meetingDay,
        meetingTime: parseTime(input.meetingTime),
        address: input.address
      },
      select: cellSelect
    });
    const supervisor = await this.findSupervisorForLeader(cell.leaderId);
    return mapCell(cell, supervisor);
  }

  async updateCell(cellId: string, data: CellUpdateData): Promise<ManagedCell> {
    await this.requireCell(cellId);
    const cell = await this.transaction.cell.update({
      where: { id_churchId: { id: cellId, churchId: this.churchId } },
      data,
      select: cellSelect
    });
    const supervisor = await this.findSupervisorForLeader(cell.leaderId);
    return mapCell(cell, supervisor);
  }

  async findActiveSupervisorAssignment(leaderId: string): Promise<SupervisorAssignment | null> {
    const assignment = await this.transaction.supervisorAssignment.findFirst({
      where: { churchId: this.churchId, leaderId, deletedAt: null },
      select: { id: true, supervisorId: true, leaderId: true }
    });
    return assignment;
  }

  async createSupervisorAssignment(supervisorId: string, leaderId: string): Promise<void> {
    await this.transaction.supervisorAssignment.create({
      data: { churchId: this.churchId, supervisorId, leaderId }
    });
  }

  async findIdempotencyRequest(actorId: string, key: string): Promise<IdempotencyRecord | null> {
    const record = await this.transaction.idempotencyRequest.findFirst({
      where: { churchId: this.churchId, actorId, operation: "cell:create", key },
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
        entity: "Cell",
        entityId: input.entityId,
        action: input.action,
        ...(input.before ? { before: input.before } : {}),
        ...(input.after ? { after: input.after } : {})
      }
    });
  }

  private async findSupervisorForLeader(leaderId: string | null) {
    if (!leaderId) return null;
    const assignment = await this.transaction.supervisorAssignment.findFirst({
      where: { churchId: this.churchId, leaderId, deletedAt: null },
      select: { supervisor: { select: supervisorSelect } }
    });
    return assignment?.supervisor ?? null;
  }

  private async requireCell(cellId: string): Promise<ManagedCell> {
    const cell = await this.findCell(cellId);
    if (!cell) {
      throw new CellsManagementError("CELL_NOT_FOUND", "Cell not found");
    }
    return cell;
  }
}

function mapCell(
  cell: CellRow,
  supervisor: { id: string; firstName: string; lastName: string } | null
): ManagedCell {
  return {
    id: cell.id,
    churchId: cell.churchId,
    code: cell.code,
    name: cell.name,
    status: cell.status,
    leader: cell.leader ? { id: cell.leader.id, name: `${cell.leader.firstName} ${cell.leader.lastName}`.trim() } : null,
    supervisor: supervisor ? { id: supervisor.id, name: `${supervisor.firstName} ${supervisor.lastName}`.trim() } : null,
    traineeLeader: cell.traineeLeader
      ? { id: cell.traineeLeader.id, name: `${cell.traineeLeader.firstName} ${cell.traineeLeader.lastName}`.trim() }
      : null,
    meetingDay: cell.meetingDay,
    meetingTime: cell.meetingTime,
    address: cell.address,
    createdAt: cell.createdAt,
    updatedAt: cell.updatedAt,
    deletedAt: cell.deletedAt
  };
}

function isPrismaCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
