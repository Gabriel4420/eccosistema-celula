import { addDays, civilDateOf, civilDayBounds, civilSpanDays, resolvePeriodBounds, startOfCivilDay, endOfCivilDay } from "./dashboard-analytics.time";

describe("dashboard analytics time helpers", () => {
  describe("resolvePeriodBounds", () => {
    it("builds the current and previous 30-day periods by default", () => {
      const now = new Date("2026-08-31T12:00:00.000Z");
      const bounds = resolvePeriodBounds({}, now, "America/Sao_Paulo");
      expect(bounds.to).toBe("2026-08-31");
      expect(bounds.from).toBe("2026-08-02");
      expect(bounds.prevTo).toBe("2026-08-01");
      expect(bounds.prevFrom).toBe("2026-07-03");
    });

    it("uses explicit from/to and derives the previous equal-length period", () => {
      const bounds = resolvePeriodBounds({ from: "2026-08-10", to: "2026-08-31" }, new Date(), "UTC");
      expect(bounds.prevTo).toBe("2026-08-09");
      expect(civilSpanDays(bounds.from, bounds.to)).toBe(civilSpanDays(bounds.prevFrom, bounds.prevTo));
      expect(bounds.prevFrom).toBe("2026-07-19");
    });

    it("matches previous period span to current span for non-30-day ranges", () => {
      const bounds = resolvePeriodBounds({ from: "2026-08-01", to: "2026-08-07" }, new Date(), "UTC");
      expect(bounds.prevTo).toBe("2026-07-31");
      expect(bounds.prevFrom).toBe("2026-07-25");
      expect(civilSpanDays(bounds.from, bounds.to)).toBe(7);
      expect(civilSpanDays(bounds.prevFrom, bounds.prevTo)).toBe(7);
    });

    it("handles single-day periods", () => {
      const bounds = resolvePeriodBounds({ from: "2026-08-15", to: "2026-08-15" }, new Date(), "UTC");
      expect(bounds.prevTo).toBe("2026-08-14");
      expect(bounds.prevFrom).toBe("2026-08-14");
      expect(civilSpanDays(bounds.prevFrom, bounds.prevTo)).toBe(1);
    });
  });

  describe("addDays", () => {
    it("shifts civil dates across month and year boundaries", () => {
      expect(addDays("2026-08-01", -1)).toBe("2026-07-31");
      expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
      expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    });
  });

  describe("civilDateOf", () => {
    it("returns the civil date in the given timezone", () => {
      expect(civilDateOf(new Date("2026-08-31T23:30:00.000Z"), "America/Sao_Paulo")).toBe("2026-08-31");
      expect(civilDateOf(new Date("2026-08-31T23:30:00.000Z"), "UTC")).toBe("2026-08-31");
    });
  });

  describe("civilDayBounds", () => {
    it("returns start before end for a civil day", () => {
      const { start, end } = civilDayBounds("2026-08-22", "America/Sao_Paulo");
      expect(start.getTime()).toBeLessThan(end.getTime());
      expect(startOfCivilDay("2026-08-22", "UTC").toISOString()).toBe("2026-08-22T00:00:00.000Z");
      expect(endOfCivilDay("2026-08-22", "UTC").toISOString()).toBe("2026-08-23T00:00:00.000Z");
    });
  });
});
