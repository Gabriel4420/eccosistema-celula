import { createRuntimeClient } from "@mission-atos/database";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { hash } from "argon2";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("cell management HTTP flow", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const churchId = randomUUID();
  const otherChurchId = randomUUID();
  const adminId = randomUUID();
  const leaderOneId = randomUUID();
  const leaderTwoId = randomUUID();
  const supervisorOneId = randomUUID();
  const supervisorTwoId = randomUUID();
  const traineeId = randomUUID();
  const foreignCellId = randomUUID();
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  const password = "cells-e2e-password-123";
  let app: INestApplication;
  let authorization: string;
  let leaderOneAuthorization: string;
  let supervisorOneAuthorization: string;
  let traineeAuthorization: string;

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: "test",
      DATABASE_URL: databaseUrl,
      AUTH_CHURCH_ID: churchId,
      JWT_ACCESS_SECRET: "cells-e2e-jwt-secret-at-least-32-characters",
      REFRESH_TOKEN_PEPPER: "cells-e2e-refresh-pepper-is-distinct-and-long",
      AUTH_COOKIE_SECURE: "false",
      CORS_ORIGINS: "http://localhost:3000",
    });
    await database.church.createMany({
      data: [
        { id: churchId, name: "Cells E2E", slug: `cells-${churchId}` },
        { id: otherChurchId, name: "Cells Foreign E2E", slug: `cells-f-${otherChurchId}` },
      ],
    });
    await database.user.createMany({
      data: [
        { id: adminId, churchId, firstName: "Admin", lastName: "Cells", email: `${adminId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
        { id: leaderOneId, churchId, firstName: "Leader", lastName: "One", email: `${leaderOneId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
        { id: leaderTwoId, churchId, firstName: "Leader", lastName: "Two", email: `${leaderTwoId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
        { id: supervisorOneId, churchId, firstName: "Supervisor", lastName: "One", email: `${supervisorOneId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
        { id: supervisorTwoId, churchId, firstName: "Supervisor", lastName: "Two", email: `${supervisorTwoId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
        { id: traineeId, churchId, firstName: "Trainee", lastName: "Cells", email: `${traineeId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
      ],
    });
    const adminRole = await database.role.create({ data: { churchId, name: "ADMIN" } });
    const leaderRole = await database.role.create({ data: { churchId, name: "LEADER" } });
    const supervisorRole = await database.role.create({ data: { churchId, name: "SUPERVISOR" } });
    await database.userRole.createMany({
      data: [
        { churchId, userId: adminId, roleId: adminRole.id },
        { churchId, userId: leaderOneId, roleId: leaderRole.id },
        { churchId, userId: leaderTwoId, roleId: leaderRole.id },
        { churchId, userId: supervisorOneId, roleId: supervisorRole.id },
        { churchId, userId: supervisorTwoId, roleId: supervisorRole.id },
      ],
    });
    await database.cell.create({
      data: {
        id: foreignCellId,
        churchId: otherChurchId,
        code: "FOR-001",
        name: "Célula Estrangeira",
        status: "FORMING",
        meetingDay: "SUNDAY",
        meetingTime: new Date("1970-01-01T10:00:00.000Z"),
        address: "Fora da igreja",
      },
    });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
    authorization = await login(adminId);
    leaderOneAuthorization = await login(leaderOneId);
    supervisorOneAuthorization = await login(supervisorOneId);
    traineeAuthorization = await login(traineeId);
  });

  async function login(userId: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: `${userId}@example.test`, password })
      .expect(200);
    return `Bearer ${response.body.data.accessToken}`;
  }

  afterAll(async () => {
    await app.close();
    await database.$executeRawUnsafe(
      'DELETE FROM "sessions" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId,
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "idempotency_requests" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId,
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "audit_logs" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId,
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "supervisor_assignments" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId,
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "cells" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId,
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "user_roles" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId,
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "roles" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId,
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "users" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId,
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "churches" WHERE "id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId,
    );
    await database.$disconnect();
  });

  it("rejects unauthenticated and roleless access", async () => {
    await request(app.getHttpServer()).get("/cells").expect(401);
    await request(app.getHttpServer()).get("/cells").set("Authorization", traineeAuthorization).expect(403);
    await request(app.getHttpServer())
      .get("/cells")
      .set("Authorization", traineeAuthorization)
      .expect(403);
  });

  it("creates a cell idempotently and never leaks tenant internals", async () => {
    const idempotencyKey = randomUUID();
    const body = {
      code: "  cel-101  ",
      name: "  Célula Idempotente  ",
      status: "FORMING",
      meetingDay: "MONDAY",
      meetingTime: "19:30",
      address: " Rua Central, 10 ",
    };
    const create = () =>
      request(app.getHttpServer())
        .post("/cells")
        .set("Authorization", authorization)
        .set("Idempotency-Key", idempotencyKey)
        .send(body);

    const first = await create().expect(201);
    expect(first.body.data.code).toBe("CEL-101");
    expect(first.body.data.name).toBe("Célula Idempotente");
    expect(first.body.data.address).toBe("Rua Central, 10");
    expect(first.body.data.meetingTime).toBe("19:30");
    expect(first.body.data.status).toBe("FORMING");
    expect(JSON.stringify(first.body)).not.toMatch(/churchId|deletedAt/i);

    const replay = await create().expect(201);
    expect(replay.body.data.id).toBe(first.body.data.id);
    await expect(database.cell.count({ where: { churchId, code: "CEL-101" } })).resolves.toBe(1);
  });

  it("rejects missing keys, reused keys and duplicate codes", async () => {
    const base = {
      code: "CEL-102",
      name: "Célula Conflito",
      meetingDay: "TUESDAY",
      meetingTime: "20:00",
      address: "Rua B, 20",
    };
    await request(app.getHttpServer())
      .post("/cells")
      .set("Authorization", authorization)
      .send(base)
      .expect(400);

    const idempotencyKey = randomUUID();
    await request(app.getHttpServer())
      .post("/cells")
      .set("Authorization", authorization)
      .set("Idempotency-Key", idempotencyKey)
      .send(base)
      .expect(201);
    await request(app.getHttpServer())
      .post("/cells")
      .set("Authorization", authorization)
      .set("Idempotency-Key", idempotencyKey)
      .send({ ...base, name: "Outro Nome" })
      .expect(409);
    await request(app.getHttpServer())
      .post("/cells")
      .set("Authorization", authorization)
      .set("Idempotency-Key", randomUUID())
      .send(base)
      .expect(409);
  });

  it("applies the leadership eligibility rules on creation", async () => {
    const missingLeader = {
      code: "CEL-103",
      name: "Sem Líder",
      status: "ACTIVE",
      meetingDay: "WEDNESDAY",
      meetingTime: "19:00",
      address: "Rua C, 30",
    };
    await request(app.getHttpServer())
      .post("/cells")
      .set("Authorization", authorization)
      .set("Idempotency-Key", randomUUID())
      .send(missingLeader)
      .expect(400);

    await request(app.getHttpServer())
      .post("/cells")
      .set("Authorization", authorization)
      .set("Idempotency-Key", randomUUID())
      .send({
        ...missingLeader,
        code: "CEL-104",
        leaderId: traineeId,
        supervisorId: supervisorOneId,
      })
      .expect(409);

    await request(app.getHttpServer())
      .post("/cells")
      .set("Authorization", authorization)
      .set("Idempotency-Key", randomUUID())
      .send({
        ...missingLeader,
        code: "CEL-105",
        leaderId: leaderOneId,
        supervisorId: traineeId,
      })
      .expect(409);

    const withTrainee = await request(app.getHttpServer())
      .post("/cells")
      .set("Authorization", authorization)
      .set("Idempotency-Key", randomUUID())
      .send({
        code: "CEL-106",
        name: "Com Treinando",
        status: "ACTIVE",
        leaderId: leaderTwoId,
        supervisorId: supervisorOneId,
        traineeLeaderId: traineeId,
        meetingDay: "THURSDAY",
        meetingTime: "19:00",
        address: "Rua D, 40",
      })
      .expect(201);
    expect(withTrainee.body.data.traineeLeader.id).toBe(traineeId);
  });

  it("scopes listing and viewing to the actor hierarchy", async () => {
    const createCell = (code: string, name: string, leaderId: string | null, supervisorId: string | null) =>
      request(app.getHttpServer())
        .post("/cells")
        .set("Authorization", authorization)
        .set("Idempotency-Key", randomUUID())
        .send({
          code,
          name,
          status: leaderId ? "ACTIVE" : "FORMING",
          leaderId,
          ...(supervisorId ? { supervisorId } : {}),
          meetingDay: "FRIDAY",
          meetingTime: "19:00",
          address: "Endereço Fixo",
        });

    const forming = await createCell("CEL-201", "Formando", null, null).expect(201);
    const supervised = await createCell("CEL-202", "Supervisionada", leaderTwoId, supervisorOneId).expect(201);
    const own = await createCell("CEL-203", "Própria do Líder", leaderOneId, supervisorTwoId).expect(201);

    const supervisorList = await request(app.getHttpServer())
      .get("/cells")
      .set("Authorization", supervisorOneAuthorization)
      .expect(200);
    const supervisorIds = supervisorList.body.data.map((cell: { id: string }) => cell.id);
    expect(supervisorIds).toContain(supervised.body.data.id);
    expect(supervisorIds).not.toContain(forming.body.data.id);
    expect(supervisorIds).not.toContain(own.body.data.id);

    const leaderList = await request(app.getHttpServer())
      .get("/cells")
      .set("Authorization", leaderOneAuthorization)
      .expect(200);
    const leaderIds = leaderList.body.data.map((cell: { id: string }) => cell.id);
    expect(leaderIds).toEqual([own.body.data.id]);

    await request(app.getHttpServer())
      .get(`/cells/${supervised.body.data.id}`)
      .set("Authorization", leaderOneAuthorization)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/cells/${own.body.data.id}`)
      .set("Authorization", leaderOneAuthorization)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/cells/${foreignCellId}`)
      .set("Authorization", authorization)
      .expect(404);
  });

  it("allows meeting-level edits only within the actor scope", async () => {
    const createCell = (code: string, leaderId: string, supervisorId: string) =>
      request(app.getHttpServer())
        .post("/cells")
        .set("Authorization", authorization)
        .set("Idempotency-Key", randomUUID())
        .send({
          code,
          name: `Célula ${code}`,
          status: "ACTIVE",
          leaderId,
          supervisorId,
          meetingDay: "MONDAY",
          meetingTime: "19:00",
          address: "Endereço Original",
        });

    const supervised = await createCell("CEL-301", leaderTwoId, supervisorOneId).expect(201);
    const own = await createCell("CEL-302", leaderOneId, supervisorTwoId).expect(201);

    const leaderMeeting = await request(app.getHttpServer())
      .patch(`/cells/${own.body.data.id}`)
      .set("Authorization", leaderOneAuthorization)
      .send({ meetingDay: "SATURDAY", meetingTime: "18:00" })
      .expect(200);
    expect(leaderMeeting.body.data.meetingDay).toBe("SATURDAY");
    expect(leaderMeeting.body.data.meetingTime).toBe("18:00");

    await request(app.getHttpServer())
      .patch(`/cells/${own.body.data.id}`)
      .set("Authorization", leaderOneAuthorization)
      .send({ code: "CEL-999" })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/cells/${own.body.data.id}`)
      .set("Authorization", leaderOneAuthorization)
      .send({ name: "Invadir Nome" })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/cells/${supervised.body.data.id}`)
      .set("Authorization", leaderOneAuthorization)
      .send({ address: "Invasão" })
      .expect(403);

    const supervisorMeeting = await request(app.getHttpServer())
      .patch(`/cells/${supervised.body.data.id}`)
      .set("Authorization", supervisorOneAuthorization)
      .send({ address: "Endereço do Supervisor" })
      .expect(200);
    expect(supervisorMeeting.body.data.address).toBe("Endereço do Supervisor");

    await request(app.getHttpServer())
      .patch(`/cells/${supervised.body.data.id}`)
      .set("Authorization", supervisorOneAuthorization)
      .send({ name: "Fora do Escopo" })
      .expect(403);

    const adminRename = await request(app.getHttpServer())
      .patch(`/cells/${own.body.data.id}`)
      .set("Authorization", authorization)
      .send({ name: "Renomeada pelo Admin", code: "CEL-303" })
      .expect(200);
    expect(adminRename.body.data.name).toBe("Renomeada pelo Admin");
    expect(adminRename.body.data.code).toBe("CEL-303");
  });

  it("restricts status, leader and trainee mutations to administrators", async () => {
    const created = await request(app.getHttpServer())
      .post("/cells")
      .set("Authorization", authorization)
      .set("Idempotency-Key", randomUUID())
      .send({
        code: "CEL-401",
        name: "Célula Mutável",
        status: "ACTIVE",
        leaderId: leaderOneId,
        supervisorId: supervisorTwoId,
        meetingDay: "TUESDAY",
        meetingTime: "19:30",
        address: "Rua Mutável",
      })
      .expect(201);
    const cellId: string = created.body.data.id;

    await request(app.getHttpServer())
      .patch(`/cells/${cellId}/status`)
      .set("Authorization", leaderOneAuthorization)
      .send({ status: "SUSPENDED" })
      .expect(403);

    const suspended = await request(app.getHttpServer())
      .patch(`/cells/${cellId}/status`)
      .set("Authorization", authorization)
      .send({ status: "SUSPENDED" })
      .expect(200);
    expect(suspended.body.data.status).toBe("SUSPENDED");

    const reactivated = await request(app.getHttpServer())
      .patch(`/cells/${cellId}/status`)
      .set("Authorization", authorization)
      .send({ status: "ACTIVE" })
      .expect(200);
    expect(reactivated.body.data.status).toBe("ACTIVE");

    await request(app.getHttpServer())
      .patch(`/cells/${cellId}/status`)
      .set("Authorization", authorization)
      .send({ status: "ACTIVE" })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/cells/${cellId}/leader`)
      .set("Authorization", leaderOneAuthorization)
      .send({ leaderId: leaderTwoId, supervisorId: supervisorOneId })
      .expect(403);

    const changedLeader = await request(app.getHttpServer())
      .patch(`/cells/${cellId}/leader`)
      .set("Authorization", authorization)
      .send({ leaderId: leaderTwoId, supervisorId: supervisorOneId })
      .expect(200);
    expect(changedLeader.body.data.leader.id).toBe(leaderTwoId);
    expect(changedLeader.body.data.supervisor.id).toBe(supervisorOneId);

    await request(app.getHttpServer())
      .patch(`/cells/${cellId}/trainee-leader`)
      .set("Authorization", leaderOneAuthorization)
      .send({ traineeLeaderId: traineeId })
      .expect(403);

    const withTrainee = await request(app.getHttpServer())
      .patch(`/cells/${cellId}/trainee-leader`)
      .set("Authorization", authorization)
      .send({ traineeLeaderId: traineeId })
      .expect(200);
    expect(withTrainee.body.data.traineeLeader.id).toBe(traineeId);

    const removed = await request(app.getHttpServer())
      .patch(`/cells/${cellId}/trainee-leader`)
      .set("Authorization", authorization)
      .send({ traineeLeaderId: null })
      .expect(200);
    expect(removed.body.data.traineeLeader).toBeNull();
  });

  it("writes an audit trail for every mutation", async () => {
    const created = await request(app.getHttpServer())
      .post("/cells")
      .set("Authorization", authorization)
      .set("Idempotency-Key", randomUUID())
      .send({
        code: "CEL-501",
        name: "Célula Auditada",
        status: "ACTIVE",
        leaderId: leaderOneId,
        supervisorId: supervisorTwoId,
        meetingDay: "WEDNESDAY",
        meetingTime: "20:00",
        address: "Rua Auditada",
      })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/cells/${created.body.data.id}`)
      .set("Authorization", leaderOneAuthorization)
      .send({ address: "Endereço Auditado" })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/cells/${created.body.data.id}`)
      .set("Authorization", authorization)
      .send({ name: "Renomeada Auditada" })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/cells/${created.body.data.id}/status`)
      .set("Authorization", authorization)
      .send({ status: "SUSPENDED" })
      .expect(200);

    const actions = await database.auditLog.findMany({
      where: { churchId, entityId: created.body.data.id },
      select: { action: true },
    });
    expect(actions.map(({ action }) => action)).toEqual(
      expect.arrayContaining([
        "CELL_CREATED",
        "CELL_ADDRESS_CHANGED",
        "CELL_UPDATED",
        "CELL_SUSPENDED",
      ]),
    );
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
