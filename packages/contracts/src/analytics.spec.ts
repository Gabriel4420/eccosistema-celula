import {
  cellsSummaryEnvelopeSchema,
  cellsSummaryQuerySchema,
  overviewEnvelopeSchema,
  overviewQuerySchema,
  seriesEnvelopeSchema,
  seriesQuerySchema
} from "./analytics";

describe("analytics contracts", () => {
  describe("overviewQuerySchema", () => {
    it("defaults to an empty query (30d server-side)", () => {
      expect(overviewQuerySchema.parse({})).toEqual({});
    });

    it("accepts 30d period", () => {
      expect(overviewQuerySchema.parse({ period: "30d" })).toEqual({ period: "30d" });
    });

    it("accepts civil from/to", () => {
      expect(overviewQuerySchema.parse({ from: "2026-08-01", to: "2026-08-31" }))
        .toEqual({ from: "2026-08-01", to: "2026-08-31" });
    });

    it("rejects period combined with from/to", () => {
      expect(() => overviewQuerySchema.parse({ period: "30d", from: "2026-08-01", to: "2026-08-31" })).toThrow();
    });

    it("rejects a partial from/to pair", () => {
      expect(() => overviewQuerySchema.parse({ from: "2026-08-01" })).toThrow();
    });

    it("rejects from after to", () => {
      expect(() => overviewQuerySchema.parse({ from: "2026-08-31", to: "2026-08-01" })).toThrow();
    });

    it("rejects spans longer than 366 days", () => {
      expect(() => overviewQuerySchema.parse({ from: "2025-01-01", to: "2026-12-31" })).toThrow();
    });

    it("rejects invalid dates and unknown fields", () => {
      expect(() => overviewQuerySchema.parse({ from: "2026-02-31", to: "2026-03-01" })).toThrow();
      expect(() => overviewQuerySchema.parse({ churchId: "x" })).toThrow();
      expect(() => overviewQuerySchema.parse({ period: "90d" })).toThrow();
    });
  });

  describe("seriesQuerySchema", () => {
    it("defaults granularity to monthly", () => {
      expect(seriesQuerySchema.parse({})).toEqual({ granularity: "monthly" });
    });

    it("rejects from after to", () => {
      expect(() => seriesQuerySchema.parse({ from: "2026-08-31", to: "2026-08-01" })).toThrow();
    });

    it("rejects unknown granularity and fields", () => {
      expect(() => seriesQuerySchema.parse({ granularity: "weekly" })).toThrow();
      expect(() => seriesQuerySchema.parse({ windowDays: 14 })).toThrow();
    });
  });

  describe("cellsSummaryQuerySchema", () => {
    it("defaults windowDays to 14 and status to ACTIVE", () => {
      expect(cellsSummaryQuerySchema.parse({})).toEqual({ windowDays: 14, status: "ACTIVE" });
    });

    it("coerces and bounds windowDays", () => {
      expect(cellsSummaryQuerySchema.parse({ windowDays: "30" })).toEqual({ windowDays: 30, status: "ACTIVE" });
      expect(() => cellsSummaryQuerySchema.parse({ windowDays: 1 })).toThrow();
      expect(() => cellsSummaryQuerySchema.parse({ windowDays: 91 })).toThrow();
    });

    it("accepts status and rejects unknown fields", () => {
      expect(cellsSummaryQuerySchema.parse({ status: "ACTIVE" })).toEqual({ windowDays: 14, status: "ACTIVE" });
      expect(cellsSummaryQuerySchema.parse({ status: "FORMING" })).toEqual({ windowDays: 14, status: "FORMING" });
      expect(() => cellsSummaryQuerySchema.parse({ status: "OPEN" })).toThrow();
      expect(() => cellsSummaryQuerySchema.parse({ churchId: "x" })).toThrow();
    });
  });

  it("validates the overview envelope with nullable attendanceRate", () => {
    const data = {
      period: { from: "2026-08-02", to: "2026-08-31", prevFrom: "2026-07-03", prevTo: "2026-08-01" },
      totals: { people: 10, activeCells: 2, formingCells: 0, members: 8 },
      meetings: { total: 4, completed: 3, completionRate: 75 },
      attendance: { attendanceRate: null, averagePresent: 5 },
      visitors: { total: 1 }
    };
    expect(overviewEnvelopeSchema.parse({ data, meta: {} })).toMatchObject({ data: { attendance: { attendanceRate: null } } });
  });

  it("validates the series and cells summary envelopes", () => {
    const series = [{ month: "2026-08", meetings: 4, completed: 3, presentMembers: 12, visitors: 1 }];
    expect(seriesEnvelopeSchema.parse({ data: series, meta: {} })).toMatchObject({ data: series });

    const cells = {
      cells: [{ id: crypto.randomUUID(), code: "A1", name: "Cell", status: "ACTIVE", lastCompletedAt: "2026-08-20", membersCount: 5 }],
      withoutRecentMeeting: 1,
      recentMeetingWindowDays: 14
    };
    expect(cellsSummaryEnvelopeSchema.parse({ data: cells, meta: {} })).toMatchObject({ data: cells });
  });
});
