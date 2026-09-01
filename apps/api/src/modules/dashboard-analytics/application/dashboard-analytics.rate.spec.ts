import { aggregateAttendanceRate } from "./dashboard-analytics.rate";

describe("aggregateAttendanceRate", () => {
  it("returns null when the eligible denominator is zero", () => {
    expect(aggregateAttendanceRate(0, 0)).toBeNull();
    expect(aggregateAttendanceRate(5, 0)).toBeNull();
  });

  it("returns 0 when nothing is present but there are eligible people", () => {
    expect(aggregateAttendanceRate(0, 10)).toBe(0);
  });

  it("computes the weighted ratio over summed eligible people", () => {
    expect(aggregateAttendanceRate(15, 20)).toBe(75);
  });

  it("rounds to two decimal places like the domain", () => {
    expect(aggregateAttendanceRate(1, 3)).toBe(33.33);
    expect(aggregateAttendanceRate(2, 3)).toBe(66.67);
  });

  it("caps at 100 when present exceeds eligible", () => {
    expect(aggregateAttendanceRate(12, 10)).toBe(100);
    expect(aggregateAttendanceRate(200, 100)).toBe(100);
  });
});
