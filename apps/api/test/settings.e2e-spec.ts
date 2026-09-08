import { createRuntimeClient } from "@mission-atos/database";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { hash } from "argon2";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("user preferences HTTP flow", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const churchId = randomUUID();
  const adminId = randomUUID();
  const leaderId = randomUUID();
  const adminRoleId = randomUUID();
  const leaderRoleId = randomUUID();
  const password = "settings-e2e-password-123";
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  let app: INestApplication;
  let adminAuthorization: string;
  let leaderAuthorization: string;

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: "test",
      DATABASE_URL: databaseUrl,
      AUTH_CHURCH_ID: churchId,
      JWT_ACCESS_SECRET: "settings-e2e-jwt-secret-at-least-32-characters",
      REFRESH_TOKEN_PEPPER: "settings-e2e-refresh-pepper-is-distinct",
      AUTH_COOKIE_SECURE: "false",
      CORS_ORIGINS: "http://localhost:3000"
    });
    await database.church.create({
      data: {
        id: churchId,
        name: "Settings E2E",
        slug: `settings-e2e-${churchId}`
      }
    });
    await database.user.createMany({
      data: [
        {
          id: adminId,
          churchId,
          firstName: "Settings",
          lastName: "Admin",
          email: `${adminId}@example.test`,
          passwordHash: await hash(password),
          status: "ACTIVE"
        },
        {
          id: leaderId,
          churchId,
          firstName: "Settings",
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
      "user_preferences",
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
      'DELETE FROM "churches" WHERE "id" = $1::uuid',
      churchId
    );
    await database.$disconnect();
  });

  it("protects the endpoint and returns documented defaults", async () => {
    await request(app.getHttpServer()).get("/settings/me").expect(401);
    const response = await request(app.getHttpServer())
      .get("/settings/me")
      .set("Authorization", leaderAuthorization)
      .expect(200);
    expect(response.body.data).toEqual({
      language: "pt-BR",
      displayTimezone: null,
      dateFormat: "dd/MM/yyyy",
      theme: "system"
    });
    expect(JSON.stringify(response.body)).not.toMatch(
      /deletedAt|userId|churchId|passwordHash/i
    );
  });

  it("updates own preferences for any authenticated role with audit", async () => {
    const updated = await request(app.getHttpServer())
      .patch("/settings/me")
      .set("Authorization", leaderAuthorization)
      .send({
        language: "en",
        displayTimezone: "America/New_York",
        dateFormat: "yyyy-MM-dd",
        theme: "dark"
      })
      .expect(200);
    expect(updated.body.data).toEqual({
      language: "en",
      displayTimezone: "America/New_York",
      dateFormat: "yyyy-MM-dd",
      theme: "dark"
    });

    const auditCount = await database.auditLog.count({
      where: {
        churchId,
        entityId: leaderId,
        action: "USER_PREFERENCES_UPDATED"
      }
    });
    expect(auditCount).toBe(1);

    const noOp = await request(app.getHttpServer())
      .patch("/settings/me")
      .set("Authorization", leaderAuthorization)
      .send({ theme: "dark" })
      .expect(200);
    expect(noOp.body.data.theme).toBe("dark");

    const auditCountAfterNoOp = await database.auditLog.count({
      where: {
        churchId,
        entityId: leaderId,
        action: "USER_PREFERENCES_UPDATED"
      }
    });
    expect(auditCountAfterNoOp).toBe(1);
  });

  it("keeps preferences per user and allows clearing the timezone", async () => {
    const inherit = await request(app.getHttpServer())
      .patch("/settings/me")
      .set("Authorization", adminAuthorization)
      .send({ displayTimezone: null })
      .expect(200);
    expect(inherit.body.data).toMatchObject({
      displayTimezone: null
    });

    const readBack = await request(app.getHttpServer())
      .get("/settings/me")
      .set("Authorization", leaderAuthorization)
      .expect(200);
    expect(readBack.body.data).toMatchObject({
      language: "en",
      displayTimezone: "America/New_York"
    });
  });

  it("validates the update payload", async () => {
    await request(app.getHttpServer())
      .patch("/settings/me")
      .set("Authorization", leaderAuthorization)
      .send({})
      .expect(400);
    await request(app.getHttpServer())
      .patch("/settings/me")
      .set("Authorization", leaderAuthorization)
      .send({ language: "fr" })
      .expect(400);
    await request(app.getHttpServer())
      .patch("/settings/me")
      .set("Authorization", leaderAuthorization)
      .send({ theme: "blue" })
      .expect(400);
    await request(app.getHttpServer())
      .patch("/settings/me")
      .set("Authorization", leaderAuthorization)
      .send({ displayTimezone: "Not/AZone" })
      .expect(400);
    await request(app.getHttpServer())
      .patch("/settings/me")
      .set("Authorization", leaderAuthorization)
      .send({ churchId })
      .expect(400);
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