import { createHash } from "node:crypto";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";
import { CellsManagementAuthorization } from "./cells-management.authorization";
import { CellsManagementCommands } from "./cells-management.commands";
import { CellsManagementError } from "./cells-management.error";
import {
  CellEditPolicy,
  CellListScopePolicy,
  CellViewPolicy
} from "../domain/cells-management.policy";
import type {
  CellsManagementTransaction,
  CellsManagementUnitOfWork,
  IdempotencyRecord
} from "./cells-management.port";
import type {
  CellCreateInput,
  CellUpdateInput,
  ManagedCell
} from "./cells-management.types";

function canonicalHash(value: unknown): string {
  const json = JSON.stringify(value, Object.keys(value as object).sort());
  return createHash("sha256").update(json).digest("hex");
}

const manager: AuthenticatedPrincipal = {
  userId: "admin-1",
  churchId: "church-1",
  sessionId: "session-1",
  roles: ["ADMIN"]
};

const leaderPrincipal: AuthenticatedPrincipal = {
  userId: "leader-1",
  churchId: "church-1",
  sessionId: "session-1",
  roles: ["LEADER"]
};

function baseCell(overrides: Partial<ManagedCell> = {}): ManagedCell {
  return {
    id: "cell-1",
    churchId: "church-1",
    code: "CEL-001",
    name: "Célula Esperança",
    status: "ACTIVE",
    leader: { id: "leader-1", name: "Líder" },
    supervisor: { id: "supervisor-1", name: "Supervisor" },
    traineeLeader: null,
    meetingDay: "WEDNESDAY",
    meetingTime: new Date("1970-01-01T19:30:00.000Z"),
    address: "Rua das Flores, 10",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    ...overrides
  };
}

function createInput(overrides: Partial<CellCreateInput> = {}): CellCreateInput {
  return {
    code: "CEL-002",
    name: "Célula Renascer",
    status: "FORMING",
    leaderId: null,
    supervisorId: null,
    traineeLeaderId: null,
    meetingDay: "THURSDAY",
    meetingTime: "20:00",
    address: "Rua das Acácias, 5",
    ...overrides
  };
}

function auth(): CellsManagementAuthorization {
  return new CellsManagementAuthorization(
    new CellListScopePolicy(),
    new CellViewPolicy(),
    new CellEditPolicy()
  );
}

type TransactionMocks = {
  [K in keyof CellsManagementTransaction]: jest.Mock;
};

function transactionMocks(overrides: Partial<CellsManagementTransaction> = {}) {
  const mocks = {} as TransactionMocks;
  const names: (keyof CellsManagementTransaction)[] = [
    "hasActiveRole",
    "findActiveRoleNames",
    "findCandidateUser",
    "findCell",
    "findCellByCode",
    "createCell",
    "updateCell",
    "findActiveSupervisorAssignment",
    "createSupervisorAssignment",
    "findIdempotencyRequest",
    "createIdempotencyRequest",
    "recordAudit"
  ];
  for (const name of names) {
    mocks[name] = jest.fn();
  }
  const transaction: CellsManagementTransaction = {
    hasActiveRole: mocks.hasActiveRole,
    findActiveRoleNames: mocks.findActiveRoleNames,
    findCandidateUser: mocks.findCandidateUser,
    findCell: mocks.findCell,
    findCellByCode: mocks.findCellByCode,
    createCell: mocks.createCell,
    updateCell: mocks.updateCell,
    findActiveSupervisorAssignment: mocks.findActiveSupervisorAssignment,
    createSupervisorAssignment: mocks.createSupervisorAssignment,
    findIdempotencyRequest: mocks.findIdempotencyRequest,
    createIdempotencyRequest: mocks.createIdempotencyRequest,
    recordAudit: mocks.recordAudit,
    ...overrides
  };
  return { transaction, mocks };
}

function unitOfWorkWith(transaction: CellsManagementTransaction): CellsManagementUnitOfWork {
  return {
    execute: jest.fn(async (_churchId, work) => work(transaction))
  };
}

describe("cells management commands", () => {
  const commands = (transaction: CellsManagementTransaction) =>
    new CellsManagementCommands(unitOfWorkWith(transaction), auth());

  describe("create", () => {
    it("creates a forming cell with audit and idempotency record", async () => {
      const cell = baseCell({ id: "cell-2", code: "CEL-002", status: "FORMING" });
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue(null);
      mocks.findCellByCode.mockResolvedValue(null);
      mocks.createCell.mockResolvedValue(cell);
      mocks.findActiveSupervisorAssignment.mockResolvedValue(null);

      const result = await commands(transaction).create(manager, "key-1", createInput());

      expect(mocks.createCell).toHaveBeenCalledWith(
        expect.objectContaining({ code: "CEL-002", status: "FORMING" })
      );
      expect(mocks.recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "CELL_CREATED", entityId: "cell-2" })
      );
      expect(mocks.createSupervisorAssignment).not.toHaveBeenCalled();
      expect(mocks.createIdempotencyRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: "admin-1",
          key: "key-1",
          operation: "cell:create",
          resourceId: "cell-2",
          ttlSeconds: 24 * 60 * 60
        })
      );
      expect(result).toEqual(cell);
    });

    it("creates the supervisor assignment and audits it when supervisor and leader are provided", async () => {
      const cell = baseCell({ id: "cell-3", code: "CEL-003" });
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue(null);
      mocks.findCandidateUser.mockImplementation(async (id) =>
        id === "leader-2"
          ? { id: "leader-2", name: "Líder Dois", hasLeaderRole: true, hasSupervisorRole: false }
          : { id: "supervisor-2", name: "Supervisor Dois", hasLeaderRole: false, hasSupervisorRole: true }
      );
      mocks.findCellByCode.mockResolvedValue(null);
      mocks.findActiveSupervisorAssignment.mockResolvedValue(null);
      mocks.createCell.mockResolvedValue(cell);

      await commands(transaction).create(
        manager,
        "key-2",
        createInput({ status: "ACTIVE", leaderId: "leader-2", supervisorId: "supervisor-2" })
      );

      expect(mocks.createSupervisorAssignment).toHaveBeenCalledWith("supervisor-2", "leader-2");
      const audits = mocks.recordAudit.mock.calls.map((call) => call[0].action);
      expect(audits).toEqual(
        expect.arrayContaining(["CELL_CREATED", "CELL_SUPERVISION_ASSIGNED"])
      );
    });

    it("replays the same cell when the idempotency key matches", async () => {
      const cell = baseCell({ id: "cell-2", code: "CEL-002" });
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      const record: IdempotencyRecord = {
        key: "key-1",
        requestHash: canonicalHash(createInput()),
        resourceId: "cell-2",
        result: { cellId: "cell-2" }
      };
      mocks.findIdempotencyRequest.mockResolvedValue(record);
      mocks.findCell.mockResolvedValue(cell);

      const result = await commands(transaction).create(manager, "key-1", createInput());

      expect(result).toEqual(cell);
      expect(mocks.createCell).not.toHaveBeenCalled();
      expect(mocks.recordAudit).not.toHaveBeenCalled();
    });

    it("rejects a reused idempotency key with a different payload", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue({
        key: "key-1",
        requestHash: "different-hash",
        resourceId: "cell-2",
        result: { cellId: "cell-2" }
      });
      mocks.findCell.mockResolvedValue(baseCell({ id: "cell-2" }));

      await expect(
        commands(transaction).create(manager, "key-1", createInput({ name: "Outro nome" }))
      ).rejects.toEqual(
        new CellsManagementError("IDEMPOTENCY_KEY_CONFLICT", "Idempotency key was reused with a different request")
      );
    });

    it("rejects a replayed key that refers to an unknown resource", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue({
        key: "key-1",
        requestHash: canonicalHash(createInput()),
        resourceId: "missing",
        result: { cellId: "missing" }
      });
      mocks.findCell.mockResolvedValue(null);

      await expect(
        commands(transaction).create(manager, "key-1", createInput())
      ).rejects.toEqual(
        new CellsManagementError("IDEMPOTENCY_KEY_CONFLICT", "Idempotency key refers to an unknown resource")
      );
    });

    it("requires an active ADMIN/PASTOR role", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(false);

      await expect(
        commands(transaction).create(leaderPrincipal, "key-1", createInput())
      ).rejects.toEqual(new CellsManagementError("CELL_ACCESS_DENIED", "Access is not allowed"));
    });

    it("rejects an ACTIVE cell without a leader", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue(null);
      mocks.findCellByCode.mockResolvedValue(null);

      await expect(
        commands(transaction).create(
          manager,
          "key-1",
          createInput({ status: "ACTIVE", leaderId: null })
        )
      ).rejects.toEqual(
        new CellsManagementError("CELL_LEADER_NOT_ELIGIBLE", "ACTIVE cells require a leader")
      );
    });

    it("rejects an unknown leader candidate", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue(null);
      mocks.findCandidateUser.mockResolvedValue(null);

      await expect(
        commands(transaction).create(
          manager,
          "key-1",
          createInput({ status: "ACTIVE", leaderId: "ghost" })
        )
      ).rejects.toEqual(
        new CellsManagementError("CELL_LEADERSHIP_CANDIDATE_NOT_FOUND", "Leader candidate not found")
      );
    });

    it("rejects a leader candidate without the LEADER role", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue(null);
      mocks.findCandidateUser.mockResolvedValue({
        id: "leader-2",
        name: "Líder Dois",
        hasLeaderRole: false,
        hasSupervisorRole: false
      });

      await expect(
        commands(transaction).create(
          manager,
          "key-1",
          createInput({ status: "ACTIVE", leaderId: "leader-2" })
        )
      ).rejects.toEqual(
        new CellsManagementError("CELL_LEADER_NOT_ELIGIBLE", "Leader candidate does not hold the LEADER role")
      );
    });

    it("does not require the LEADER role for a trainee leader", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue(null);
      mocks.findCellByCode.mockResolvedValue(null);
      mocks.findCandidateUser.mockResolvedValue({
        id: "trainee-1",
        name: "Treinando",
        hasLeaderRole: false,
        hasSupervisorRole: false
      });
      mocks.findActiveSupervisorAssignment.mockResolvedValue(null);
      mocks.createCell.mockResolvedValue(baseCell({ id: "cell-4" }));

      await expect(
        commands(transaction).create(
          manager,
          "key-1",
          createInput({ traineeLeaderId: "trainee-1" })
        )
      ).resolves.toBeDefined();
      expect(mocks.createCell).toHaveBeenCalledWith(
        expect.objectContaining({ traineeLeaderId: "trainee-1" })
      );
    });

    it("rejects a supervisor without the SUPERVISOR role", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue(null);
      mocks.findCandidateUser.mockResolvedValue({
        id: "supervisor-2",
        name: "Supervisor Dois",
        hasLeaderRole: false,
        hasSupervisorRole: false
      });

      await expect(
        commands(transaction).create(
          manager,
          "key-1",
          createInput({ supervisorId: "supervisor-2" })
        )
      ).rejects.toEqual(
        new CellsManagementError("CELL_SUPERVISOR_CONFLICT", "Supervisor candidate does not hold the SUPERVISOR role")
      );
    });

    it("rejects leader and trainee leader being the same person", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue(null);
      mocks.findCandidateUser.mockResolvedValue({
        id: "same-1",
        name: "Mesma Pessoa",
        hasLeaderRole: true,
        hasSupervisorRole: false
      });

      await expect(
        commands(transaction).create(
          manager,
          "key-1",
          createInput({ leaderId: "same-1", traineeLeaderId: "same-1" })
        )
      ).rejects.toEqual(
        new CellsManagementError("CELL_LEADERSHIP_CONFLICT", "Leader and trainee leader must be different")
      );
    });

    it("rejects a duplicate cell code", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue(null);
      mocks.findCellByCode.mockResolvedValue(baseCell());

      await expect(
        commands(transaction).create(manager, "key-1", createInput())
      ).rejects.toEqual(
        new CellsManagementError("CELL_CODE_CONFLICT", "Cell code is already in use")
      );
    });

    it("rejects a leader that already has a different active supervisor", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findIdempotencyRequest.mockResolvedValue(null);
      mocks.findCellByCode.mockResolvedValue(null);
      mocks.findCandidateUser.mockImplementation(async (id) =>
        id === "leader-2"
          ? { id: "leader-2", name: "Líder Dois", hasLeaderRole: true, hasSupervisorRole: false }
          : { id: "supervisor-2", name: "Supervisor Dois", hasLeaderRole: false, hasSupervisorRole: true }
      );
      mocks.findActiveSupervisorAssignment.mockResolvedValue({
        id: "assignment-1",
        supervisorId: "supervisor-9",
        leaderId: "leader-2"
      });

      await expect(
        commands(transaction).create(
          manager,
          "key-1",
          createInput({ status: "ACTIVE", leaderId: "leader-2", supervisorId: "supervisor-2" })
        )
      ).rejects.toEqual(
        new CellsManagementError("CELL_SUPERVISOR_CONFLICT", "Leader already has a different active supervisor")
      );
    });
  });

  describe("update", () => {
    it("updates meeting fields for a LEADER and records CELL_MEETING_CHANGED", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.findCell.mockResolvedValue(baseCell());
      mocks.findActiveRoleNames.mockResolvedValue(["LEADER"]);
      const updated = baseCell({ meetingDay: "FRIDAY" });
      mocks.updateCell.mockResolvedValue(updated);

      const patch: CellUpdateInput = { meetingDay: "FRIDAY", meetingTime: "19:00" };
      const result = await commands(transaction).update(leaderPrincipal, "cell-1", patch);

      expect(mocks.updateCell).toHaveBeenCalledWith(
        "cell-1",
        expect.objectContaining({ meetingDay: "FRIDAY", meetingTime: new Date("1970-01-01T19:00:00.000Z") })
      );
      expect(mocks.recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "CELL_MEETING_CHANGED", entityId: "cell-1" })
      );
      expect(result).toEqual(updated);
    });

    it("blocks code and name changes for meeting-level roles", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.findCell.mockResolvedValue(baseCell());
      mocks.findActiveRoleNames.mockResolvedValue(["LEADER"]);

      await expect(
        commands(transaction).update(leaderPrincipal, "cell-1", { code: "CEL-999" })
      ).rejects.toEqual(
        new CellsManagementError("CELL_ACCESS_DENIED", "Only meeting and address can be edited for this role")
      );
      await expect(
        commands(transaction).update(leaderPrincipal, "cell-1", { name: "Outro nome" })
      ).rejects.toEqual(
        new CellsManagementError("CELL_ACCESS_DENIED", "Only meeting and address can be edited for this role")
      );
    });

    it("revalidates active roles so a stale LEADER token is downgraded", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.findCell.mockResolvedValue(baseCell());
      mocks.findActiveRoleNames.mockResolvedValue([]);

      await expect(
        commands(transaction).update(leaderPrincipal, "cell-1", { meetingDay: "FRIDAY" })
      ).rejects.toEqual(new CellsManagementError("CELL_ACCESS_DENIED", "Access is not allowed"));
    });

    it("updates code and name for ADMIN and records CELL_UPDATED", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.findCell.mockResolvedValue(baseCell());
      mocks.findActiveRoleNames.mockResolvedValue(["ADMIN"]);
      mocks.findCellByCode.mockResolvedValue(null);
      mocks.updateCell.mockResolvedValue(baseCell({ name: "Célula Nova" }));

      await commands(transaction).update(manager, "cell-1", { code: "CEL-010", name: "Célula Nova" });

      expect(mocks.recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "CELL_UPDATED" })
      );
    });

    it("detects a code conflict on update", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.findCell.mockResolvedValue(baseCell());
      mocks.findActiveRoleNames.mockResolvedValue(["ADMIN"]);
      mocks.findCellByCode.mockResolvedValue(baseCell({ id: "cell-9", code: "CEL-010" }));

      await expect(
        commands(transaction).update(manager, "cell-1", { code: "CEL-010" })
      ).rejects.toEqual(
        new CellsManagementError("CELL_CODE_CONFLICT", "Cell code is already in use")
      );
    });

    it("treats an unchanged patch as a no-op without audit", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.findCell.mockResolvedValue(baseCell());
      mocks.findActiveRoleNames.mockResolvedValue(["ADMIN"]);

      const result = await commands(transaction).update(manager, "cell-1", {
        meetingDay: "WEDNESDAY",
        meetingTime: "19:30"
      });

      expect(result).toEqual(baseCell());
      expect(mocks.updateCell).not.toHaveBeenCalled();
      expect(mocks.recordAudit).not.toHaveBeenCalled();
    });

    it("records CELL_ADDRESS_CHANGED for a single address patch", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.findCell.mockResolvedValue(baseCell());
      mocks.findActiveRoleNames.mockResolvedValue(["LEADER"]);
      mocks.updateCell.mockResolvedValue(baseCell({ address: "Rua Nova, 1" }));

      await commands(transaction).update(leaderPrincipal, "cell-1", { address: "Rua Nova, 1" });

      expect(mocks.recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "CELL_ADDRESS_CHANGED" })
      );
    });
  });

  describe("updateStatus", () => {
    it("suspends an active cell", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(baseCell());
      mocks.updateCell.mockResolvedValue(baseCell({ status: "SUSPENDED" }));

      await commands(transaction).updateStatus(manager, "cell-1", "SUSPENDED");

      expect(mocks.recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "CELL_SUSPENDED" })
      );
    });

    it("returns early for an identical status", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(baseCell());

      const result = await commands(transaction).updateStatus(manager, "cell-1", "ACTIVE");

      expect(result.status).toBe("ACTIVE");
      expect(mocks.updateCell).not.toHaveBeenCalled();
      expect(mocks.recordAudit).not.toHaveBeenCalled();
    });

    it("rejects activating a cell without a leader", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(baseCell({ status: "FORMING", leader: null }));

      await expect(
        commands(transaction).updateStatus(manager, "cell-1", "ACTIVE")
      ).rejects.toEqual(
        new CellsManagementError("CELL_STATUS_TRANSITION_INVALID", "ACTIVE cells require a leader")
      );
    });

    it("rejects illegal transitions", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(baseCell({ status: "CLOSED" }));

      await expect(
        commands(transaction).updateStatus(manager, "cell-1", "ACTIVE")
      ).rejects.toEqual(
        new CellsManagementError("CELL_STATUS_TRANSITION_INVALID", "Status transition is not allowed")
      );
    });

    it("requires an active ADMIN/PASTOR role", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(false);

      await expect(
        commands(transaction).updateStatus(leaderPrincipal, "cell-1", "SUSPENDED")
      ).rejects.toEqual(new CellsManagementError("CELL_ACCESS_DENIED", "Access is not allowed"));
    });
  });

  describe("updateLeader", () => {
    it("changes the leader and creates a supervisor assignment", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(baseCell({ leader: { id: "old", name: "Antigo" } }));
      mocks.findCandidateUser.mockImplementation(async (id) =>
        id === "leader-3"
          ? { id: "leader-3", name: "Líder Três", hasLeaderRole: true, hasSupervisorRole: false }
          : { id: "supervisor-3", name: "Sup Três", hasLeaderRole: false, hasSupervisorRole: true }
      );
      mocks.findActiveSupervisorAssignment.mockResolvedValue(null);
      mocks.updateCell.mockResolvedValue(baseCell({ leader: { id: "leader-3", name: "Líder Três" } }));

      await commands(transaction).updateLeader(manager, "cell-1", "leader-3", "supervisor-3");

      expect(mocks.createSupervisorAssignment).toHaveBeenCalledWith("supervisor-3", "leader-3");
      const actions = mocks.recordAudit.mock.calls.map((call) => call[0].action);
      expect(actions).toEqual(expect.arrayContaining(["CELL_LEADER_CHANGED", "CELL_SUPERVISION_ASSIGNED"]));
    });

    it("rejects an unknown leader candidate", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(baseCell());
      mocks.findCandidateUser.mockResolvedValue(null);

      await expect(
        commands(transaction).updateLeader(manager, "cell-1", "ghost", "supervisor-1")
      ).rejects.toEqual(
        new CellsManagementError("CELL_LEADERSHIP_CANDIDATE_NOT_FOUND", "Leader candidate not found")
      );
    });

    it("rejects a leader without the LEADER role", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(baseCell());
      mocks.findCandidateUser.mockResolvedValue({
        id: "leader-3",
        name: "Líder Três",
        hasLeaderRole: false,
        hasSupervisorRole: false
      });

      await expect(
        commands(transaction).updateLeader(manager, "cell-1", "leader-3", "supervisor-1")
      ).rejects.toEqual(
        new CellsManagementError("CELL_LEADER_NOT_ELIGIBLE", "Leader candidate does not hold the LEADER role")
      );
    });

    it("rejects leader and supervisor being the same person", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(baseCell());

      await expect(
        commands(transaction).updateLeader(manager, "cell-1", "same-1", "same-1")
      ).rejects.toEqual(
        new CellsManagementError("CELL_SUPERVISOR_CONFLICT", "Leader and supervisor must be different")
      );
    });

    it("returns the cell unchanged when nothing changes", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      const current = baseCell();
      mocks.findCell.mockResolvedValue(current);
      mocks.findCandidateUser.mockImplementation(async (id) =>
        id === "leader-1"
          ? { id: "leader-1", name: "Líder", hasLeaderRole: true, hasSupervisorRole: false }
          : { id: "supervisor-1", name: "Supervisor", hasLeaderRole: false, hasSupervisorRole: true }
      );

      const result = await commands(transaction).updateLeader(manager, "cell-1", "leader-1", "supervisor-1");

      expect(result).toEqual(current);
      expect(mocks.updateCell).not.toHaveBeenCalled();
      expect(mocks.recordAudit).not.toHaveBeenCalled();
    });
  });

  describe("updateTraineeLeader", () => {
    it("assigns a trainee leader", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(baseCell({ traineeLeader: null }));
      mocks.findCandidateUser.mockResolvedValue({
        id: "trainee-1",
        name: "Treinando",
        hasLeaderRole: false,
        hasSupervisorRole: false
      });
      mocks.updateCell.mockResolvedValue(baseCell({ traineeLeader: { id: "trainee-1", name: "Treinando" } }));

      await commands(transaction).updateTraineeLeader(manager, "cell-1", "trainee-1");

      expect(mocks.recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "CELL_TRAINEE_LEADER_CHANGED" })
      );
    });

    it("removes a trainee leader", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(
        baseCell({ traineeLeader: { id: "trainee-1", name: "Treinando" } })
      );
      mocks.updateCell.mockResolvedValue(baseCell({ traineeLeader: null }));

      await commands(transaction).updateTraineeLeader(manager, "cell-1", null);

      expect(mocks.updateCell).toHaveBeenCalledWith("cell-1", { traineeLeaderId: null });
      expect(mocks.recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "CELL_TRAINEE_LEADER_CHANGED" })
      );
    });

    it("rejects an unknown trainee candidate", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(baseCell({ traineeLeader: null }));
      mocks.findCandidateUser.mockResolvedValue(null);

      await expect(
        commands(transaction).updateTraineeLeader(manager, "cell-1", "ghost")
      ).rejects.toEqual(
        new CellsManagementError("CELL_LEADERSHIP_CANDIDATE_NOT_FOUND", "Trainee candidate not found")
      );
    });

    it("rejects a trainee that equals the current leader", async () => {
      const { transaction, mocks } = transactionMocks();
      mocks.hasActiveRole.mockResolvedValue(true);
      mocks.findCell.mockResolvedValue(baseCell({ traineeLeader: null }));
      mocks.findCandidateUser.mockResolvedValue({
        id: "leader-1",
        name: "Líder",
        hasLeaderRole: true,
        hasSupervisorRole: false
      });

      await expect(
        commands(transaction).updateTraineeLeader(manager, "cell-1", "leader-1")
      ).rejects.toEqual(
        new CellsManagementError("CELL_LEADERSHIP_CONFLICT", "Leader and trainee leader must be different")
      );
    });
  });
});
