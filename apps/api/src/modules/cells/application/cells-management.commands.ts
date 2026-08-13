import { createHash } from "node:crypto";
import {
  canTransitionCellStatus,
  hasConflictingLeadership,
  normalizeCellCode,
  normalizeCellText,
  requiresLeader
} from "@mission-atos/domain";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import type { CellsManagementAuthorization } from "./cells-management.authorization";
import { CellsManagementError } from "./cells-management.error";
import type {
  CellsManagementTransaction,
  CellsManagementUnitOfWork
} from "./cells-management.port";
import type {
  CellCreateInput,
  CellUpdateInput,
  ManagedCell
} from "./cells-management.types";
import { formatTime, parseTime } from "./cells-management.time";

const CREATE_OPERATION = "cell:create";
const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
const meetingFields = ["meetingDay", "meetingTime"] as const;

export class CellsManagementCommands {
  constructor(
    private readonly unitOfWork: CellsManagementUnitOfWork,
    private readonly authorization: CellsManagementAuthorization
  ) {}

  create(
    principal: AuthenticatedPrincipal,
    idempotencyKey: string,
    input: CellCreateInput
  ): Promise<ManagedCell> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertManage(transaction, principal);
      const command = normalizeCreate(input);
      const requestHash = canonicalHash(command);
      const existing = await transaction.findIdempotencyRequest(
        principal.userId,
        idempotencyKey
      );
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new CellsManagementError(
            "IDEMPOTENCY_KEY_CONFLICT",
            "Idempotency key was reused with a different request"
          );
        }
        if (existing.resourceId) {
          const cell = await transaction.findCell(existing.resourceId);
          if (cell) return cell;
        }
        throw new CellsManagementError(
          "IDEMPOTENCY_KEY_CONFLICT",
          "Idempotency key refers to an unknown resource"
        );
      }
      await this.assertLeadershipEligibility(transaction, command);
      await this.assertCodeAvailable(transaction, command.code);
      if (requiresLeader(command.status) && !command.leaderId) {
        throw new CellsManagementError(
          "CELL_LEADER_NOT_ELIGIBLE",
          "ACTIVE cells require a leader"
        );
      }
      const assignmentCreated = await this.ensureSupervisorAssignment(
        transaction,
        command.supervisorId,
        command.leaderId
      );
      const cell = await transaction.createCell(command);
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: cell.id,
        action: "CELL_CREATED",
        after: { status: command.status, code: command.code, name: command.name }
      });
      if (assignmentCreated) {
        await transaction.recordAudit({
          actorId: principal.userId,
          entityId: cell.id,
          action: "CELL_SUPERVISION_ASSIGNED",
          after: { supervisorId: command.supervisorId as string, leaderId: command.leaderId as string }
        });
      }
      await transaction.createIdempotencyRequest({
        actorId: principal.userId,
        key: idempotencyKey,
        operation: CREATE_OPERATION,
        requestHash,
        resourceId: cell.id,
        result: { cellId: cell.id },
        ttlSeconds: IDEMPOTENCY_TTL_SECONDS
      });
      return cell;
    });
  }

  update(
    principal: AuthenticatedPrincipal,
    cellId: string,
    patch: CellUpdateInput
  ): Promise<ManagedCell> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const current = await this.requireCell(transaction, cellId);
      const activeRoles = await transaction.findActiveRoleNames(principal.userId);
      const level = this.authorization.assertCanEdit(
        { ...principal, roles: activeRoles },
        current
      );
      if (level === "meeting" && (patch.code !== undefined || patch.name !== undefined)) {
        throw new CellsManagementError(
          "CELL_ACCESS_DENIED",
          "Only meeting and address can be edited for this role"
        );
      }
      const next = {
        code: patch.code !== undefined ? normalizeCellCode(patch.code) : current.code,
        name: patch.name !== undefined ? normalizeCellText(patch.name) : current.name,
        meetingDay: patch.meetingDay ?? current.meetingDay,
        meetingTime: patch.meetingTime ?? formatTime(current.meetingTime),
        address: patch.address !== undefined ? normalizeCellText(patch.address) : current.address
      };
      const changedFields = cellFields.filter((field) => next[field] !== currentValue(current, field));
      if (!changedFields.length) return current;
      if (changedFields.includes("code")) {
        await this.assertCodeAvailable(transaction, next.code, cellId);
      }
      const data = {
        ...(patch.code !== undefined ? { code: next.code } : {}),
        ...(patch.name !== undefined ? { name: next.name } : {}),
        ...(patch.meetingDay !== undefined ? { meetingDay: patch.meetingDay } : {}),
        ...(patch.meetingTime !== undefined ? { meetingTime: parseTime(patch.meetingTime) } : {}),
        ...(patch.address !== undefined ? { address: next.address } : {})
      };
      const cell = await transaction.updateCell(cellId, data);
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: cellId,
        action: auditActionFor(changedFields),
        before: { changedFields },
        after: { changedFields }
      });
      return cell;
    });
  }

  updateStatus(
    principal: AuthenticatedPrincipal,
    cellId: string,
    status: "ACTIVE" | "SUSPENDED"
  ): Promise<ManagedCell> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      const currentRole = await transaction.hasActiveRole(principal.userId, ["ADMIN", "PASTOR"]);
      this.authorization.assertManage(principal, currentRole);
      const current = await this.requireCell(transaction, cellId);
      if (current.status === status) return current;
      if (!canTransitionCellStatus(current.status, status)) {
        throw new CellsManagementError(
          "CELL_STATUS_TRANSITION_INVALID",
          "Status transition is not allowed"
        );
      }
      if (status === "ACTIVE" && requiresLeader(status) && !current.leader) {
        throw new CellsManagementError(
          "CELL_STATUS_TRANSITION_INVALID",
          "ACTIVE cells require a leader"
        );
      }
      const cell = await transaction.updateCell(cellId, { status });
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: cellId,
        action: status === "ACTIVE" ? "CELL_ACTIVATED" : "CELL_SUSPENDED",
        before: { status: current.status },
        after: { status }
      });
      return cell;
    });
  }

  updateLeader(
    principal: AuthenticatedPrincipal,
    cellId: string,
    leaderId: string,
    supervisorId: string
  ): Promise<ManagedCell> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertManage(transaction, principal);
      const current = await this.requireCell(transaction, cellId);
      if (leaderId === supervisorId) {
        throw new CellsManagementError(
          "CELL_SUPERVISOR_CONFLICT",
          "Leader and supervisor must be different"
        );
      }
      const leader = await transaction.findCandidateUser(leaderId);
      if (!leader) {
        throw new CellsManagementError(
          "CELL_LEADERSHIP_CANDIDATE_NOT_FOUND",
          "Leader candidate not found"
        );
      }
      if (!leader.hasLeaderRole) {
        throw new CellsManagementError(
          "CELL_LEADER_NOT_ELIGIBLE",
          "Leader candidate does not hold the LEADER role"
        );
      }
      const supervisor = await transaction.findCandidateUser(supervisorId);
      if (!supervisor) {
        throw new CellsManagementError(
          "CELL_SUPERVISOR_NOT_FOUND",
          "Supervisor candidate not found"
        );
      }
      if (!supervisor.hasSupervisorRole) {
        throw new CellsManagementError(
          "CELL_SUPERVISOR_CONFLICT",
          "Supervisor candidate does not hold the SUPERVISOR role"
        );
      }
      if (hasConflictingLeadership(leaderId, current.traineeLeader?.id ?? null)) {
        throw new CellsManagementError(
          "CELL_LEADERSHIP_CONFLICT",
          "Leader and trainee leader must be different"
        );
      }
      if (current.leader?.id === leaderId && current.supervisor?.id === supervisorId) {
        return current;
      }
      const assignmentCreated = await this.ensureSupervisorAssignment(
        transaction,
        supervisorId,
        leaderId
      );
      const cell = await transaction.updateCell(cellId, { leaderId });
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: cellId,
        action: "CELL_LEADER_CHANGED",
        before: { leaderId: current.leader?.id ?? null, supervisorId: current.supervisor?.id ?? null },
        after: { leaderId, supervisorId }
      });
      if (assignmentCreated) {
        await transaction.recordAudit({
          actorId: principal.userId,
          entityId: cellId,
          action: "CELL_SUPERVISION_ASSIGNED",
          after: { supervisorId, leaderId }
        });
      }
      return cell;
    });
  }

  updateTraineeLeader(
    principal: AuthenticatedPrincipal,
    cellId: string,
    traineeLeaderId: string | null
  ): Promise<ManagedCell> {
    return this.unitOfWork.execute(principal.churchId, async (transaction) => {
      await this.assertManage(transaction, principal);
      const current = await this.requireCell(transaction, cellId);
      if (current.traineeLeader?.id === traineeLeaderId) return current;
      if (traineeLeaderId !== null) {
        const candidate = await transaction.findCandidateUser(traineeLeaderId);
        if (!candidate) {
          throw new CellsManagementError(
            "CELL_LEADERSHIP_CANDIDATE_NOT_FOUND",
            "Trainee candidate not found"
          );
        }
        if (hasConflictingLeadership(current.leader?.id ?? null, traineeLeaderId)) {
          throw new CellsManagementError(
            "CELL_LEADERSHIP_CONFLICT",
            "Leader and trainee leader must be different"
          );
        }
      }
      const cell = await transaction.updateCell(cellId, { traineeLeaderId });
      await transaction.recordAudit({
        actorId: principal.userId,
        entityId: cellId,
        action: "CELL_TRAINEE_LEADER_CHANGED",
        before: { traineeLeaderId: current.traineeLeader?.id ?? null },
        after: { traineeLeaderId }
      });
      return cell;
    });
  }

  private async assertManage(
    transaction: CellsManagementTransaction,
    principal: AuthenticatedPrincipal
  ): Promise<void> {
    const currentRole = await transaction.hasActiveRole(principal.userId, ["ADMIN", "PASTOR"]);
    this.authorization.assertManage(principal, currentRole);
  }

  private async requireCell(
    transaction: CellsManagementTransaction,
    cellId: string
  ): Promise<ManagedCell> {
    const cell = await transaction.findCell(cellId);
    if (!cell) {
      throw new CellsManagementError("CELL_NOT_FOUND", "Cell not found");
    }
    return cell;
  }

  private async assertLeadershipEligibility(
    transaction: CellsManagementTransaction,
    input: CellCreateInput
  ): Promise<void> {
    if (input.leaderId) {
      const candidate = await transaction.findCandidateUser(input.leaderId);
      if (!candidate) {
        throw new CellsManagementError(
          "CELL_LEADERSHIP_CANDIDATE_NOT_FOUND",
          "Leader candidate not found"
        );
      }
      if (!candidate.hasLeaderRole) {
        throw new CellsManagementError(
          "CELL_LEADER_NOT_ELIGIBLE",
          "Leader candidate does not hold the LEADER role"
        );
      }
    }
    if (input.traineeLeaderId) {
      const candidate = await transaction.findCandidateUser(input.traineeLeaderId);
      if (!candidate) {
        throw new CellsManagementError(
          "CELL_LEADERSHIP_CANDIDATE_NOT_FOUND",
          "Trainee candidate not found"
        );
      }
    }
    if (input.supervisorId) {
      const candidate = await transaction.findCandidateUser(input.supervisorId);
      if (!candidate) {
        throw new CellsManagementError(
          "CELL_SUPERVISOR_NOT_FOUND",
          "Supervisor candidate not found"
        );
      }
      if (!candidate.hasSupervisorRole) {
        throw new CellsManagementError(
          "CELL_SUPERVISOR_CONFLICT",
          "Supervisor candidate does not hold the SUPERVISOR role"
        );
      }
    }
    if (hasConflictingLeadership(input.leaderId, input.traineeLeaderId)) {
      throw new CellsManagementError(
        "CELL_LEADERSHIP_CONFLICT",
        "Leader and trainee leader must be different"
      );
    }
  }

  private async assertCodeAvailable(
    transaction: CellsManagementTransaction,
    code: string,
    excludeId?: string
  ): Promise<void> {
    const existing = await transaction.findCellByCode(code);
    if (existing && existing.id !== excludeId) {
      throw new CellsManagementError(
        "CELL_CODE_CONFLICT",
        "Cell code is already in use"
      );
    }
  }

  private async ensureSupervisorAssignment(
    transaction: CellsManagementTransaction,
    supervisorId: string | null,
    leaderId: string | null
  ): Promise<boolean> {
    if (!supervisorId || !leaderId) return false;
    const existing = await transaction.findActiveSupervisorAssignment(leaderId);
    if (existing) {
      if (existing.supervisorId !== supervisorId) {
        throw new CellsManagementError(
          "CELL_SUPERVISOR_CONFLICT",
          "Leader already has a different active supervisor"
        );
      }
      return false;
    }
    await transaction.createSupervisorAssignment(supervisorId, leaderId);
    return true;
  }
}

const cellFields = ["code", "name", "meetingDay", "meetingTime", "address"] as const;
type CellField = (typeof cellFields)[number];

function currentValue(cell: ManagedCell, field: CellField): string {
  switch (field) {
    case "code":
      return cell.code;
    case "name":
      return cell.name;
    case "meetingDay":
      return cell.meetingDay;
    case "meetingTime":
      return formatTime(cell.meetingTime);
    case "address":
      return cell.address;
  }
}

function auditActionFor(changedFields: CellField[]): string {
  if (changedFields.every((field) => (meetingFields as readonly string[]).includes(field))) {
    return "CELL_MEETING_CHANGED";
  }
  if (changedFields.length === 1 && changedFields[0] === "address") {
    return "CELL_ADDRESS_CHANGED";
  }
  return "CELL_UPDATED";
}

function normalizeCreate(input: CellCreateInput): CellCreateInput {
  return {
    ...input,
    code: normalizeCellCode(input.code),
    name: normalizeCellText(input.name),
    address: normalizeCellText(input.address)
  };
}

function canonicalHash(value: unknown): string {
  const json = JSON.stringify(value, Object.keys(value as object).sort());
  return createHash("sha256").update(json).digest("hex");
}
