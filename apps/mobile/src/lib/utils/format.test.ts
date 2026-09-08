import {
  formatDateBR,
  formatDateBRFromISO,
  formatPercentage,
  formatFileSize,
  formatMeetingDay,
  toISODate
} from "./format";

describe("format", () => {
  it("formats a civil date to pt-BR", () => {
    expect(formatDateBR("2025-04-10")).toBe("10/04/2025");
  });

  it("formats an ISO date string", () => {
    expect(formatDateBRFromISO("2025-04-10T14:30:00.000Z")).toBeTruthy();
  });

  it("handles percentage null", () => {
    expect(formatPercentage(null)).toBe("--");
  });

  it("rounds percentages", () => {
    expect(formatPercentage(76.4)).toBe("76%");
  });

  it("formats file sizes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(1_048_576)).toBe("1.0 MB");
  });

  it("maps meeting days to pt-BR", () => {
    expect(formatMeetingDay("WEDNESDAY")).toBe("Quarta");
    expect(formatMeetingDay("UNKNOWN")).toBe("UNKNOWN");
  });

  it("serializes a Date to YYYY-MM-DD", () => {
    expect(toISODate(new Date(2025, 3, 10))).toBe("2025-04-10");
  });
});