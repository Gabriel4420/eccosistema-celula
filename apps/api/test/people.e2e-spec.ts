import { createRuntimeClient } from "@mission-atos/database";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { hash } from "argon2";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import request from "supertest";
import type { Test as SupertestTest } from "supertest";
import { AppModule } from "../src/app.module";

describe("people HTTP flow", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const churchId = randomUUID();
  const adminId = randomUUID();
  const leaderId = randomUUID();
  const pastorId = randomUUID();
  const supervisorId = randomUUID();
  const otherChurchId = randomUUID();
  const adminRoleId = randomUUID();
  const leaderRoleId = randomUUID();
  const pastorRoleId = randomUUID();
  const supervisorRoleId = randomUUID();
  const password = "people-e2e-password-123";
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  let app: INestApplication;
  let adminAuthorization: string;
  let leaderAuthorization: string;
  let pastorAuthorization: string;
  let supervisorAuthorization: string;
  let foreignPersonId: string;

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: "test", DATABASE_URL: databaseUrl, AUTH_CHURCH_ID: churchId,
      JWT_ACCESS_SECRET: "people-e2e-jwt-secret-at-least-32-characters",
      REFRESH_TOKEN_PEPPER: "people-e2e-refresh-pepper-is-distinct-and-long",
      AUTH_COOKIE_SECURE: "false", CORS_ORIGINS: "http://localhost:3000"
    });
    await database.church.create({ data: { id: churchId, name: "People E2E", slug: `people-${churchId}` } });
    await database.church.create({ data: { id: otherChurchId, name: "Other People E2E", slug: `people-${otherChurchId}` } });
    foreignPersonId = (await database.person.create({ data: { churchId: otherChurchId, fullName: "Foreign Person" } })).id;
    await database.user.createMany({ data: [
      { id: adminId, churchId, firstName: "People", lastName: "Admin", email: `${adminId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
      { id: leaderId, churchId, firstName: "People", lastName: "Leader", email: `${leaderId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
      { id: pastorId, churchId, firstName: "People", lastName: "Pastor", email: `${pastorId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
      { id: supervisorId, churchId, firstName: "People", lastName: "Supervisor", email: `${supervisorId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" }
    ] });
    await database.role.createMany({ data: [
      { id: adminRoleId, churchId, name: "ADMIN" }, { id: leaderRoleId, churchId, name: "LEADER" },
      { id: pastorRoleId, churchId, name: "PASTOR" }, { id: supervisorRoleId, churchId, name: "SUPERVISOR" }
    ] });
    await database.userRole.createMany({ data: [
      { churchId, userId: adminId, roleId: adminRoleId }, { churchId, userId: leaderId, roleId: leaderRoleId },
      { churchId, userId: pastorId, roleId: pastorRoleId }, { churchId, userId: supervisorId, roleId: supervisorRoleId }
    ] });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication(); app.use(cookieParser()); await app.init();
    adminAuthorization = await login(adminId); leaderAuthorization = await login(leaderId);
    pastorAuthorization = await login(pastorId); supervisorAuthorization = await login(supervisorId);
  });

  afterAll(async () => {
    if (app) await app.close();
    for (const table of ["sessions", "audit_logs", "people", "user_roles", "roles", "users"]) {
      await database.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "church_id" = $1::uuid`, churchId);
    }
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${churchId}::uuid`;
    await database.$executeRaw`DELETE FROM "people" WHERE "church_id" = ${otherChurchId}::uuid`;
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${otherChurchId}::uuid`;
    await database.$disconnect();
  });

  it("creates, lists and hides observations from leaders", async () => {
    await request(app.getHttpServer()).get("/people").expect(401);
    const created = await request(app.getHttpServer()).post("/people").set("Authorization", adminAuthorization)
      .send({ fullName: "  Maria   E2E ", email: "MARIA@EXAMPLE.TEST", observations: "restrita" }).expect(201);
    expect(created.body.data).toMatchObject({ fullName: "Maria E2E", email: "maria@example.test", observations: "restrita" });
    const listed = await request(app.getHttpServer()).get("/people").set("Authorization", leaderAuthorization).expect(200);
    expect(listed.body.data[0]).not.toHaveProperty("observations");
    expect(JSON.stringify(listed.body)).not.toMatch(/churchId|deletedAt/);
    await request(app.getHttpServer()).post("/people").set("Authorization", leaderAuthorization).send({ fullName: "Negada" }).expect(403);
  });

  it("rejects duplicates and restricts inactive people to admins", async () => {
    await request(app.getHttpServer()).post("/people").set("Authorization", adminAuthorization)
      .send({ fullName: "Outra", email: "maria@example.test" }).expect(409);
    const person = await database.person.findFirstOrThrow({ where: { churchId } });
    await request(app.getHttpServer()).patch(`/people/${person.id}/status`).set("Authorization", adminAuthorization).send({ status: "INACTIVE" }).expect(200);
    await request(app.getHttpServer()).get("/people?status=INACTIVE").set("Authorization", leaderAuthorization).expect(403);
    await request(app.getHttpServer()).get("/people?status=INACTIVE").set("Authorization", adminAuthorization).expect(200);
    expect(await database.auditLog.count({ where: { churchId, entity: "Person" } })).toBeGreaterThanOrEqual(2);
  });

  it("validates strict payloads and opaque identifiers", async () => {
    await expectError(request(app.getHttpServer()).post("/people").set("Authorization", adminAuthorization).send({}), 400, "VALIDATION_ERROR");
    await expectError(request(app.getHttpServer()).post("/people").set("Authorization", adminAuthorization).send({ fullName: "Invalid", churchId }), 400, "VALIDATION_ERROR");
    await expectError(request(app.getHttpServer()).patch(`/people/${crypto.randomUUID()}`).set("Authorization", adminAuthorization).send({}), 400, "VALIDATION_ERROR");
    await expectError(request(app.getHttpServer()).get("/people/not-a-uuid").set("Authorization", adminAuthorization), 400, "VALIDATION_ERROR");
    await expectError(request(app.getHttpServer()).get(`/people/${foreignPersonId}`).set("Authorization", adminAuthorization), 404, "PERSON_NOT_FOUND");
  });

  it("applies the complete read and write role matrix", async () => {
    const created = await request(app.getHttpServer()).post("/people").set("Authorization", pastorAuthorization)
      .send({ fullName: "Pessoa Pastor", observations: "pastoral" }).expect(201);
    const id = created.body.data.id as string;
    expect(created.body.data.observations).toBe("pastoral");

    for (const authorization of [leaderAuthorization, supervisorAuthorization]) {
      const detail = await request(app.getHttpServer()).get(`/people/${id}`).set("Authorization", authorization).expect(200);
      expect(detail.body.data).not.toHaveProperty("observations");
      await expectError(request(app.getHttpServer()).patch(`/people/${id}`).set("Authorization", authorization).send({ fullName: "Negada" }), 403, "AUTH_FORBIDDEN");
      await expectError(request(app.getHttpServer()).patch(`/people/${id}/status`).set("Authorization", authorization).send({ status: "INACTIVE" }), 403, "AUTH_FORBIDDEN");
    }
    await expectError(request(app.getHttpServer()).patch(`/people/${id}/status`).set("Authorization", pastorAuthorization).send({ status: "INACTIVE" }), 403, "AUTH_FORBIDDEN");
    const updated = await request(app.getHttpServer()).patch(`/people/${id}`).set("Authorization", pastorAuthorization)
      .send({ phone: "+5511988887777", observations: null }).expect(200);
    expect(updated.body.data).toMatchObject({ phone: "+5511988887777", observations: null });
  });

  it("supports deterministic paging, filters, reactivation and idempotent status", async () => {
    const created = await request(app.getHttpServer()).post("/people").set("Authorization", adminAuthorization)
      .send({ fullName: "Pessoa Reativar", gender: "Teste" }).expect(201);
    const id = created.body.data.id as string;
    const page = await request(app.getHttpServer()).get("/people?page=1&pageSize=1&search=Reativar&gender=test")
      .set("Authorization", supervisorAuthorization).expect(200);
    expect(page.body.meta).toMatchObject({ page: 1, pageSize: 1, totalItems: 1, totalPages: 1 });
    expect(page.body.data[0].id).toBe(id);

    const casing = await request(app.getHttpServer()).get("/people?page=1&pageSize=1&search=Reativar&gender=TESTE")
      .set("Authorization", supervisorAuthorization).expect(200);
    expect(casing.body.meta.totalItems).toBe(1);
    expect(casing.body.data[0].id).toBe(id);

    const noMatch = await request(app.getHttpServer()).get("/people?page=1&pageSize=20&search=Reativar&gender=naoexiste")
      .set("Authorization", supervisorAuthorization).expect(200);
    expect(noMatch.body.meta).toMatchObject({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
    expect(noMatch.body.data).toEqual([]);

    await request(app.getHttpServer()).patch(`/people/${id}/status`).set("Authorization", adminAuthorization).send({ status: "INACTIVE" }).expect(200);
    const auditCount = await database.auditLog.count({ where: { churchId, entityId: id } });
    await request(app.getHttpServer()).patch(`/people/${id}/status`).set("Authorization", adminAuthorization).send({ status: "INACTIVE" }).expect(200);
    await expect(database.auditLog.count({ where: { churchId, entityId: id } })).resolves.toBe(auditCount);
    await expectError(request(app.getHttpServer()).get(`/people/${id}`).set("Authorization", adminAuthorization), 404, "PERSON_NOT_FOUND");
    await request(app.getHttpServer()).patch(`/people/${id}/status`).set("Authorization", adminAuthorization).send({ status: "ACTIVE" }).expect(200);
    await request(app.getHttpServer()).get(`/people/${id}`).set("Authorization", adminAuthorization).expect(200);
  });

  it("sorts people by name, birth date and registration with consistent paging", async () => {
    const token = randomUUID().slice(0, 8);
    const search = encodeURIComponent(`Sortável ${token}`);
    const seeds = [
      { fullName: `Zoe Sortável ${token}`, birthDate: "1990-06-15", createdAt: "2026-01-01T00:00:00.000Z" },
      { fullName: `ana Sortável ${token}`, birthDate: "1999-12-31", createdAt: "2025-06-01T00:00:00.000Z" },
      { fullName: `Betty Sortável ${token}`, birthDate: null, createdAt: "2024-01-01T00:00:00.000Z" },
      { fullName: `carla Sortável ${token}`, birthDate: "1980-01-01", createdAt: "2023-01-01T00:00:00.000Z" }
    ] as const;
    const ids: string[] = [];
    for (const seed of seeds) {
      const created = await request(app.getHttpServer()).post("/people").set("Authorization", adminAuthorization)
        .send({ fullName: seed.fullName, ...(seed.birthDate ? { birthDate: seed.birthDate } : {}) }).expect(201);
      const id = created.body.data.id as string;
      ids.push(id);
      await database.person.update({ where: { id_churchId: { id, churchId } }, data: { createdAt: new Date(seed.createdAt) } });
    }

    const byNameAsc = await request(app.getHttpServer()).get(`/people?page=1&pageSize=20&search=${search}&sortBy=fullName&sortOrder=asc`)
      .set("Authorization", adminAuthorization).expect(200);
    expect(byNameAsc.body.data.map(({ fullName }: { fullName: string }) => fullName.toLowerCase())).toEqual([
      `ana sortável ${token}`, `betty sortável ${token}`, `carla sortável ${token}`, `zoe sortável ${token}`
    ]);

    const byNameDesc = await request(app.getHttpServer()).get(`/people?page=1&pageSize=20&search=${search}&sortBy=fullName&sortOrder=desc`)
      .set("Authorization", adminAuthorization).expect(200);
    expect(byNameDesc.body.data.map(({ fullName }: { fullName: string }) => fullName.toLowerCase())).toEqual([
      `zoe sortável ${token}`, `carla sortável ${token}`, `betty sortável ${token}`, `ana sortável ${token}`
    ]);

    const byBirthAsc = await request(app.getHttpServer()).get(`/people?page=1&pageSize=20&search=${search}&sortBy=birthDate&sortOrder=asc`)
      .set("Authorization", adminAuthorization).expect(200);
    expect(byBirthAsc.body.data.map(({ id }: { id: string }) => id)).toEqual([ids[3], ids[0], ids[1], ids[2]]);

    const byBirthDesc = await request(app.getHttpServer()).get(`/people?page=1&pageSize=20&search=${search}&sortBy=birthDate&sortOrder=desc`)
      .set("Authorization", adminAuthorization).expect(200);
    expect(byBirthDesc.body.data.map(({ id }: { id: string }) => id)).toEqual([ids[1], ids[0], ids[3], ids[2]]);

    const byCreatedAsc = await request(app.getHttpServer()).get(`/people?page=1&pageSize=20&search=${search}&sortBy=createdAt&sortOrder=asc`)
      .set("Authorization", adminAuthorization).expect(200);
    expect(byCreatedAsc.body.data.map(({ id }: { id: string }) => id)).toEqual([ids[3], ids[2], ids[1], ids[0]]);

    const byCreatedDesc = await request(app.getHttpServer()).get(`/people?page=1&pageSize=20&search=${search}&sortBy=createdAt&sortOrder=desc`)
      .set("Authorization", adminAuthorization).expect(200);
    expect(byCreatedDesc.body.data.map(({ id }: { id: string }) => id)).toEqual([ids[0], ids[1], ids[2], ids[3]]);

    const pageOne = await request(app.getHttpServer()).get(`/people?page=1&pageSize=2&search=${search}&sortBy=fullName&sortOrder=asc`)
      .set("Authorization", adminAuthorization).expect(200);
    const pageTwo = await request(app.getHttpServer()).get(`/people?page=2&pageSize=2&search=${search}&sortBy=fullName&sortOrder=asc`)
      .set("Authorization", adminAuthorization).expect(200);
    expect(pageOne.body.meta).toMatchObject({ page: 1, pageSize: 2, totalItems: 4, totalPages: 2 });
    expect(pageTwo.body.meta).toMatchObject({ page: 2, pageSize: 2, totalItems: 4, totalPages: 2 });
    const pageOneIds = pageOne.body.data.map(({ id }: { id: string }) => id) as string[];
    const pageTwoIds = pageTwo.body.data.map(({ id }: { id: string }) => id) as string[];
    expect(pageOneIds).toHaveLength(2);
    expect(pageTwoIds).toHaveLength(2);
    expect(new Set([...pageOneIds, ...pageTwoIds])).toEqual(new Set(ids));
  });

  async function login(userId: string): Promise<string> {
    const response = await request(app.getHttpServer()).post("/auth/login")
      .send({ email: `${userId}@example.test`, password }).expect(200);
    return `Bearer ${response.body.data.accessToken}`;
  }

  async function expectError(call: SupertestTest, status: number, code: string): Promise<void> {
    const response = await call.expect(status);
    expect(response.body).toEqual({ error: { code, message: expect.any(String), details: {} } });
  }
});

function safeTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL;
  if (!value || !new URL(value).pathname.toLowerCase().includes("test")) throw new Error("TEST_DATABASE_URL must identify a test database");
  if (process.env.DATABASE_URL === value) throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL");
  return value;
}
