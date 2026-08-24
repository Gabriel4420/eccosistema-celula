import { createRuntimeClient } from "@mission-atos/database";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { hash } from "argon2";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("attendance HTTP flow", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const churchId = randomUUID();
  const otherChurchId = randomUUID();
  const leaderId = randomUUID();
  const traineeId = randomUUID();
  const roleId = randomUUID();
  const cellId = randomUUID();
  const meetingId = randomUUID();
  const eligibleId = randomUUID();
  const futureMemberId = randomUUID();
  const password = "attendance-e2e-password-123";
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  let app: INestApplication;
  let leaderAuthorization: string;
  let traineeAuthorization: string;

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: "test", DATABASE_URL: databaseUrl, AUTH_CHURCH_ID: churchId,
      JWT_ACCESS_SECRET: "attendance-e2e-jwt-secret-at-least-32-characters",
      REFRESH_TOKEN_PEPPER: "attendance-e2e-refresh-pepper-is-distinct-long",
      AUTH_COOKIE_SECURE: "false", CORS_ORIGINS: "http://localhost:3000"
    });
    await database.church.create({ data: { id: churchId, name: "Attendance E2E", slug: `attendance-${churchId}`, timezone: "America/Sao_Paulo" } });
    await database.church.create({ data: { id: otherChurchId, name: "Other Attendance", slug: `attendance-${otherChurchId}` } });
    await database.user.createMany({ data: [
      { id: leaderId, churchId, firstName: "Attendance", lastName: "Leader", email: `${leaderId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
      { id: traineeId, churchId, firstName: "Attendance", lastName: "Trainee", email: `${traineeId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" }
    ] });
    await database.role.create({ data: { id: roleId, churchId, name: "LEADER" } });
    await database.userRole.createMany({ data: [{ churchId, userId: leaderId, roleId }, { churchId, userId: traineeId, roleId }] });
    await database.cell.create({ data: { id: cellId, churchId, code: "ATT-E2E", name: "Attendance Cell", status: "ACTIVE", leaderId, traineeLeaderId: traineeId, meetingDay: "SATURDAY", meetingTime: new Date("1970-01-01T19:00:00Z"), address: "Test" } });
    await database.person.createMany({ data: [
      { id: eligibleId, churchId, fullName: "Eligible Member" },
      { id: futureMemberId, churchId, fullName: "Future Member" }
    ] });
    await database.cellMembership.createMany({ data: [
      { churchId, cellId, personId: eligibleId, status: "ACTIVE", joinedAt: new Date("2026-08-01T03:00:00Z") },
      { churchId, cellId, personId: futureMemberId, status: "ACTIVE", joinedAt: new Date("2026-08-23T03:00:00Z") }
    ] });
    await database.meeting.create({ data: { id: meetingId, churchId, cellId, meetingDate: new Date("2026-08-22"), status: "SCHEDULED" } });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication(); app.use(cookieParser()); await app.init();
    leaderAuthorization = await login(leaderId); traineeAuthorization = await login(traineeId);
  });

  afterAll(async () => {
    if (app) await app.close();
    for (const table of ["idempotency_requests", "sessions", "audit_logs", "meeting_visitors", "meeting_attendances", "meetings", "cell_memberships", "people", "cells", "user_roles", "roles", "users"]) {
      await database.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "church_id" = $1::uuid`, churchId);
    }
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${churchId}::uuid`;
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${otherChurchId}::uuid`;
    await database.$disconnect();
  });

  it("loads historical eligibility, saves, reloads and edits", async () => {
    const first = await request(app.getHttpServer()).get(path()).set("Authorization", leaderAuthorization).expect(200);
    expect(first.body.data.participants).toEqual([{ personId: eligibleId, fullName: "Eligible Member", status: "UNMARKED" }]);
    const saved = await request(app.getHttpServer()).put(path()).set("Authorization", leaderAuthorization)
      .send({ expectedRevision: 0, attendance: [{ personId: eligibleId, status: "PRESENT" }] }).expect(200);
    expect(saved.body.data).toMatchObject({ revision: 1, summary: { presentParticipants: 1 } });
    await request(app.getHttpServer()).put(path()).set("Authorization", leaderAuthorization)
      .send({ expectedRevision: 1, attendance: [{ personId: eligibleId, status: "ABSENT" }] }).expect(200);
    const reloaded = await request(app.getHttpServer()).get(path()).set("Authorization", leaderAuthorization).expect(200);
    expect(reloaded.body.data.participants[0].status).toBe("ABSENT");
  });

  it("keeps trainee read-only and rejects ineligible ids", async () => {
    await request(app.getHttpServer()).get(path()).set("Authorization", traineeAuthorization).expect(200);
    await request(app.getHttpServer()).put(path()).set("Authorization", traineeAuthorization).send({ expectedRevision: 2, attendance: [] }).expect(403);
    const result = await request(app.getHttpServer()).put(path()).set("Authorization", leaderAuthorization)
      .send({ expectedRevision: 2, attendance: [{ personId: futureMemberId, status: "PRESENT" }] }).expect(409);
    expect(result.body.error.code).toBe("PERSON_NOT_ELIGIBLE");
  });

  it("adds and removes a quick visitor idempotently", async () => {
    const key = randomUUID();
    const created = await request(app.getHttpServer()).post(`${path()}/visitors`).set("Authorization", leaderAuthorization).set("Idempotency-Key", key)
      .send({ kind: "quick-create", name: "Quick Visitor" }).expect(201);
    expect(created.body.data.summary).toMatchObject({ visitorCount: 1, totalPresent: 1 });
    const replay = await request(app.getHttpServer()).post(`${path()}/visitors`).set("Authorization", leaderAuthorization).set("Idempotency-Key", key)
      .send({ kind: "quick-create", name: "Quick Visitor" }).expect(201);
    const personId = replay.body.data.visitors[0].personId as string;
    await request(app.getHttpServer()).delete(`${path()}/visitors/${personId}`).set("Authorization", leaderAuthorization).expect(204);
    await request(app.getHttpServer()).delete(`${path()}/visitors/${personId}`).set("Authorization", leaderAuthorization).expect(204);
  });

  function path(): string { return `/cells/${cellId}/meetings/${meetingId}/attendance`; }
  async function login(userId: string): Promise<string> {
    const response = await request(app.getHttpServer()).post("/auth/login").send({ email: `${userId}@example.test`, password }).expect(200);
    return `Bearer ${response.body.data.accessToken}`;
  }
});

function safeTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL;
  if (!value || !new URL(value).pathname.toLowerCase().includes("test")) throw new Error("TEST_DATABASE_URL must identify a test database");
  if (process.env.DATABASE_URL === value) throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL");
  return value;
}
