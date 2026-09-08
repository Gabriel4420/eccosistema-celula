import { createRuntimeClient } from "@mission-atos/database";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { hash } from "argon2";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("church management HTTP flow", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const churchId = randomUUID();
  const otherChurchId = randomUUID();
  const adminId = randomUUID();
  const leaderId = randomUUID();
  const adminRoleId = randomUUID();
  const leaderRoleId = randomUUID();
  const password = "church-e2e-password-123";
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  let app: INestApplication;
  let adminAuthorization: string;
  let leaderAuthorization: string;

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: "test",
      DATABASE_URL: databaseUrl,
      AUTH_CHURCH_ID: churchId,
      JWT_ACCESS_SECRET: "church-e2e-jwt-secret-at-least-32-characters",
      REFRESH_TOKEN_PEPPER: "church-e2e-refresh-pepper-is-distinct-and-long",
      AUTH_COOKIE_SECURE: "false",
      CORS_ORIGINS: "http://localhost:3000"
    });
    await database.church.createMany({
      data: [
        { id: churchId, name: "Church E2E", slug: `church-e2e-${churchId}` },
        {
          id: otherChurchId,
          name: "Hidden Church E2E",
          slug: `hidden-e2e-${otherChurchId}`
        }
      ]
    });
    await database.user.createMany({
      data: [
        {
          id: adminId,
          churchId,
          firstName: "Church",
          lastName: "Admin",
          email: `${adminId}@example.test`,
          passwordHash: await hash(password),
          status: "ACTIVE"
        },
        {
          id: leaderId,
          churchId,
          firstName: "Church",
          lastName: "Leader",
          email: `${leaderId}@example.test`,
          passwordHash: await hash(password),
          status: "ACTIVE"
        }
      ]
    });
    await database.role.createMany({
      data: [
        { id: adminRoleId, churchId, name: "ADMIN" },
        { id: leaderRoleId, churchId, name: "LEADER" }
      ]
    });
    await database.userRole.createMany({
      data: [
        { churchId, userId: adminId, roleId: adminRoleId },
        { churchId, userId: leaderId, roleId: leaderRoleId }
      ]
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
    adminAuthorization = await login(adminId);
    leaderAuthorization = await login(leaderId);
  });

  afterAll(async () => {
    await app.close();
    for (const table of [
      "sessions",
      "audit_logs",
      "user_roles",
      "roles",
      "users"
    ]) {
      await database.$executeRawUnsafe(
        `DELETE FROM "${table}" WHERE "church_id" = $1::uuid`,
        churchId
      );
    }
    await database.$executeRawUnsafe(
      'DELETE FROM "user_preferences" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "church_settings" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "churches" WHERE "id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId
    );
    await database.$disconnect();
  });

  it("protects every endpoint and allows safe reads for authenticated roles", async () => {
    await request(app.getHttpServer()).get("/church").expect(401);
    const response = await request(app.getHttpServer())
      .get("/church")
      .set("Authorization", leaderAuthorization)
      .expect(200);
    expect(response.body.data.id).toBe(churchId);
    expect(response.body.data.name).toBe("Church E2E");
    expect(JSON.stringify(response.body)).not.toMatch(
      /deletedAt|passwordHash|tokenHash|sessions/i
    );
    await request(app.getHttpServer())
      .get("/church/settings")
      .set("Authorization", leaderAuthorization)
      .expect(200);
  });

  it("rejects writes from a non-administrator", async () => {
    await request(app.getHttpServer())
      .patch("/church")
      .set("Authorization", leaderAuthorization)
      .send({ name: "Forbidden" })
      .expect(403);
    await request(app.getHttpServer())
      .patch("/church/settings")
      .set("Authorization", leaderAuthorization)
      .send({ weekStartsOn: "MONDAY" })
      .expect(403);
  });

  it("updates partial institutional data and settings with audit", async () => {
    const updated = await request(app.getHttpServer())
      .patch("/church")
      .set("Authorization", adminAuthorization)
      .send({
        name: "  Igreja   Atualizada ",
        email: " CONTATO@EXAMPLE.TEST ",
        phone: "+55 (11) 99999-9999",
        state: "sp",
        postalCode: "01001-000"
      })
      .expect(200);
    expect(updated.body.data).toMatchObject({
      name: "Igreja Atualizada",
      email: "contato@example.test",
      phone: "+5511999999999"
    });
    expect(updated.body.data.address).toMatchObject({
      state: "SP",
      postalCode: "01001000"
    });

    const settings = await request(app.getHttpServer())
      .patch("/church/settings")
      .set("Authorization", adminAuthorization)
      .send({ timezone: "America/Recife", weekStartsOn: "MONDAY" })
      .expect(200);
    expect(settings.body.data).toEqual({
      timezone: "America/Recife",
      weekStartsOn: "MONDAY",
      reportDeadlineHours: 48
    });

    const deadline = await request(app.getHttpServer())
      .patch("/church/settings")
      .set("Authorization", adminAuthorization)
      .send({ reportDeadlineHours: 96 })
      .expect(200);
    expect(deadline.body.data).toEqual({
      timezone: "America/Recife",
      weekStartsOn: "MONDAY",
      reportDeadlineHours: 96
    });

    const readBack = await request(app.getHttpServer())
      .get("/church/settings")
      .set("Authorization", leaderAuthorization)
      .expect(200);
    expect(readBack.body.data).toEqual({
      timezone: "America/Recife",
      weekStartsOn: "MONDAY",
      reportDeadlineHours: 96
    });

    const actions = await database.auditLog.findMany({
      where: { churchId, entityId: churchId },
      select: { action: true, before: true, after: true }
    });
    expect(actions.map(({ action }) => action)).toEqual(
      expect.arrayContaining([
        "CHURCH_IDENTITY_UPDATED",
        "CHURCH_CONTACT_UPDATED",
        "CHURCH_ADDRESS_UPDATED",
        "CHURCH_SETTINGS_UPDATED"
      ])
    );
    expect(JSON.stringify(actions)).not.toMatch(/password|token|secret/i);
  });

  it("validates payloads and unique/reserved slugs", async () => {
    await request(app.getHttpServer())
      .patch("/church")
      .set("Authorization", adminAuthorization)
      .send({})
      .expect(400);
    await request(app.getHttpServer())
      .patch("/church")
      .set("Authorization", adminAuthorization)
      .send({ churchId: otherChurchId })
      .expect(400);
    await request(app.getHttpServer())
      .patch("/church")
      .set("Authorization", adminAuthorization)
      .send({ slug: "admin" })
      .expect(400);
    await request(app.getHttpServer())
      .patch("/church/settings")
      .set("Authorization", adminAuthorization)
      .send({ reportDeadlineHours: 0 })
      .expect(400);
    await request(app.getHttpServer())
      .patch("/church/settings")
      .set("Authorization", adminAuthorization)
      .send({ reportDeadlineHours: 721 })
      .expect(400);
    await request(app.getHttpServer())
      .patch("/church")
      .set("Authorization", adminAuthorization)
      .send({ slug: `hidden-e2e-${otherChurchId}` })
      .expect(409);
  });

  it("revalidates an administrator whose database role was removed", async () => {
    await database.userRole.updateMany({
      where: { churchId, userId: adminId, roleId: adminRoleId },
      data: { deletedAt: new Date() }
    });
    await request(app.getHttpServer())
      .patch("/church")
      .set("Authorization", adminAuthorization)
      .send({ name: "Must not change" })
      .expect(403);
  });

  async function login(userId: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: `${userId}@example.test`, password })
      .expect(200);
    return `Bearer ${response.body.data.accessToken}`;
  }
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

