import { DashboardAnalyticsAuthorization } from "./dashboard-analytics.authorization";
import { DashboardAnalyticsQueries, fillMonthlySeries } from "./dashboard-analytics.queries";
import type { DashboardAnalyticsRepository } from "./dashboard-analytics.port";
import { DashboardAnalyticsScopePolicy } from "../domain/dashboard-analytics.policy";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";

const NOW = new Date("2026-08-31T12:00:00.000Z");

function principal(roles: string[], userId = "user-1"): AuthenticatedPrincipal {
  return { userId, churchId: "church-1", sessionId: "session-1", roles };
}

function stubRepository(overrides: Partial<DashboardAnalyticsRepository> = {}): DashboardAnalyticsRepository {
  return {
    getChurchTimezone: overrides.getChurchTimezone ?? (async () => "America/Sao_Paulo"),
    totals: overrides.totals ?? (async () => ({ people: 0, activeCells: 0, formingCells: 0, members: 0 })),
    meetingCounts: overrides.meetingCounts ?? (async () => ({ total: 0, completed: 0 })),
    attendance: overrides.attendance ?? (async () => ({ presentSum: 0, eligibleSum: 0, totalPresentSum: 0, completedCount: 0, visitorCount: 0 })),
    monthlySeries: overrides.monthlySeries ?? (async () => []),
    cellSummaries: overrides.cellSummaries ?? (async () => [])
  };
}

function queries(repository: DashboardAnalyticsRepository): DashboardAnalyticsQueries {
  const authorization = new DashboardAnalyticsAuthorization(new DashboardAnalyticsScopePolicy());
  return new DashboardAnalyticsQueries(repository, authorization, () => NOW);
}

describe("fillMonthlySeries", () => {
  it("fills missing months with zero rows", () => {
    const result = fillMonthlySeries(
      [{ month: "2026-08", meetings: 4, completed: 3, presentMembers: 12, visitors: 1 }],
      "2026-07",
      "2026-08"
    );
    expect(result).toEqual([
      { month: "2026-07", meetings: 0, completed: 0, presentMembers: 0, visitors: 0 },
      { month: "2026-08", meetings: 4, completed: 3, presentMembers: 12, visitors: 1 }
    ]);
  });
});

describe("DashboardAnalyticsQueries", () => {
  it("scopes a leader to their own cells and computes weighted attendance rate", async () => {
    const repository = stubRepository({
      getChurchTimezone: async () => "America/Sao_Paulo",
      totals: async (_churchId, scope) => {
        expect(scope).toEqual({ kind: "leader", userId: "user-1" });
        return { people: 10, activeCells: 1, formingCells: 0, members: 5 };
      },
      meetingCounts: async () => ({ total: 4, completed: 3 }),
      attendance: async () => ({ presentSum: 18, eligibleSum: 24, totalPresentSum: 21, completedCount: 3, visitorCount: 3 })
    });
    const service = queries(repository);
    const result = await service.overview(principal(["LEADER"]), {});
    expect(result.attendance.attendanceRate).toBe(75);
    expect(result.attendance.averagePresent).toBe(7);
    expect(result.visitors.total).toBe(3);
    expect(result.meetings.completionRate).toBe(75);
  });

  it("treats a zero eligible denominator as a null attendance rate", async () => {
    const repository = stubRepository({
      attendance: async () => ({ presentSum: 0, eligibleSum: 0, totalPresentSum: 0, completedCount: 2, visitorCount: 0 })
    });
    const service = queries(repository);
    const result = await service.overview(principal(["ADMIN"]), {});
    expect(result.attendance.attendanceRate).toBeNull();
    expect(result.attendance.averagePresent).toBe(0);
  });

  it("returns an empty scope for a supervisor without assignments", async () => {
    const repository = stubRepository({
      totals: async (_churchId, scope) => {
        expect(scope).toEqual({ kind: "supervisor", userId: "user-1" });
        return { people: 0, activeCells: 0, formingCells: 0, members: 0 };
      },
      meetingCounts: async () => ({ total: 0, completed: 0 })
    });
    const service = queries(repository);
    const result = await service.cellsSummary(principal(["SUPERVISOR"]), { windowDays: 14 });
    expect(result.cells).toEqual([]);
    expect(result.withoutRecentMeeting).toBe(0);
  });

  it("denies roles outside the hierarchy", async () => {
    const service = queries(stubRepository());
    await expect(service.overview(principal(["MEMBER"]), {})).rejects.toThrow(/Access is not allowed/);
  });
});
