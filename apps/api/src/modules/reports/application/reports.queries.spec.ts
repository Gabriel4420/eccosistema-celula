import { ReportsAuthorization } from "./reports.authorization";
import { ReportsQueries } from "./reports.queries";
import { ReportsError } from "./reports.error";
import { ReportsScopePolicy } from "../domain/reports.policy";
import type { ReportsRepository } from "./reports.port";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";

const NOW = new Date("2026-08-31T12:00:00.000Z");

function principal(roles: string[], userId = "user-1"): AuthenticatedPrincipal {
  return { userId, churchId: "church-1", sessionId: "session-1", roles };
}

function stubRepository(overrides: Partial<ReportsRepository> = {}): ReportsRepository {
  return {
    getChurchTimezone: overrides.getChurchTimezone ?? (async () => "America/Sao_Paulo"),
    findPendingReports: overrides.findPendingReports ?? (async () => ({ items: [], totalItems: 0 })),
    findAttendanceSummary: overrides.findAttendanceSummary ?? (async () => ({ items: [], totalItems: 0 })),
    findAttendanceDetail: overrides.findAttendanceDetail ?? (async () => ({ items: [], totalItems: 0 })),
    findVisitors: overrides.findVisitors ?? (async () => ({ items: [], totalItems: 0, metrics: { total: 0, contactPendingCount: 0, topCell: null } })),
    findMeetingsReport: overrides.findMeetingsReport ?? (async () => ({ items: [], totalItems: 0 })),
    exportCells: overrides.exportCells ?? (async () => []),
    exportPeople: overrides.exportPeople ?? (async () => []),
    exportAttendance: overrides.exportAttendance ?? (async () => []),
    exportMeetings: overrides.exportMeetings ?? (async () => []),
    assertCellInScope: overrides.assertCellInScope ?? (async () => ({ id: "", code: "", name: "" })),
    recordExport: overrides.recordExport ?? (async () => {}),
    getChurchName: overrides.getChurchName ?? (async () => "Igreja Teste")
  };
}

function queries(repository: ReportsRepository): ReportsQueries {
  const authorization = new ReportsAuthorization(new ReportsScopePolicy());
  return new ReportsQueries(repository, authorization, () => NOW);
}

describe("ReportsQueries", () => {
  it("resolves a 30-day inclusive period when no from/to is provided", async () => {
    const repository = stubRepository({
      findPendingReports: async (_churchId, _scope, input) => {
        expect(input.from).toBe("2026-08-02");
        expect(input.to).toBe("2026-08-31");
        return { items: [], totalItems: 0 };
      }
    });
    await queries(repository).pendingReports(principal(["ADMIN"]), {}, 1, 20);
  });

  it("forwards an explicit period unchanged", async () => {
    const repository = stubRepository({
      findPendingReports: async (_churchId, _scope, input) => {
        expect(input.from).toBe("2026-07-01");
        expect(input.to).toBe("2026-07-31");
        return { items: [], totalItems: 0 };
      }
    });
    await queries(repository).pendingReports(principal(["ADMIN"]), { from: "2026-07-01", to: "2026-07-31" }, 1, 20);
  });

  it("scopes the repository call to the leader cells", async () => {
    const repository = stubRepository({
      findVisitors: async (_churchId, scope, _input, page) => {
        expect(scope).toEqual({ kind: "leader", userId: "user-1" });
        expect(page).toBe(2);
        return { items: [], totalItems: 0, metrics: { total: 0, contactPendingCount: 0, topCell: null } };
      }
    });
    await queries(repository).visitors(principal(["LEADER"]), {}, 2, 20);
  });

  it("checks cell scope before returning attendance detail", async () => {
    const assertCellInScope: ReportsRepository["assertCellInScope"] = jest.fn(
  async () => ({ id: "cell-1", code: "C-01", name: "Célula 1" })
);
    const repository = stubRepository({ assertCellInScope });
    await queries(repository).attendanceDetail(principal(["SUPERVISOR"]), { cellId: "cell-1" }, 1, 20);
    expect(assertCellInScope).toHaveBeenCalledWith("church-1", { kind: "supervisor", userId: "user-1" }, "cell-1");
  });

  it("filters attendance summary by health band after the repository result", async () => {
    const repository = stubRepository({
      findAttendanceSummary: async () => ({
        items: [
          { cell: { id: "c1", code: "C-01", name: "Célula 1" }, leader: null, totalMeetings: 2, attendanceRate: 30, averagePresent: 5, totalVisitors: 1, healthBand: "critical" },
          { cell: { id: "c2", code: "C-02", name: "Célula 2" }, leader: null, totalMeetings: 2, attendanceRate: 90, averagePresent: 9, totalVisitors: 0, healthBand: "healthy" }
        ],
        totalItems: 2
      })
    });
    const result = await queries(repository).attendanceSummary(principal(["ADMIN"]), { health: "critical" }, 1, 20);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.cell.id).toBe("c1");
  });

  it("throws AUTH_FORBIDDEN for roles without report access", async () => {
    const repository = stubRepository({ findMeetingsReport: jest.fn() });
    await expect(queries(repository).meetingsReport(principal(["MEMBER"]), {}, 1, 20)).rejects.toThrow(ReportsError);
  });
});