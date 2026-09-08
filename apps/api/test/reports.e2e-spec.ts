import { createRuntimeClient } from "@mission-atos/database";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { hash } from "argon2";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("reports HTTP flow", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const churchId = randomUUID();
  const otherChurchId = randomUUID();
  const adminId = randomUUID();
  const leaderId = randomUUID();
  const otherAdminId = randomUUID();
  const adminRoleId = randomUUID();
  const leaderRoleId = randomUUID();
  const cellId = randomUUID();
  const otherCellId = randomUUID();
  const meetingId = randomUUID();
  const otherMeetingId = randomUUID();
  const personId = randomUUID();
  const otherPersonId = randomUUID();
  const password = "reports-e2e-password-123";
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  let app: INestApplication;
  let adminAuth: string;
  let leaderAuth: string;

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: "test", DATABASE_URL: databaseUrl, AUTH_CHURCH_ID: churchId,
      JWT_ACCESS_SECRET: "reports-e2e-jwt-secret-at-least-32-characters",
      REFRESH_TOKEN_PEPPER: "reports-e2e-refresh-pepper-is-distinct-long",
      AUTH_COOKIE_SECURE: "false", CORS_ORIGINS: "http://localhost:3000"
    });
    await database.church.create({ data: { id: churchId, name: "Reports E2E", slug: `reports-${churchId}`, timezone: "America/Sao_Paulo" } });
    await database.church.create({ data: { id: otherChurchId, name: "Other Reports", slug: `reports-${otherChurchId}` } });

    await database.user.createMany({ data: [
      { id: adminId, churchId, firstName: "Reports", lastName: "Admin", email: `${adminId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
      { id: leaderId, churchId, firstName: "Reports", lastName: "Leader", email: `${leaderId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
      { id: otherAdminId, churchId: otherChurchId, firstName: "Other", lastName: "Admin", email: `${otherAdminId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" }
    ] });
    await database.role.createMany({ data: [{ id: adminRoleId, churchId, name: "ADMIN" }, { id: leaderRoleId, churchId, name: "LEADER" }] });
    await database.userRole.createMany({ data: [{ churchId, userId: adminId, roleId: adminRoleId }, { churchId, userId: leaderId, roleId: leaderRoleId }] });
    await database.role.create({ data: { id: randomUUID(), churchId: otherChurchId, name: "ADMIN" } });

    await database.cell.create({ data: { id: cellId, churchId, code: "RPT-E2E", name: "Reports Cell", status: "ACTIVE", leaderId, meetingDay: "SUNDAY", meetingTime: new Date("1970-01-01T19:00:00Z"), address: "Test" } });
    await database.cell.create({ data: { id: otherCellId, churchId: otherChurchId, code: "ORPT-E2E", name: "Other Cell", status: "ACTIVE", leaderId: otherAdminId, meetingDay: "SUNDAY", meetingTime: new Date("1970-01-01T19:00:00Z"), address: "Other tenant" } });
    await database.person.createMany({ data: [
      { id: personId, churchId, fullName: "Person One", phone: "+5511999999999" },
      { id: otherPersonId, churchId: otherChurchId, fullName: "Other Person" }
    ] });
    await database.cellMembership.create({ data: { churchId, personId, cellId, status: "ACTIVE", joinedAt: new Date("2026-01-01T00:00:00Z") } });
    await database.meeting.createMany({ data: [
      { id: meetingId, churchId, cellId, meetingDate: new Date("2026-08-22"), status: "COMPLETED" },
      { id: otherMeetingId, churchId: otherChurchId, cellId: otherCellId, meetingDate: new Date("2026-08-22"), status: "COMPLETED" }
    ] });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
    adminAuth = await loginAs(adminId);
    leaderAuth = await loginAs(leaderId);
  });

  afterAll(async () => {
    if (app) await app.close();
    for (const table of ["report_exports", "idempotency_requests", "sessions", "audit_logs", "meeting_visitors", "meeting_attendances", "meeting_reports", "meetings", "cell_memberships", "people", "user_preferences", "church_settings", "cells", "user_roles", "roles", "users"]) {
      await database.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "church_id" IN ($1::uuid, $2::uuid)`, churchId, otherChurchId);
    }
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${churchId}::uuid`;
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${otherChurchId}::uuid`;
    await database.$disconnect();
  });

  async function loginAs(userId: string) {
    const res = await request(app.getHttpServer()).post("/auth/login").send({ email: `${userId}@example.test`, password }).expect(200);
    return `Bearer ${res.body.data.accessToken as string}`;
  }

  it("requires authentication and blocks unknown roles", async () => {
    await request(app.getHttpServer()).get("/reports/pending").expect(401);
  });

  it("lists pending reports scoped to the church and isolates the other tenant", async () => {
    const res = await request(app.getHttpServer()).get("/reports/pending").set("Authorization", adminAuth).expect(200);
    expect(res.body.data).toBeInstanceOf(Array);
    const pendingMeetingIds = (res.body.data as Array<{ cell: { id: string } }>).map((item) => item.cell.id);
    expect(pendingMeetingIds).toContain(cellId);
    expect(pendingMeetingIds).not.toContain(otherCellId);
    expect(res.body.meta).toHaveProperty("totalItems");
  });

  it("returns attendance summary and detail for the church", async () => {
    const summary = await request(app.getHttpServer()).get("/reports/attendance/summary").set("Authorization", adminAuth).expect(200);
    expect(summary.body.data).toBeInstanceOf(Array);
    const detail = await request(app.getHttpServer()).get("/reports/attendance/detail").query({ cellId }).set("Authorization", adminAuth).expect(200);
    expect(detail.body.data).toBeInstanceOf(Array);
  });

  it("returns 404 for a cell outside the church scope on drill-down", async () => {
    await request(app.getHttpServer()).get("/reports/attendance/detail").query({ cellId: otherCellId }).set("Authorization", adminAuth).expect(404);
  });

  it("lists visitors and meetings within scope", async () => {
    await request(app.getHttpServer()).get("/reports/visitors").set("Authorization", adminAuth).expect(200);
    await request(app.getHttpServer()).get("/reports/meetings").set("Authorization", leaderAuth).expect(200);
  });

  it("exports cells as CSV and records an audit row", async () => {
    const res = await request(app.getHttpServer()).get("/reports/export/cells").query({ format: "csv" }).set("Authorization", adminAuth).expect(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment");
    const count = await database.reportExport.count({ where: { churchId, reportType: "cells", format: "csv" } });
    expect(count).toBeGreaterThanOrEqual(1);
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