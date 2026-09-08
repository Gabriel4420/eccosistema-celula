import { createRuntimeClient } from "@mission-atos/database";
import { randomUUID } from "node:crypto";
import { PrismaReportsRepository } from "./prisma-reports.repository";
import type { ReportsScope } from "../application/reports.types";
import { ReportsError } from "../application/reports.error";

describe("PrismaReportsRepository", () => {
  const databaseUrl = safeTestDatabaseUrl();
  const database = createRuntimeClient({ DATABASE_URL: databaseUrl });
  const churchId = randomUUID();
  const otherChurchId = randomUUID();
  const adminId = randomUUID();
  const leaderId = randomUUID();
  const otherAdminId = randomUUID();
  const repository = new PrismaReportsRepository(database);

  const cellId = randomUUID();
  const otherCellId = randomUUID();
  const memberId = randomUUID();
  const deletedMemberId = randomUUID();
  const visitorId = randomUUID();
  const meetingId = "00000000-0000-4000-8000-000000000001";

  beforeAll(async () => {
    await database.church.create({ data: { id: churchId, name: "Reports Repo", slug: `reports-repo-${churchId}` } });
    await database.church.create({ data: { id: otherChurchId, name: "Other Reports Repo", slug: `other-reports-repo-${otherChurchId}` } });

    const mkUser = (id: string, church: string, firstName: string, lastName = "Repo") => ({
      id, churchId: church, firstName, lastName,
      email: `${id}@example.test`, passwordHash: "integration-only-not-a-real-password-hash", status: "ACTIVE" as const
    });
    await database.user.create({ data: mkUser(adminId, churchId, "Admin") });
    await database.user.create({ data: mkUser(leaderId, churchId, "Leader") });
    await database.user.create({ data: mkUser(otherAdminId, otherChurchId, "Other") });

    await database.cell.create({ data: {
      id: cellId, churchId, code: `RPT-${churchId.slice(0, 4).toUpperCase()}`, name: "Célula de Frequência",
      status: "ACTIVE", leaderId, meetingDay: "SUNDAY", meetingTime: new Date("2000-01-01T19:00:00.000Z"), address: "Rua A"
    } });
    await database.cell.create({ data: {
      id: otherCellId, churchId: otherChurchId, code: `ORP-${otherChurchId.slice(0, 4).toUpperCase()}`, name: "Célula Outra Igreja",
      status: "ACTIVE", leaderId: otherAdminId, meetingDay: "SUNDAY", meetingTime: new Date("2000-01-01T19:00:00.000Z"), address: "Rua B"
    } });

    const mkPerson = (id: string, fullName: string, church: string, deleted = false) => ({
      id, churchId: church, fullName, deletedAt: deleted ? new Date() : null
    });
    await database.person.create({ data: mkPerson(memberId, "Membro Ativo", churchId) });
    await database.person.create({ data: mkPerson(deletedMemberId, "Membro Removido", churchId, true) });
    await database.person.create({ data: mkPerson(visitorId, "Visitante", churchId) });
    await database.person.create({ data: mkPerson(randomUUID(), "Outra Pessoa", otherChurchId) });

    await database.cellMembership.create({ data: { churchId, personId: memberId, cellId, status: "ACTIVE", joinedAt: new Date("2026-01-01T00:00:00.000Z") } });
    await database.cellMembership.create({ data: { churchId, personId: deletedMemberId, cellId, status: "ACTIVE", joinedAt: new Date("2026-01-01T00:00:00.000Z") } });

    await database.meeting.create({ data: {
      id: meetingId, churchId, cellId, meetingDate: new Date("2026-08-10T00:00:00.000Z"), status: "COMPLETED"
    } });
    await database.meetingAttendance.create({ data: {
      id: randomUUID(), churchId, meetingId: meetingId, personId: memberId, attendanceStatus: "PRESENT"
    } });
    await database.meetingAttendance.create({ data: {
      id: randomUUID(), churchId, meetingId: meetingId, personId: deletedMemberId, attendanceStatus: "PRESENT"
    } });
  });

  afterAll(async () => {
    await database.$executeRaw`DELETE FROM "report_exports" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "meeting_visitors" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "meeting_attendances" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "meeting_reports" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "meetings" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "cell_memberships" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "people" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "cells" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "users" WHERE "church_id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$executeRaw`DELETE FROM "churches" WHERE "id" IN (${churchId}::uuid, ${otherChurchId}::uuid)`;
    await database.$disconnect();
  });

  it("isolates attendance summary to the church and excludes deleted people while counting visitors", async () => {
    await database.meetingAttendance.create({ data: {
      id: randomUUID(), churchId, meetingId: meetingId, personId: visitorId, attendanceStatus: "PRESENT"
    } });
    await database.meetingVisitor.create({ data: {
      id: randomUUID(), churchId, meetingId: meetingId, personId: visitorId
    } });

    const churchScope: ReportsScope = { kind: "church" };
    const result = await repository.findAttendanceSummary(churchId, churchScope, { from: "2026-08-01", to: "2026-08-31", status: "ACTIVE" }, 1, 20);

    const row = result.items.find((item) => item.cell.id === cellId);
    expect(row).toBeDefined();
    expect(row?.totalMeetings).toBe(1);
    expect(row?.attendanceRate).toBe(100);
    expect(row?.totalVisitors).toBe(1);
    expect(row?.averagePresent).toBe(3);
    expect(result.items.some((item) => item.cell.id === otherCellId)).toBe(false);
  });

  it("throws REPORT_CELL_NOT_FOUND when the cell belongs to another church", async () => {
    const churchScope: ReportsScope = { kind: "church" };
    await expect(repository.assertCellInScope(churchId, churchScope, otherCellId)).rejects.toBeInstanceOf(ReportsError);
    try {
      await repository.assertCellInScope(churchId, churchScope, otherCellId);
    } catch (error) {
      if (error instanceof ReportsError) expect(error.code).toBe("REPORT_CELL_NOT_FOUND");
      else throw error;
    }
  });

  it("restricts a leader scope to their own cells", async () => {
    const leaderScope: ReportsScope = { kind: "leader", userId: leaderId };
    await expect(repository.assertCellInScope(churchId, leaderScope, cellId)).resolves.toMatchObject({ id: cellId });
    await expect(repository.assertCellInScope(churchId, leaderScope, otherCellId)).rejects.toBeInstanceOf(ReportsError);
  });

  it("orders pending reports by days since meeting descending and returns submittedAt for returned reports", async () => {
    await database.meetingReport.create({ data: {
      id: randomUUID(), churchId, meetingId: meetingId, status: "DRAFT"
    } });

    const secondMeetingId = "00000000-0000-4000-8000-000000000002";
    await database.meeting.create({ data: {
      id: secondMeetingId, churchId, cellId, meetingDate: new Date("2026-08-01T00:00:00.000Z"), status: "COMPLETED"
    } });
    const returned = await database.meetingReport.create({ data: {
      id: randomUUID(), churchId, meetingId: secondMeetingId, status: "RETURNED",
      submittedBy: leaderId, submittedAt: new Date("2026-08-20T00:00:00.000Z")
    } });

    const result = await repository.findPendingReports(churchId, { kind: "church" }, { from: "2026-07-01", to: "2026-08-31" }, 1, 20);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]!.cell.id).toBe(cellId);
    expect(result.items[0]!.daysSinceMeeting).toBeGreaterThanOrEqual(result.items[1]!.daysSinceMeeting);
    expect(result.totalItems).toBe(2);

    const returnedRow = result.items.find((item) => item.reportStatus === "RETURNED");
    expect(returnedRow?.lastReturnedAt).toBe(returned.submittedAt!.toISOString());
  });

  it("records an export audit row with scope and row count", async () => {
    await repository.recordExport({ churchId, exportedBy: adminId, reportType: "cells", format: "csv", scope: { kind: "church" }, rowCount: 3 });
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