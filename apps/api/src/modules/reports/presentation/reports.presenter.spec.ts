import { presentPendingReports, presentAttendanceSummary, presentVisitors } from "./reports.presenter";
import type { PendingReportRow, AttendanceSummaryRow, VisitorReportRow, VisitorMetrics } from "../application/reports.types";

describe("reports presenter", () => {
  it("flattens pending report rows into the envelope shape with pagination meta", () => {
    const rows: PendingReportRow[] = [{
      cell: { id: "c1", code: "C-01", name: "Célula 1" },
      leader: { firstName: "Ana", lastName: "Souza" },
      meetingDate: "2026-08-10",
      daysSinceMeeting: 21,
      reportStatus: "DRAFT",
      lastReturnedAt: null
    }];
    const result = presentPendingReports({ items: rows, totalItems: 1 }, 1, 20);
    expect(result.data[0]!).toEqual({ ...rows[0]! });
    expect(result.meta).toEqual({ page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
  });

  it("rounds average present from the row value", () => {
    const rows: AttendanceSummaryRow[] = [{
      cell: { id: "c1", code: "C-01", name: "Célula 1" },
      leader: null,
      totalMeetings: 3,
      attendanceRate: 77,
      averagePresent: 6.5,
      totalVisitors: 2,
      healthBand: "attention"
    }];
    const result = presentAttendanceSummary({ items: rows, totalItems: 1 }, 1, 20);
    expect(result.data[0]!.averagePresent).toBe(6.5);
    expect(result.data[0]!.healthBand).toBe("attention");
  });

  it("presents visitor metrics and top cell", () => {
    const rows: VisitorReportRow[] = [{
      person: { id: "p1", fullName: "João", phone: null },
      cell: { id: "c1", code: "C-01", name: "Célula 1" },
      meetingDate: "2026-08-10",
      invitedBy: { fullName: "Ana" },
      observation: null,
      contactPending: true
    }];
    const metrics: VisitorMetrics = { total: 1, contactPendingCount: 1, topCell: { id: "c1", code: "C-01", name: "Célula 1", count: 1 } };
    const result = presentVisitors(rows, 1, metrics, 1, 20);
    expect(result.data[0]!.person).toMatchObject({ id: "p1", fullName: "João" });
    expect(result.data[0]!.invitedBy).toEqual({ fullName: "Ana" });
    expect(result.metrics.topCell).toEqual(metrics.topCell);
  });
});