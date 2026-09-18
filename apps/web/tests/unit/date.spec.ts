import { maskDateBR } from "@/src/shared/components";
import {
  formatDateBR,
  isValidDateBR,
  parseDateBR,
} from "@/src/features/people/lib/date";

describe("formatDateBR", () => {
  it("formats an ISO date with leading zeros", () => {
    expect(formatDateBR("2026-09-15")).toBe("15/09/2026");
    expect(formatDateBR("1999-03-05")).toBe("05/03/1999");
  });

  it("formats a Date using the local calendar", () => {
    expect(formatDateBR(new Date(2026, 8, 15))).toBe("15/09/2026");
  });

  it("returns an empty string for empty values", () => {
    expect(formatDateBR(null)).toBe("");
    expect(formatDateBR(undefined)).toBe("");
    expect(formatDateBR("")).toBe("");
  });

  it("returns an empty string for unrecognized values", () => {
    expect(formatDateBR("15/09/2026")).toBe("");
    expect(formatDateBR("not-a-date")).toBe("");
  });
});

describe("parseDateBR", () => {
  it("converts DD/MM/AAAA to ISO storage format", () => {
    expect(parseDateBR("15/09/2026")).toBe("2026-09-15");
    expect(parseDateBR("05/03/1999")).toBe("1999-03-05");
  });

  it("returns an empty string for invalid input", () => {
    expect(parseDateBR("5/3/1999")).toBe("");
    expect(parseDateBR("15092026")).toBe("");
    expect(parseDateBR("")).toBe("");
  });
});

describe("isValidDateBR", () => {
  it("accepts real calendar dates", () => {
    expect(isValidDateBR("15/09/2026")).toBe(true);
    expect(isValidDateBR("30/04/2025")).toBe(true);
    expect(isValidDateBR("31/01/2025")).toBe(true);
  });

  it("accepts February 29 on leap years", () => {
    expect(isValidDateBR("29/02/2024")).toBe(true);
    expect(isValidDateBR("29/02/2000")).toBe(true);
  });

  it("rejects February 29 on non-leap years", () => {
    expect(isValidDateBR("29/02/2023")).toBe(false);
    expect(isValidDateBR("29/02/1900")).toBe(false);
  });

  it("rejects impossible dates", () => {
    expect(isValidDateBR("31/02/2025")).toBe(false);
    expect(isValidDateBR("13/13/2020")).toBe(false);
    expect(isValidDateBR("00/05/2020")).toBe(false);
    expect(isValidDateBR("31/04/2025")).toBe(false);
    expect(isValidDateBR("31/06/2025")).toBe(false);
  });

  it("requires the DD/MM/AAAA shape", () => {
    expect(isValidDateBR("5/3/1999")).toBe(false);
    expect(isValidDateBR("15/09/26")).toBe(false);
    expect(isValidDateBR("2026-09-15")).toBe(false);
    expect(isValidDateBR("")).toBe(false);
  });
});

describe("maskDateBR", () => {
  it("formats digits into DD/MM/AAAA while typing", () => {
    expect(maskDateBR("15092026")).toBe("15/09/2026");
  });

  it("formats partial input progressively", () => {
    expect(maskDateBR("1")).toBe("1");
    expect(maskDateBR("15")).toBe("15");
    expect(maskDateBR("1509")).toBe("15/09");
    expect(maskDateBR("15092")).toBe("15/09/2");
  });

  it("blocks non-digit characters", () => {
    expect(maskDateBR("15-09-2026")).toBe("15/09/2026");
    expect(maskDateBR("abc")).toBe("");
  });

  it("caps input at eight digits", () => {
    expect(maskDateBR("15092026123")).toBe("15/09/2026");
  });

  it("is idempotent on an already formatted value", () => {
    expect(maskDateBR("15/09/2026")).toBe("15/09/2026");
  });

  it("returns an empty string for empty input", () => {
    expect(maskDateBR("")).toBe("");
  });
});