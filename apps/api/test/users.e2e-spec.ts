import { createRuntimeClient } from "@mission-atos/database";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { hash } from "argon2";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("user management HTTP flow", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const churchId = randomUUID();
  const otherChurchId = randomUUID();
  const adminId = randomUUID();
  const leaderId = randomUUID();
  const concurrentAdminId = randomUUID();
  const foreignUserId = randomUUID();
  const adminRoleId = randomUUID();
  const leaderRoleId = randomUUID();
  const deletedRoleId = randomUUID();
  const foreignRoleId = randomUUID();
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  const password = "admin-password-123";
  let app: INestApplication;
  let authorization: string;

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: "test",
      DATABASE_URL: databaseUrl,
      AUTH_CHURCH_ID: churchId,
      JWT_ACCESS_SECRET: "users-e2e-jwt-secret-at-least-32-characters",
      REFRESH_TOKEN_PEPPER: "users-e2e-refresh-pepper-is-distinct-and-long",
      AUTH_COOKIE_SECURE: "false",
      CORS_ORIGINS: "http://localhost:3000",
    });
    await database.church.createMany({
      data: [
        { id: churchId, name: "Users E2E", slug: `users-${churchId}` },
        {
          id: otherChurchId,
          name: "Foreign E2E",
          slug: `foreign-${otherChurchId}`,
        },
      ],
    });
    await database.user.createMany({
      data: [
        {
          id: adminId,
          churchId,
          firstName: "Admin",
          lastName: "User",
          email: `${adminId}@example.test`,
          passwordHash: await hash(password),
          status: "ACTIVE",
        },
        {
          id: leaderId,
          churchId,
          firstName: "Leader",
          lastName: "User",
          email: `${leaderId}@example.test`,
          passwordHash: await hash(password),
          status: "ACTIVE",
        },
        {
          id: foreignUserId,
          churchId: otherChurchId,
          firstName: "Foreign",
          lastName: "User",
          email: `${foreignUserId}@example.test`,
          passwordHash: await hash(password),
          status: "ACTIVE",
        },
      ],
    });
    await database.role.createMany({
      data: [
        { id: adminRoleId, churchId, name: "ADMIN" },
        { id: leaderRoleId, churchId, name: "LEADER" },
        {
          id: deletedRoleId,
          churchId,
          name: "SUPERVISOR",
          deletedAt: new Date(),
        },
        { id: foreignRoleId, churchId: otherChurchId, name: "LEADER" },
      ],
    });
    await database.userRole.createMany({
      data: [
        { churchId, userId: adminId, roleId: adminRoleId },
        { churchId, userId: leaderId, roleId: leaderRoleId },
      ],
    });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: `${adminId}@example.test`, password })
      .expect(200);
    authorization = `Bearer ${login.body.data.accessToken}`;
  });

  afterAll(async () => {
    await app.close();
    await database.$executeRawUnsafe(
      'DELETE FROM "sessions" WHERE "church_id" IN ($1::uuid, $2::uuid)',
      churchId,
      otherChurchId,
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "audit_logs" WHERE "church_id" IN ($1::uuid, $2::uuid)',
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

  it("rejects an unauthenticated administrative request", async () => {
    await request(app.getHttpServer()).get("/users").expect(401);
  });

  it("rejects a non-administrator", async () => {
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: `${leaderId}@example.test`, password })
      .expect(200);
    await request(app.getHttpServer())
      .get("/users")
      .set("Authorization", `Bearer ${login.body.data.accessToken}`)
      .expect(403);
  });

  it("creates and lists users without exposing sensitive fields or crossing churches", async () => {
    const created = await request(app.getHttpServer())
      .post("/users")
      .set("Authorization", authorization)
      .send({
        firstName: "New",
        lastName: "Leader",
        email: ` NEW-${adminId}@EXAMPLE.TEST `,
        initialPassword: "new-user-password-123",
        roleIds: [leaderRoleId],
      })
      .expect(201);
    expect(JSON.stringify(created.body)).not.toMatch(/password|token|secret/i);
    expect(created.body.data.email).toBe(`new-${adminId}@example.test`);
    const createdUserId: string = created.body.data.id;
    await request(app.getHttpServer())
      .post("/users")
      .set("Authorization", authorization)
      .send({
        firstName: "Duplicate",
        lastName: "Leader",
        email: `NEW-${adminId}@EXAMPLE.TEST`,
        initialPassword: "duplicate-password-123",
        roleIds: [],
      })
      .expect(409);
    await request(app.getHttpServer())
      .get(`/users/${createdUserId}`)
      .set("Authorization", authorization)
      .expect(200);
    const updated = await request(app.getHttpServer())
      .patch(`/users/${createdUserId}`)
      .set("Authorization", authorization)
      .send({ firstName: "Updated", email: `updated-${adminId}@example.test` })
      .expect(200);
    expect(updated.body.data.firstName).toBe("Updated");
    await request(app.getHttpServer())
      .patch(`/users/${createdUserId}`)
      .set("Authorization", authorization)
      .send({ email: `${adminId}@example.test` })
      .expect(409);
    await request(app.getHttpServer())
      .put(`/users/${createdUserId}/roles`)
      .set("Authorization", authorization)
      .send({ roleIds: [foreignRoleId] })
      .expect(404);
    await request(app.getHttpServer())
      .put(`/users/${createdUserId}/roles`)
      .set("Authorization", authorization)
      .send({ roleIds: [deletedRoleId] })
      .expect(404);
    await request(app.getHttpServer())
      .put(`/users/${createdUserId}/roles`)
      .set("Authorization", authorization)
      .send({ roleIds: [] })
      .expect(200);
    const rolesRestored = await request(app.getHttpServer())
      .put(`/users/${createdUserId}/roles`)
      .set("Authorization", authorization)
      .send({ roleIds: [leaderRoleId] })
      .expect(200);
    expect(rolesRestored.body.data.roles).toEqual([
      { id: leaderRoleId, name: "LEADER" },
    ]);
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: `updated-${adminId}@example.test`,
        password: "new-user-password-123",
      })
      .expect(200);
    expect(
      await database.session.count({
        where: { churchId, userId: createdUserId, revokedAt: null },
      }),
    ).toBe(1);
    await request(app.getHttpServer())
      .patch(`/users/${createdUserId}/status`)
      .set("Authorization", authorization)
      .send({ status: "BLOCKED" })
      .expect(200);
    expect(
      await database.session.count({
        where: { churchId, userId: createdUserId, revokedAt: null },
      }),
    ).toBe(0);
    await request(app.getHttpServer())
      .patch(`/users/${createdUserId}/status`)
      .set("Authorization", authorization)
      .send({ status: "ACTIVE" })
      .expect(200);
    const own = await request(app.getHttpServer())
      .patch("/users/me")
      .set("Authorization", authorization)
      .send({ firstName: "Current" })
      .expect(200);
    expect(own.body.data.id).toBe(adminId);
    expect(own.body.data.firstName).toBe("Current");
    await request(app.getHttpServer())
      .patch(`/users/${foreignUserId}`)
      .set("Authorization", authorization)
      .send({ firstName: "Forbidden" })
      .expect(404);
    const listed = await request(app.getHttpServer())
      .get(`/users?page=1&pageSize=20&status=ACTIVE&roleId=${leaderRoleId}&search=Updated`)
      .set("Authorization", authorization)
      .expect(200);
    expect(listed.body.data.map((user: { id: string }) => user.id)).toContain(
      createdUserId,
    );
    expect(listed.body.meta.totalItems).toBeGreaterThanOrEqual(1);
    await request(app.getHttpServer())
      .get(`/users/${foreignUserId}`)
      .set("Authorization", authorization)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/users/${adminId}/status`)
      .set("Authorization", authorization)
      .send({ status: "BLOCKED" })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/users/${adminId}/reset-password`)
      .set("Authorization", authorization)
      .send({ newPassword: "reset-password-1234" })
      .expect(204);
    expect(
      await database.session.count({
        where: { churchId, userId: adminId, revokedAt: null },
      }),
    ).toBe(0);
    const auditedActions = await database.auditLog.findMany({
      where: { churchId, entityId: createdUserId },
      select: { action: true },
    });
    expect(auditedActions.map(({ action }) => action)).toEqual(
      expect.arrayContaining([
        "USER_CREATED",
        "USER_UPDATED",
        "USER_ROLE_REMOVED",
        "USER_ROLE_ASSIGNED",
        "USER_DEACTIVATED",
        "USER_ACTIVATED",
      ]),
    );
  });

  it("preserves one active administrator under concurrent deactivation", async () => {
    await database.user.create({
      data: {
        id: concurrentAdminId,
        churchId,
        firstName: "Concurrent",
        lastName: "Admin",
        email: `${concurrentAdminId}@example.test`,
        passwordHash: await hash(password),
        status: "ACTIVE",
      },
    });
    await database.userRole.create({
      data: {
        churchId,
        userId: concurrentAdminId,
        roleId: adminRoleId,
      },
    });

    const responses = await Promise.all([
      request(app.getHttpServer())
        .patch(`/users/${adminId}/status`)
        .set("Authorization", authorization)
        .send({ status: "BLOCKED" }),
      request(app.getHttpServer())
        .patch(`/users/${concurrentAdminId}/status`)
        .set("Authorization", authorization)
        .send({ status: "BLOCKED" }),
    ]);

    const statuses = responses.map(({ status }) => status);
    expect(statuses.filter((status) => status === 200)).toHaveLength(1);
    expect(statuses.some((status) => status === 403 || status === 409)).toBe(true);
    expect(
      await database.user.count({
        where: {
          churchId,
          status: "ACTIVE",
          deletedAt: null,
          userRoles: {
            some: {
              churchId,
              deletedAt: null,
              role: { name: "ADMIN", deletedAt: null },
            },
          },
        },
      }),
    ).toBe(1);
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
