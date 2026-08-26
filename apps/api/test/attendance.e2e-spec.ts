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
  const otherCellId = randomUUID();
  const otherMeetingId = randomUUID();
  const otherPersonId = randomUUID();
  const leaderId = randomUUID();
  const traineeId = randomUUID();
  const roleId = randomUUID();
  const cellId = randomUUID();
  const meetingId = randomUUID();
  const eligibleId = randomUUID();
  const futureMemberId = randomUUID();
  const leftAtBoundaryId = randomUUID();
  const leftBeforeMeetingId = randomUUID();
  const deletedAtBoundaryId = randomUUID();
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
    await database.cell.create({ data: { id: otherCellId, churchId: otherChurchId, code: "OTHER-ATT", name: "Other Attendance Cell", status: "FORMING", meetingDay: "SATURDAY", meetingTime: new Date("1970-01-01T19:00:00Z"), address: "Other tenant" } });
    await database.person.create({ data: { id: otherPersonId, churchId: otherChurchId, fullName: "Other Tenant Person", phone: "+5511999999999" } });
    await database.meeting.create({ data: { id: otherMeetingId, churchId: otherChurchId, cellId: otherCellId, meetingDate: new Date("2026-08-22"), status: "SCHEDULED" } });
    await database.user.createMany({ data: [
      { id: leaderId, churchId, firstName: "Attendance", lastName: "Leader", email: `${leaderId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" },
      { id: traineeId, churchId, firstName: "Attendance", lastName: "Trainee", email: `${traineeId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" }
    ] });
    await database.role.create({ data: { id: roleId, churchId, name: "LEADER" } });
    await database.userRole.createMany({ data: [{ churchId, userId: leaderId, roleId }, { churchId, userId: traineeId, roleId }] });
    await database.cell.create({ data: { id: cellId, churchId, code: "ATT-E2E", name: "Attendance Cell", status: "ACTIVE", leaderId, traineeLeaderId: traineeId, meetingDay: "SATURDAY", meetingTime: new Date("1970-01-01T19:00:00Z"), address: "Test" } });
    await database.person.createMany({ data: [
      { id: eligibleId, churchId, fullName: "Eligible Member" },
      { id: futureMemberId, churchId, fullName: "Future Member" },
      { id: leftAtBoundaryId, churchId, fullName: "Left At Boundary" },
      { id: leftBeforeMeetingId, churchId, fullName: "Left Before Meeting" },
      { id: deletedAtBoundaryId, churchId, fullName: "Deleted At Boundary", deletedAt: new Date("2026-08-22T03:00:00Z") }
    ] });
    await database.cellMembership.createMany({ data: [
      { churchId, cellId, personId: eligibleId, status: "ACTIVE", joinedAt: new Date("2026-08-01T03:00:00Z") },
      { churchId, cellId, personId: futureMemberId, status: "ACTIVE", joinedAt: new Date("2026-08-23T03:00:00Z") },
      { churchId, cellId, personId: leftAtBoundaryId, status: "INACTIVE", joinedAt: new Date("2026-08-01T03:00:00Z"), leftAt: new Date("2026-08-22T03:00:00Z") },
      { churchId, cellId, personId: leftBeforeMeetingId, status: "INACTIVE", joinedAt: new Date("2026-08-01T03:00:00Z"), leftAt: new Date("2026-08-22T02:59:59Z") },
      { churchId, cellId, personId: deletedAtBoundaryId, status: "ACTIVE", joinedAt: new Date("2026-08-01T03:00:00Z") }
    ] });
    await database.meeting.create({ data: { id: meetingId, churchId, cellId, meetingDate: new Date("2026-08-22"), status: "SCHEDULED" } });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication(); app.use(cookieParser()); await app.init();
    leaderAuthorization = await login(leaderId); traineeAuthorization = await login(traineeId);
  });

  afterAll(async () => {
    if (app) await app.close();
    for (const table of ["idempotency_requests", "sessions", "audit_logs", "meeting_visitors", "meeting_attendances", "meetings", "cell_memberships", "people", "cells", "user_roles", "roles", "users"]) {
      await database.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "church_id" IN ($1::uuid, $2::uuid)`, churchId, otherChurchId);
    }
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${churchId}::uuid`;
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${otherChurchId}::uuid`;
    await database.$disconnect();
  });

  it("loads historical eligibility, saves, reloads and edits", async () => {
    const first = await request(app.getHttpServer()).get(path()).set("Authorization", leaderAuthorization).expect(200);
    expect(first.body.data.participants).toEqual([
      { personId: deletedAtBoundaryId, fullName: "Deleted At Boundary", status: "UNMARKED" },
      { personId: eligibleId, fullName: "Eligible Member", status: "UNMARKED" },
      { personId: leftAtBoundaryId, fullName: "Left At Boundary", status: "UNMARKED" }
    ]);
    const saved = await request(app.getHttpServer()).put(path()).set("Authorization", leaderAuthorization)
      .send({ expectedRevision: 0, attendance: [{ personId: eligibleId, status: "PRESENT" }] }).expect(200);
    expect(saved.body.data).toMatchObject({ revision: 1, summary: { presentParticipants: 1 } });
    await request(app.getHttpServer()).put(path()).set("Authorization", leaderAuthorization)
      .send({ expectedRevision: 1, attendance: [{ personId: eligibleId, status: "ABSENT" }] }).expect(200);
    const reloaded = await request(app.getHttpServer()).get(path()).set("Authorization", leaderAuthorization).expect(200);
    expect(reloaded.body.data.participants.find((item: { personId: string }) => item.personId === eligibleId).status).toBe("ABSENT");
    await expect(database.meetingAttendance.create({ data: { churchId, meetingId, personId: eligibleId, attendanceStatus: "PRESENT" } })).rejects.toThrow();
    await expect(database.meetingAttendance.count({ where: { churchId, meetingId, personId: eligibleId } })).resolves.toBe(1);
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

  it("allows only one batch mutation for the same revision", async () => {
    const current = await request(app.getHttpServer()).get(path()).set("Authorization", leaderAuthorization).expect(200);
    const revision = current.body.data.revision as number;
    const [present, excused] = await Promise.all([
      request(app.getHttpServer()).put(path()).set("Authorization", leaderAuthorization)
        .send({ expectedRevision: revision, attendance: [{ personId: eligibleId, status: "PRESENT" }] }),
      request(app.getHttpServer()).put(path()).set("Authorization", leaderAuthorization)
        .send({ expectedRevision: revision, attendance: [{ personId: eligibleId, status: "EXCUSED" }] })
    ]);
    const statuses = [present.status, excused.status].sort((left, right) => left - right);
    expect(statuses).toEqual([200, 409]);
    const conflict = [present, excused].find((response) => response.status === 409);
    expect(conflict?.body.error.code).toBe("ATTENDANCE_REVISION_CONFLICT");
  });

  it("does not reveal or mutate attendance and contacts from another church", async () => {
    await request(app.getHttpServer()).get(`/cells/${otherCellId}/meetings/${otherMeetingId}/attendance`)
      .set("Authorization", leaderAuthorization).expect(404);
    await request(app.getHttpServer()).put(`/cells/${otherCellId}/meetings/${otherMeetingId}/attendance`)
      .set("Authorization", leaderAuthorization).send({ expectedRevision: 0, attendance: [] }).expect(404);
    await request(app.getHttpServer()).post(`${path()}/visitors`).set("Authorization", leaderAuthorization).set("Idempotency-Key", randomUUID())
      .send({ kind: "existing", personId: otherPersonId }).expect(404);

    const snapshot = await request(app.getHttpServer()).get(path()).set("Authorization", leaderAuthorization).expect(200);
    expect(JSON.stringify(snapshot.body.data)).not.toContain("+5511999999999");
    expect(await database.meetingAttendance.count({ where: { churchId: otherChurchId } })).toBe(0);
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
