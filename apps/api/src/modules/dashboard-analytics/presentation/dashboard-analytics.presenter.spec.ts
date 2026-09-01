import { presentCellsSummary, presentOverview, presentSeries } from "./dashboard-analytics.presenter";
import type { OverviewResult } from "../application/dashboard-analytics.types";

describe("dashboard analytics presenter", () => {
  it("presents an overview with a nullable attendance rate", () => {
    const result: OverviewResult = {
      period: { from: "2026-08-02", to: "2026-08-31", prevFrom: "2026-07-03", prevTo: "2026-08-01" },
      totals: { people: 10, activeCells: 2, formingCells: 1, members: 8 },
      meetings: { total: 4, completed: 3, completionRate: 75 },
      attendance: { attendanceRate: null, averagePresent: 5.5 },
      visitors: { total: 2 },
      delta: { people: null, activeCells: null, formingCells: null, members: null, meetings: 1, completedMeetings: 1, completionRate: 10, attendanceRate: null, averagePresent: 0.5, visitors: 1 }
    };
    expect(presentOverview(result)).toEqual({
      period: expect.any(Object), totals: expect.any(Object), meetings: expect.any(Object),
      attendance: { attendanceRate: null, averagePresent: 5.5 }, visitors: { total: 2 }, delta: expect.any(Object)
    });
  });

  it("maps series points without leaking extra fields", () => {
    const points = [{ month: "2026-08", meetings: 4, completed: 3, presentMembers: 12, visitors: 1 }];
    expect(presentSeries(points)).toEqual(points);
  });

  it("maps cell summaries keeping lastCompletedAt nullability", () => {
    const result = {
      cells: [
        { id: "cell-1", code: "A1", name: "Cell", status: "ACTIVE" as const, lastCompletedAt: null, membersCount: 0 }
      ],
      withoutRecentMeeting: 1,
      recentMeetingWindowDays: 14
    };
    expect(presentCellsSummary(result)).toMatchObject({ withoutRecentMeeting: 1, cells: [{ lastCompletedAt: null }] });
  });
});
