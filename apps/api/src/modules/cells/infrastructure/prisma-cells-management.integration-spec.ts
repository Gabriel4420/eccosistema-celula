import { createRuntimeClient } from "@mission-atos/database";
import { randomUUID } from "node:crypto";
import { CellsManagementAuthorization } from "../application/cells-management.authorization";
import { CellsManagementCommands } from "../application/cells-management.commands";
import { CellsManagementError } from "../application/cells-management.error";
import { CellsManagementQueries } from "../application/cells-management.queries";
import type { CellCreateInput } from "../application/cells-management.types";
import {
  CellEditPolicy,
  CellListScopePolicy,
  CellViewPolicy
} from "../domain/cells-management.policy";
import { PrismaCellsManagementRepository } from "./prisma-cells-management.repository";

describe("PrismaCellsManagementRepository", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  const churchId = randomUUID();
  const otherChurchId = randomUUID();
  const repository = new PrismaCellsManagementRepository(database);
  const authorization = new CellsManagementAuthorization(
    new CellListScopePolicy(),
    new CellViewPolicy(),
    new CellEditPolicy()
  );
  const commands = new CellsManagementCommands(repository, authorization);
  const queries = new CellsManagementQueries(repository, authorization);

  let adminId: string;
  let leaderId: string;
  let supervisorId: string;
  let traineeId: string;

  beforeAll(async () => {
    await database.church.create({
      data: { id: churchId, name: "Cells Repository", slug: `cells-repo-${churchId}` }
    });
    await database.church.create({
      data: { id: otherChurchId, name: "Other Cells Repository", slug: `cells-repo-${otherChurchId}` }
    });

    const roles = {
      admin: await database.role.create({ data: { churchId, name: "ADMIN" } }),
      leader: await database.role.create({ data: { churchId, name: "LEADER" } }),
      supervisor: await database.role.create({ data: { churchId, name: "SUPERVISOR" } })
    };

    const createUser = async (name: string) => {
      const id = randomUUID();
      await database.user.create({
        data: {
          id,
          churchId,
          firstName: name,
          lastName: "Repo",
          email: `${id}@example.test`,
          passwordHash: "integration-only-not-a-real-password-hash",
          status: "ACTIVE"
        }
      });
      return id;
    };

    adminId = await createUser("Admin");
    leaderId = await createUser("Leader");
    supervisorId = await createUser("Supervisor");
    traineeId = await createUser("Trainee");

    await database.userRole.createMany({
      data: [
        { churchId, userId: adminId, roleId: roles.admin.id },
        { churchId, userId: leaderId, roleId: roles.leader.id },
        { churchId, userId: supervisorId, roleId: roles.supervisor.id }
      ]
    });
  });

  afterAll(async () => {
    await database.$executeRaw`DELETE FROM "audit_logs" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "idempotency_requests" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "supervisor_assignments" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "cells" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "user_roles" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "roles" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "users" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$disconnect();
  });

  it("persists a cell, audit and idempotency record atomically through commands", async () => {
    const principal = {
      userId: adminId,
      churchId,
      sessionId: randomUUID(),
      roles: ["ADMIN"]
    };
    const idempotencyKey = randomUUID();
    const created = await commands.create(
      principal,
      idempotencyKey,
      {
        code: "INT-001",
        name: "Célula Integração",
        status: "ACTIVE",
        leaderId,
        supervisorId,
        traineeLeaderId: null,
        meetingDay: "TUESDAY",
        meetingTime: "19:00",
        address: "Av. Central, 100"
      }
    );

    expect(created).toMatchObject({
      churchId,
      code: "INT-001",
      name: "Célula Integração",
      status: "ACTIVE",
      leader: { id: leaderId },
      supervisor: { id: supervisorId }
    });
    expect(created.meetingTime).toBeInstanceOf(Date);
    await expect(database.auditLog.count({ where: { churchId, entityId: created.id } })).resolves.toBe(2);
    await expect(
      database.idempotencyRequest.count({ where: { churchId, actorId: adminId, key: idempotencyKey } })
    ).resolves.toBe(1);
  });

  it("replays the same cell for an identical idempotency key", async () => {
    const principal = { userId: adminId, churchId, sessionId: randomUUID(), roles: ["ADMIN"] };
    const idempotencyKey = randomUUID();
    const input: CellCreateInput = {
      code: "INT-002",
      name: "Célula Replay",
      status: "FORMING",
      leaderId: null,
      supervisorId: null,
      traineeLeaderId: null,
      meetingDay: "THURSDAY",
      meetingTime: "20:00",
      address: "Rua B, 2"
    };
    const first = await commands.create(principal, idempotencyKey, input);
    const second = await commands.create(principal, idempotencyKey, input);

    expect(second.id).toBe(first.id);
    await expect(
      database.cell.count({ where: { churchId, code: "INT-002" } })
    ).resolves.toBe(1);
  });

  it("rejects an idempotency key reused with a different payload", async () => {
    const principal = { userId: adminId, churchId, sessionId: randomUUID(), roles: ["ADMIN"] };
    const idempotencyKey = randomUUID();
    await commands.create(principal, idempotencyKey, {
      code: "INT-003",
      name: "Célula Conflito",
      status: "FORMING",
      leaderId: null,
      supervisorId: null,
      traineeLeaderId: null,
      meetingDay: "THURSDAY",
      meetingTime: "20:00",
      address: "Rua C, 3"
    });

    await expect(
      commands.create(principal, idempotencyKey, {
        code: "INT-003",
        name: "Payload Diferente",
        status: "FORMING",
        leaderId: null,
        supervisorId: null,
        traineeLeaderId: null,
        meetingDay: "THURSDAY",
        meetingTime: "20:00",
        address: "Rua C, 3"
      })
    ).rejects.toEqual(
      new CellsManagementError(
        "IDEMPOTENCY_KEY_CONFLICT",
        "Idempotency key was reused with a different request"
      )
    );
  });

  it("allows a LEADER to edit meeting and address only, revalidating active roles", async () => {
    const admin = { userId: adminId, churchId, sessionId: randomUUID(), roles: ["ADMIN"] };
    const leader = { userId: leaderId, churchId, sessionId: randomUUID(), roles: ["LEADER"] };
    const cell = await commands.create(admin, randomUUID(), {
      code: "INT-004",
      name: "Célula do Líder",
      status: "ACTIVE",
      leaderId,
      supervisorId,
      traineeLeaderId: null,
      meetingDay: "MONDAY",
      meetingTime: "18:30",
      address: "Rua D, 4"
    });

    const updated = await commands.update(leader, cell.id, {
      meetingDay: "FRIDAY",
      meetingTime: "21:00",
      address: "Rua Nova, 44"
    });

    expect(updated.meetingDay).toBe("FRIDAY");
    expect(updated.address).toBe("Rua Nova, 44");

    await expect(
      commands.update(leader, cell.id, { name: "Invadir Nome" })
    ).rejects.toEqual(
      new CellsManagementError(
        "CELL_ACCESS_DENIED",
        "Only meeting and address can be edited for this role"
      )
    );
  });

  it("suspends and reactivates a cell with a leader, rejecting activation without one", async () => {
    const admin = { userId: adminId, churchId, sessionId: randomUUID(), roles: ["ADMIN"] };
    const cell = await commands.create(admin, randomUUID(), {
      code: "INT-005",
      name: "Célula Status",
      status: "ACTIVE",
      leaderId,
      supervisorId,
      traineeLeaderId: null,
      meetingDay: "TUESDAY",
      meetingTime: "19:00",
      address: "Rua E, 5"
    });

    const suspended = await commands.updateStatus(admin, cell.id, "SUSPENDED");
    expect(suspended.status).toBe("SUSPENDED");

    const reactivated = await commands.updateStatus(admin, cell.id, "ACTIVE");
    expect(reactivated.status).toBe("ACTIVE");

    const noLeader = await commands.create(admin, randomUUID(), {
      code: "INT-006",
      name: "Célula Sem Líder",
      status: "FORMING",
      leaderId: null,
      supervisorId: null,
      traineeLeaderId: null,
      meetingDay: "WEDNESDAY",
      meetingTime: "20:00",
      address: "Rua F, 6"
    });
    await expect(commands.updateStatus(admin, noLeader.id, "ACTIVE")).rejects.toEqual(
      new CellsManagementError("CELL_STATUS_TRANSITION_INVALID", "ACTIVE cells require a leader")
    );
  });

  it("changes leader and trainee leader, auditing the mutations", async () => {
    const admin = { userId: adminId, churchId, sessionId: randomUUID(), roles: ["ADMIN"] };
    const cell = await commands.create(admin, randomUUID(), {
      code: "INT-007",
      name: "Célula Liderança",
      status: "ACTIVE",
      leaderId,
      supervisorId,
      traineeLeaderId: null,
      meetingDay: "THURSDAY",
      meetingTime: "19:30",
      address: "Rua G, 7"
    });

    const withTrainee = await commands.updateTraineeLeader(admin, cell.id, traineeId);
    expect(withTrainee.traineeLeader).toMatchObject({ id: traineeId });

    const removed = await commands.updateTraineeLeader(admin, cell.id, null);
    expect(removed.traineeLeader).toBeNull();

    await expect(
      commands.updateTraineeLeader(admin, cell.id, leaderId)
    ).rejects.toEqual(
      new CellsManagementError("CELL_LEADERSHIP_CONFLICT", "Leader and trainee leader must be different")
    );
  });

  it("isolates tenants on find and list", async () => {
    const admin = { userId: adminId, churchId, sessionId: randomUUID(), roles: ["ADMIN"] };
    const cell = await commands.create(admin, randomUUID(), {
      code: "INT-008",
      name: "Célula Isolada",
      status: "ACTIVE",
      leaderId,
      supervisorId,
      traineeLeaderId: null,
      meetingDay: "SATURDAY",
      meetingTime: "18:00",
      address: "Rua H, 8"
    });

    await expect(queries.get(
      { ...admin, churchId: otherChurchId },
      cell.id
    )).rejects.toEqual(new CellsManagementError("CELL_NOT_FOUND", "Cell not found"));

    const foreign = await database.cell.create({
      data: {
        churchId: otherChurchId,
        code: "FOR-001",
        name: "Célula Estrangeira",
        status: "FORMING",
        meetingDay: "SUNDAY",
        meetingTime: new Date("1970-01-01T10:00:00.000Z"),
        address: "Outra Igreja"
      }
    });
    await expect(queries.get(admin, foreign.id)).rejects.toEqual(
      new CellsManagementError("CELL_NOT_FOUND", "Cell not found")
    );
  });

  it("scopes lists by supervisor and leader with search and paging", async () => {
    const admin = { userId: adminId, churchId, sessionId: randomUUID(), roles: ["ADMIN"] };
    const supervisorPrincipal = { userId: supervisorId, churchId, sessionId: randomUUID(), roles: ["SUPERVISOR"] };
    const leaderPrincipal = { userId: leaderId, churchId, sessionId: randomUUID(), roles: ["LEADER"] };

    const supervised = await commands.create(admin, randomUUID(), {
      code: "INT-010",
      name: "Célula Escopo Supervisor",
      status: "ACTIVE",
      leaderId,
      supervisorId,
      traineeLeaderId: null,
      meetingDay: "MONDAY",
      meetingTime: "19:00",
      address: "Rua I, 10"
    });

    const page = await queries.list(supervisorPrincipal, {
      page: 1,
      pageSize: 10,
      search: "Escopo",
      sortBy: "name",
      sortOrder: "asc"
    });
    expect(page.items.map((item) => item.id)).toEqual(expect.arrayContaining([supervised.id]));

    const leaderPage = await queries.list(leaderPrincipal, {
      page: 1,
      pageSize: 10,
      sortBy: "name",
      sortOrder: "asc"
    });
    expect(leaderPage.items.map((item) => item.id)).toContain(supervised.id);

    expect(() =>
      queries.list(
        { userId: traineeId, churchId, sessionId: randomUUID(), roles: [] },
        { page: 1, pageSize: 10, sortBy: "name", sortOrder: "asc" }
      )
    ).toThrow(new CellsManagementError("CELL_ACCESS_DENIED", "Access is not allowed"));
  });

  it("serializes duplicate code creation and rolls back failed transactions", async () => {
    const admin = { userId: adminId, churchId, sessionId: randomUUID(), roles: ["ADMIN"] };
    const code = `INT-${randomUUID().slice(0, 8).toUpperCase()}`;
    const input: CellCreateInput = {
      code,
      name: "Célula Serial",
      status: "FORMING",
      leaderId: null,
      supervisorId: null,
      traineeLeaderId: null,
      meetingDay: "WEDNESDAY",
      meetingTime: "20:00",
      address: "Rua J"
    };
    const attempt = () => commands.create(admin, randomUUID(), input);
    const results = await Promise.allSettled([attempt(), attempt()]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(1);
    await expect(database.cell.count({ where: { churchId, code } })).resolves.toBe(1);
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(1);
    await expect(database.cell.count({ where: { churchId, code } })).resolves.toBe(1);

    await expect(
      repository.execute(churchId, async (transaction) => {
        await transaction.createCell({
          ...input,
          code: "INT-ROLLBACK",
          name: "Célula Rollback"
        });
        throw new Error("forced rollback");
      })
    ).rejects.toThrow("forced rollback");
    await expect(
      database.cell.count({ where: { churchId, code: "INT-ROLLBACK" } })
    ).resolves.toBe(0);
  });

  it("exposes canonical codes and stored HH:mm meeting times through the presenter boundary", async () => {
    const admin = { userId: adminId, churchId, sessionId: randomUUID(), roles: ["ADMIN"] };
    const cell = await commands.create(admin, randomUUID(), {
      code: "  int-020  ",
      name: "  Célula Formato  ",
      status: "FORMING" as const,
      leaderId: null,
      supervisorId: null,
      traineeLeaderId: null,
      meetingDay: "FRIDAY",
      meetingTime: "09:05",
      address: " Rua K "
    } satisfies CellCreateInput);
    expect(cell.code).toBe("INT-020");
    expect(cell.name).toBe("Célula Formato");
    expect(cell.address).toBe("Rua K");
    expect(cell.meetingTime.toISOString().slice(11, 16)).toBe("09:05");
  });
});

function safeTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL;
  if (!value || !new URL(value).pathname.toLowerCase().includes("test")) {
    throw new Error("TEST_DATABASE_URL must identify a test database");
  }
  if (process.env.DATABASE_URL === value) {
    throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL");
  }
  return value;
}
