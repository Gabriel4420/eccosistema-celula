import type {
  CellCreateInput,
  CellListScope,
  CellMember,
  CellMemberPage,
  CellPage,
  ListCellMembersInput,
  ListCellsInput,
  ManagedCell
} from "./cells-management.types";

export const CELLS_MANAGEMENT_REPOSITORY = Symbol("CELLS_MANAGEMENT_REPOSITORY");
export const CELLS_MANAGEMENT_UNIT_OF_WORK = Symbol("CELLS_MANAGEMENT_UNIT_OF_WORK");

export interface CellsManagementRepository {
  list(
    churchId: string,
    scope: CellListScope,
    input: ListCellsInput
  ): Promise<CellPage>;
  find(churchId: string, cellId: string): Promise<ManagedCell | null>;
  listMembers(
    churchId: string,
    cellId: string,
    input: ListCellMembersInput
  ): Promise<CellMemberPage>;
}

export interface CandidateUser {
  id: string;
  name: string;
  hasLeaderRole: boolean;
  hasSupervisorRole: boolean;
}

export interface SupervisorAssignment {
  id: string;
  supervisorId: string;
  leaderId: string;
}

export interface IdempotencyRecord {
  key: string;
  requestHash: string;
  resourceId: string | null;
  result: unknown;
}

export interface CellUpdateData {
  code?: string;
  name?: string;
  meetingDay?: ManagedCell["meetingDay"];
  meetingTime?: Date;
  address?: string;
  status?: ManagedCell["status"];
  leaderId?: string | null;
  traineeLeaderId?: string | null;
}

export interface MembershipPerson {
  id: string;
  fullName: string;
  phone: string | null;
}

export interface ActiveMembership {
  id: string;
  cellId: string;
}

export interface CellMembership {
  id: string;
  cellId: string;
  personId: string;
  status: CellMember["status"];
}

export interface CellsManagementTransaction {
  hasActiveRole(userId: string, roles: readonly string[]): Promise<boolean>;
  findActiveRoleNames(userId: string): Promise<ReadonlyArray<string>>;
  findCandidateUser(userId: string): Promise<CandidateUser | null>;
  findCell(cellId: string, includeDeleted?: boolean): Promise<ManagedCell | null>;
  findCellByCode(code: string): Promise<ManagedCell | null>;
  createCell(input: CellCreateInput): Promise<ManagedCell>;
  updateCell(cellId: string, data: CellUpdateData): Promise<ManagedCell>;
  findActiveSupervisorAssignment(leaderId: string): Promise<SupervisorAssignment | null>;
  createSupervisorAssignment(
    supervisorId: string,
    leaderId: string
  ): Promise<void>;
  findMembershipPerson(personId: string): Promise<MembershipPerson | null>;
  findActiveMembership(personId: string): Promise<ActiveMembership | null>;
  findCellMembership(cellId: string, personId: string): Promise<CellMembership | null>;
  createMembership(input: {
    personId: string;
    cellId: string;
    joinedAt: Date;
  }): Promise<CellMember>;
  closeMembership(
    membershipId: string,
    status: "INACTIVE" | "TRANSFERRED",
    leftAt: Date,
    reason?: string | null
  ): Promise<void>;
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

export interface CellsManagementUnitOfWork {
  execute<T>(
    churchId: string,
    work: (transaction: CellsManagementTransaction) => Promise<T>
  ): Promise<T>;
}
