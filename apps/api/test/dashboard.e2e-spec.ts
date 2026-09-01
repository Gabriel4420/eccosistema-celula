import { createRuntimeClient } from "@mission-atos/database";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { hash } from "argon2";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("dashboard analytics HTTP flow", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const churchId = randomUUID();
  const otherChurchId = randomUUID();
  const timezone = "America/Sao_Paulo";
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  let app: INestApplication;

  const adminId = randomUUID();
  const leaderId = randomUUID();
  const traineeId = randomUUID();
  const supervisorId = randomUUID();
  const leader2Id = randomUUID();
  const cell1Id = randomUUID();
  const cell2Id = randomUUID();
  const memberAId = randomUUID();
  const memberBId = randomUUID();
  const memberCId = randomUUID();
  const lonePersonId = randomUUID();
  const visitorPersonId = randomUUID();
  const meetingM1Id = randomUUID();
  const meetingM2Id = randomUUID();
  const meetingM3Id = randomUUID();
  const meetingMOtherId = randomUUID();
  const password = "dashboard-e2e-password-123";

  let adminAuth: string;
  let leaderAuth: string;
  let supervisorAuth: string;

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: "test", DATABASE_URL: databaseUrl, AUTH_CHURCH_ID: churchId,
      JWT_ACCESS_SECRET: "dashboard-e2e-jwt-secret-at-least-32-characters",
      REFRESH_TOKEN_PEPPER: "dashboard-e2e-refresh-pepper-is-distinct-long",
      AUTH_COOKIE_SECURE: "false", CORS_ORIGINS: "http://localhost:3000"
    });
    await database.church.create({ data: { id: churchId, name: "Dashboard E2E", slug: `dashboard-${churchId}`, timezone } });
    await database.church.create({ data: { id: otherChurchId, name: "Other Dashboard", slug: `dashboard-${otherChurchId}` } });

    await createRole("ADMIN");
    await createRole("SUPERVISOR");
    await createRole("LEADER");
    await createUser(adminId, "ADMIN");
    await createUser(leaderId, "LEADER");
    await createUser(traineeId, "LEADER");
    await createUser(supervisorId, "SUPERVISOR");
    await createUser(leader2Id, "LEADER");

    await database.cell.create({ data: { id: cell1Id, churchId, code: "DB-C1", name: "Dashboard Cell 1", status: "ACTIVE", leaderId, traineeLeaderId: traineeId, meetingDay: "SATURDAY", meetingTime: new Date("1970-01-01T19:00:00Z"), address: "Test" } });
    await database.cell.create({ data: { id: cell2Id, churchId, code: "DB-C2", name: "Dashboard Cell 2", status: "ACTIVE", leaderId: leader2Id, meetingDay: "SATURDAY", meetingTime: new Date("1970-01-01T19:00:00Z"), address: "Test" } });
    await database.supervisorAssignment.create({ data: { churchId, supervisorId, leaderId } });

    await database.person.createMany({ data: [
      { id: memberAId, churchId, fullName: "Member A" },
      { id: memberBId, churchId, fullName: "Member B" },
      { id: memberCId, churchId, fullName: "Member C" },
      { id: lonePersonId, churchId, fullName: "Lone Person" },
      { id: visitorPersonId, churchId, fullName: "Visitor Person" },
      { id: randomUUID(), churchId: otherChurchId, fullName: "Other Church Person" }
    ] });
    await database.cellMembership.createMany({ data: [
      { churchId, cellId: cell1Id, personId: memberAId, status: "ACTIVE", joinedAt: new Date("2026-08-01T06:00:00.000Z") },
      { churchId, cellId: cell1Id, personId: memberBId, status: "ACTIVE", joinedAt: new Date("2026-08-01T06:00:00.000Z") },
      { churchId, cellId: cell1Id, personId: memberCId, status: "ACTIVE", joinedAt: new Date("2026-08-01T06:00:00.000Z") }
    ] });

    await database.meeting.createMany({ data: [
      { id: meetingM1Id, churchId, cellId: cell1Id, meetingDate: new Date("2026-08-10"), status: "COMPLETED" },
      { id: meetingM2Id, churchId, cellId: cell1Id, meetingDate: new Date("2026-08-20"), status: "COMPLETED" },
      { id: meetingM3Id, churchId, cellId: cell1Id, meetingDate: new Date("2026-08-15"), status: "SCHEDULED" },
      { id: meetingMOtherId, churchId, cellId: cell2Id, meetingDate: new Date("2026-08-12"), status: "COMPLETED" }
    ] });
    await database.meetingAttendance.createMany({ data: [
      { churchId, meetingId: meetingM1Id, personId: memberAId, attendanceStatus: "PRESENT" },
      { churchId, meetingId: meetingM1Id, personId: memberBId, attendanceStatus: "PRESENT" },
      { churchId, meetingId: meetingM1Id, personId: memberCId, attendanceStatus: "PRESENT" },
      { churchId, meetingId: meetingM1Id, personId: visitorPersonId, attendanceStatus: "PRESENT" },
      { churchId, meetingId: meetingM2Id, personId: memberAId, attendanceStatus: "PRESENT" }
    ] });
    await database.meetingVisitor.create({ data: { churchId, meetingId: meetingM1Id, personId: visitorPersonId } });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication(); app.use(cookieParser()); await app.init();
    adminAuth = await login(adminId);
    leaderAuth = await login(leaderId);
    supervisorAuth = await login(supervisorId);
  });

  afterAll(async () => {
    if (app) await app.close();
    for (const table of ["idempotency_requests", "sessions", "audit_logs", "meeting_visitors", "meeting_attendances", "meetings", "cell_memberships", "supervisor_assignments", "people", "cells", "user_roles", "roles", "users"]) {
      await database.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "church_id" IN ($1::uuid, $2::uuid)`, churchId, otherChurchId);
    }
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${churchId}::uuid`;
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" = ${otherChurchId}::uuid`;
    await database.$disconnect();
  });

  it("returns overview indicators for the church scope", async () => {
    const response = await request(app.getHttpServer())
      .get("/dashboard/overview?from=2026-08-01&to=2026-08-31")
      .set("Authorization", adminAuth).expect(200);
    const data = response.body.data;
    expect(data.totals).toEqual({ people: 5, activeCells: 2, formingCells: 0, members: 3 });
    expect(data.meetings).toMatchObject({ total: 4, completed: 3, completionRate: 75 });
    expect(data.attendance).toMatchObject({ attendanceRate: 66.67, averagePresent: 1.67 });
    expect(data.visitors).toEqual({ total: 1 });
  });

  it("restricts the leader scope to their own cells", async () => {
    const response = await request(app.getHttpServer())
      .get("/dashboard/overview?from=2026-08-01&to=2026-08-31")
      .set("Authorization", leaderAuth).expect(200);
    const data = response.body.data;
    expect(data.totals).toEqual({ people: 5, activeCells: 1, formingCells: 0, members: 3 });
    expect(data.meetings).toMatchObject({ total: 3, completed: 2, completionRate: 66.67 });
    expect(data.visitors).toEqual({ total: 1 });
  });

  it("restricts the supervisor scope to assigned leaders", async () => {
    const response = await request(app.getHttpServer())
      .get("/dashboard/overview?from=2026-08-01&to=2026-08-31")
      .set("Authorization", supervisorAuth).expect(200);
    const data = response.body.data;
    expect(data.totals).toMatchObject({ activeCells: 1, members: 3 });
    expect(data.meetings).toMatchObject({ total: 3, completed: 2 });
  });

  it("returns a monthly series and fills zero months", async () => {
    const response = await request(app.getHttpServer())
      .get("/dashboard/series?from=2026-07-01&to=2026-08-31")
      .set("Authorization", adminAuth).expect(200);
    const data = response.body.data;
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({ month: "2026-07", meetings: 0, completed: 0, presentMembers: 0, visitors: 0 });
    expect(data[1]).toMatchObject({ month: "2026-08", meetings: 4, completed: 3, presentMembers: 4, visitors: 1 });
  });

  it("isolates data between churches", async () => {
    const response = await request(app.getHttpServer())
      .get("/dashboard/overview?from=2026-08-01&to=2026-08-31")
      .set("Authorization", adminAuth).expect(200);
    expect(response.body.data.totals.people).toBe(5);
    expect(response.body.data.meetings.total).toBe(4);
  });

  it("lists cells and reports those without a recent meeting", async () => {
    const response = await request(app.getHttpServer())
      .get("/dashboard/cells/summary?windowDays=5")
      .set("Authorization", adminAuth).expect(200);
    const data = response.body.data;
    expect(data.recentMeetingWindowDays).toBe(5);
    const row = data.cells.find((cell: { id: string }) => cell.id === cell1Id);
    expect(row).toMatchObject({ code: "DB-C1", status: "ACTIVE", membersCount: 3 });
  });

  it("rejects invalid query input and denies unknown roles", async () => {
    await request(app.getHttpServer()).get("/dashboard/overview?from=2026-08-31&to=2026-08-01")
      .set("Authorization", adminAuth).expect(400);
  });

  async function createRole(name: string): Promise<void> {
    await database.role.create({ data: { id: randomUUID(), churchId, name } });
  }

  async function createUser(userId: string, roleName: string): Promise<void> {
    const role = await database.role.findFirst({ where: { churchId, name: roleName }, select: { id: true } });
    await database.user.create({ data: { id: userId, churchId, firstName: "User", lastName: roleName, email: `${userId}@example.test`, passwordHash: await hash(password), status: "ACTIVE" } });
    if (role) await database.userRole.create({ data: { churchId, userId, roleId: role.id } });
  }

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
