import { createRuntimeClient } from "@mission-atos/database";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("authentication HTTP flow", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const churchId = randomUUID();
  const userId = randomUUID();
  const roleId = randomUUID();
  const email = `${userId}@example.test`;
  const password = "test-password-1234";
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: "test",
      DATABASE_URL: databaseUrl,
      AUTH_CHURCH_ID: churchId,
      JWT_ACCESS_SECRET: "e2e-jwt-secret-that-is-at-least-32-characters",
      REFRESH_TOKEN_PEPPER:
        "e2e-refresh-pepper-that-is-different-and-long",
      AUTH_COOKIE_SECURE: "false",
      CORS_ORIGINS: "http://localhost:3000"
    });
    await database.church.create({
      data: { id: churchId, name: "E2E Church", slug: `e2e-${churchId}` }
    });
    await database.user.create({
      data: {
        id: userId,
        churchId,
        firstName: "E2E",
        lastName: "User",
        email,
        passwordHash: await hash(password),
        status: "ACTIVE"
      }
    });
    await database.role.create({
      data: { id: roleId, churchId, name: "E2E_ROLE" }
    });
    await database.userRole.create({
      data: { churchId, userId, roleId }
    });
  });

  afterAll(async () => {
    await database.$executeRawUnsafe(
      'DELETE FROM "sessions" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "audit_logs" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "user_roles" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "roles" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "users" WHERE "church_id" = $1::uuid',
      churchId
    );
    await database.$executeRawUnsafe(
      'DELETE FROM "churches" WHERE "id" = $1::uuid',
      churchId
    );
    await database.$disconnect();
  });

  it("logs in, rotates the refresh token and logs out", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();

    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: email.toUpperCase(), password })
      .expect(200);
    expect(login.body.data.user).toEqual({
      id: userId,
      churchId,
      roles: ["E2E_ROLE"]
    });
    const firstCookie = login.headers["set-cookie"]?.[0];
    expect(firstCookie).toContain("HttpOnly");
    expect(firstCookie).toContain("SameSite=Lax");
    expect(firstCookie).toContain("Path=/auth");

    const refresh = await request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Cookie", firstCookie ?? "")
      .set("Origin", "http://localhost:3000")
      .expect(200);
    const secondCookie = refresh.headers["set-cookie"]?.[0];
    expect(secondCookie).toBeDefined();
    expect(secondCookie).not.toBe(firstCookie);

    await request(app.getHttpServer())
      .post("/auth/logout")
      .set("Cookie", secondCookie ?? "")
      .set("Origin", "http://localhost:3000")
      .expect(204);

    await app.close();
  });

  it("keeps health public and rejects a protected route without JWT", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
    await request(app.getHttpServer()).get("/health").expect(200);
    await request(app.getHttpServer())
      .post("/auth/change-password")
      .send({ currentPassword: password, newPassword: "another-password-1234" })
      .expect(401);
    await app.close();
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
